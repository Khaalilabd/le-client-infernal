// Service d'embeddings partagé : transforme des textes en vecteurs numériques (RAG, similarité).
//
//   import { embedTexts } from '../../shared/ai/embeddings.js';
//   const { vectors, provider, model } = await embedTexts(['texte 1', 'texte 2'], { module: 'client-generator' });
//
// Fournisseurs : openai (POST /embeddings, compatible avec OPENAI_BASE_URL) et ollama (POST /api/embed).
// Sans fournisseur d'embeddings (mock, claude sans clé OpenAI, AI_EMBEDDING_PROVIDER=none), l'appel lève
// AI_EMBEDDINGS_UNAVAILABLE : le module appelant utilise alors sa vectorisation locale.
// Mêmes garanties que callLLM : timeout, nouvelles tentatives, validation Zod, journalisation sans contenu.
// Seuls des textes métier ou fictifs sont vectorisés : jamais de données personnelles.
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AiError, toAiError } from './errors.js';
import { createTokenCounter, defaultLogCall, defaultSleep, withTimeout } from './index.js';
import { postJson } from './providers/http.js';
import { resolveProviderName } from './providers/index.js';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const MAX_BACKOFF_MS = 10000;

/**
 *   auto -> ollama si le LLM est ollama, sinon openai si OPENAI_API_KEY, sinon none
 *   (le mode mock reste toujours hors ligne)
 */
export function resolveEmbeddingProviderName(config) {
  if (config.AI_EMBEDDING_PROVIDER !== 'auto') return config.AI_EMBEDDING_PROVIDER;
  const llmProvider = resolveProviderName(config);
  if (llmProvider === 'mock') return 'none';
  if (llmProvider === 'ollama') return 'ollama';
  return config.OPENAI_API_KEY ? 'openai' : 'none';
}

export function createOpenAiEmbeddingProvider({ apiKey, baseUrl, model }) {
  return {
    name: 'openai',
    model: model ?? 'text-embedding-3-small',
    async embed(texts, signal) {
      if (!apiKey) {
        throw new AiError('AI_MISSING_KEY', 'OPENAI_API_KEY absente dans server/.env (embeddings openai).');
      }
      const data = await postJson(`${(baseUrl ?? DEFAULT_OPENAI_BASE_URL).replace(/\/$/, '')}/embeddings`, {
        providerName: 'openai',
        headers: { authorization: `Bearer ${apiKey}` },
        body: { model: this.model, input: texts },
        signal,
      });
      return {
        vectors: [...(data.data ?? [])].sort((a, b) => a.index - b.index).map((item) => item.embedding),
        usage: { inputTokens: data.usage?.prompt_tokens },
      };
    },
  };
}

export function createOllamaEmbeddingProvider({ baseUrl, model }) {
  return {
    name: 'ollama',
    model: model ?? 'nomic-embed-text',
    async embed(texts, signal) {
      const data = await postJson(`${baseUrl.replace(/\/$/, '')}/api/embed`, {
        providerName: 'ollama',
        body: { model: this.model, input: texts },
        signal,
      });
      return { vectors: data.embeddings, usage: { inputTokens: data.prompt_eval_count } };
    },
  };
}

/** Fournisseur d'embeddings configuré, ou null s'il n'y en a pas. */
export function createEmbeddingProvider(config) {
  switch (resolveEmbeddingProviderName(config)) {
    case 'openai':
      return createOpenAiEmbeddingProvider({
        apiKey: config.OPENAI_API_KEY,
        baseUrl: config.OPENAI_BASE_URL,
        model: config.AI_EMBEDDING_MODEL,
      });
    case 'ollama':
      return createOllamaEmbeddingProvider({ baseUrl: config.OLLAMA_BASE_URL, model: config.AI_EMBEDDING_MODEL });
    default:
      return null;
  }
}

/** Un vecteur par texte, tous de même dimension. */
function createVectorsSchema(count) {
  return z
    .array(z.array(z.number().finite()).min(1))
    .length(count)
    .refine((vectors) => vectors.every((vector) => vector.length === vectors[0].length), {
      message: 'vecteurs de dimensions différentes',
    });
}

/**
 * Crée un client d'embeddings. Les dépendances sont injectables pour les tests.
 */
export function createEmbeddingClient({
  provider,
  timeoutMs = 30000,
  maxRetries = 2,
  sleep = defaultSleep,
  logCall = defaultLogCall,
} = {}) {
  async function embed(texts, { module } = {}) {
    if (!provider) throw new AiError('AI_EMBEDDINGS_UNAVAILABLE');
    if (texts.length === 0) return { vectors: [], provider: provider.name, model: provider.model };

    const schema = createVectorsSchema(texts.length);
    const startedAt = Date.now();
    let attempt = 0;
    const tokens = createTokenCounter();

    while (true) {
      attempt += 1;
      try {
        // Le fournisseur renvoie les vecteurs seuls, ou { vectors, usage } avec les tokens consommés
        const raw = await withTimeout((signal) => provider.embed(texts, signal), timeoutMs);
        const { vectors, usage } = Array.isArray(raw) ? { vectors: raw, usage: null } : (raw ?? {});
        tokens.add(usage);
        const result = schema.safeParse(vectors);
        if (!result.success) {
          throw new AiError('AI_INVALID_RESPONSE', `Embeddings invalides : ${result.error.issues[0]?.message}.`, {
            retryable: true,
          });
        }
        await logCall({
          module,
          promptName: 'embeddings',
          provider: provider.name,
          model: provider.model,
          status: 'SUCCESS',
          attempts: attempt,
          durationMs: Date.now() - startedAt,
          ...tokens.get(),
        });
        return { vectors: result.data, provider: provider.name, model: provider.model };
      } catch (err) {
        const aiError = toAiError(err);
        if (aiError.retryable && attempt <= maxRetries) {
          const backoff = aiError.retryAfterMs ?? 500 * 2 ** (attempt - 1);
          await sleep(Math.min(backoff, MAX_BACKOFF_MS));
          continue;
        }
        await logCall({
          module,
          promptName: 'embeddings',
          provider: provider.name,
          model: provider.model,
          status: 'ERROR',
          errorCode: aiError.code,
          attempts: attempt,
          durationMs: Date.now() - startedAt,
          ...tokens.get(),
        });
        throw aiError;
      }
    }
  }

  return { embed, provider };
}

let defaultClient;

function getDefaultClient() {
  defaultClient ??= createEmbeddingClient({
    provider: createEmbeddingProvider(env),
    timeoutMs: env.AI_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES,
  });
  return defaultClient;
}

/** Vectorise des textes avec le fournisseur d'embeddings configuré dans server/.env. */
export function embedTexts(texts, options) {
  return getDefaultClient().embed(texts, options);
}
