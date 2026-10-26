// Service IA partagé — point d'entrée UNIQUE pour appeler un LLM.
//
//   import { callLLM } from '../../shared/ai/index.js';
//   const result = await callLLM({
//     module: 'interview',            // dossier du module
//     prompt: 'client-reply',         // fichier prompts/client-reply.md
//     variables: { ... },             // remplace les {{variables}} du prompt
//     messages: [{ role: 'user', content: '...' }],  // historique éventuel
//     schema: MyZodSchema,            // OBLIGATOIRE : la réponse est validée avant d'être renvoyée
//     userId: req.user.id,            // permet de masquer nom/prénom/email de l'étudiant
//   });
//
// Garanties : timeout, nouvelles tentatives sur erreur temporaire (429, 5xx, réseau, timeout,
// JSON invalide), messages d'erreur clairs (AiError), validation Zod, masquage des données
// personnelles, journalisation technique dans AiCallLog (sans contenu, avec les tokens consommés).
import { env } from '../../config/env.js';
import { prisma } from '../db/prisma.js';
import { AiError, toAiError } from './errors.js';
import { loadPrompt } from './promptLoader.js';
import { parseJsonResponse } from './parseJson.js';
import { sanitizeDeep } from './sanitize.js';
import { createProvider } from './providers/index.js';

export { AiError } from './errors.js';

const DEFAULT_USER_MESSAGE = 'Produis maintenant la réponse au format JSON demandé.';
const CORRECTION_MESSAGE = 'Ta réponse précédente a été refusée par la vérification automatique';
const MAX_BACKOFF_MS = 10000;

export const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Un fournisseur renvoie le texte seul (mock) ou { text, usage } avec les tokens consommés. */
function readReply(reply) {
  return typeof reply === 'string' ? { text: reply, usage: null } : { text: reply?.text ?? '', usage: reply?.usage ?? null };
}

/**
 * Compteur de tokens sur toutes les tentatives d'un appel (une tentative refusée est aussi facturée).
 * Reste à null tant qu'aucun fournisseur n'a indiqué sa consommation.
 */
export function createTokenCounter() {
  const total = { inputTokens: null, outputTokens: null };
  return {
    add(usage) {
      for (const key of ['inputTokens', 'outputTokens']) {
        if (Number.isFinite(usage?.[key])) total[key] = (total[key] ?? 0) + usage[key];
      }
    },
    get: () => ({ ...total }),
  };
}

async function defaultLoadIdentity(userId) {
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true },
  });
}

export async function defaultLogCall(entry) {
  try {
    await prisma.aiCallLog.create({ data: entry });
  } catch {
    // La journalisation ne doit jamais faire échouer l'appel principal.
  }
}

export function withTimeout(run, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new AiError('AI_TIMEOUT', `Le service IA n'a pas répondu en ${timeoutMs} ms.`, { retryable: true });
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([run(controller.signal), timeout]).finally(() => clearTimeout(timer));
}

/**
 * Crée un client IA. Les dépendances sont injectables pour les tests.
 */
export function createAiClient({
  provider,
  timeoutMs = 30000,
  maxRetries = 2,
  sleep = defaultSleep,
  loadIdentity = defaultLoadIdentity,
  logCall = defaultLogCall,
  promptLoader = loadPrompt,
} = {}) {
  async function call({ module, prompt, variables = {}, messages = [], schema, userId, maxTokens = 2000, temperature }) {
    if (!schema || typeof schema.safeParse !== 'function') {
      throw new Error('callLLM : un schéma Zod est obligatoire pour valider la réponse.');
    }

    const identity = await loadIdentity(userId);
    const safeVariables = sanitizeDeep(variables, identity);
    const system = await promptLoader(module, prompt, safeVariables);
    const safeMessages = sanitizeDeep(messages, identity);
    // Le dernier message doit venir de l'utilisateur : Gemini refuse une conversation qui se termine
    // par le modèle, et Claude la prendrait pour un début de réponse à compléter (ex. synthèse d'un entretien).
    if (safeMessages.length === 0 || safeMessages.at(-1).role !== 'user') {
      safeMessages.push({ role: 'user', content: DEFAULT_USER_MESSAGE });
    }

    const startedAt = Date.now();
    let attempt = 0;
    // Après une réponse refusée par le schéma, la nouvelle tentative indique au modèle pourquoi
    // (le motif du refus ne contient jamais de secret : seulement le champ et la règle non respectée).
    let correction = [];
    const tokens = createTokenCounter();

    while (true) {
      attempt += 1;
      try {
        const reply = await withTimeout(
          (signal) =>
            provider.complete({
              system,
              messages: [...safeMessages, ...correction],
              maxTokens,
              temperature,
              signal,
              meta: { module, prompt, variables: safeVariables },
            }),
          timeoutMs,
        );
        const { text, usage } = readReply(reply);
        tokens.add(usage);

        const json = parseJsonResponse(text);
        const result = schema.safeParse(json);
        if (!result.success) {
          const firstIssue = result.error.issues[0];
          const reason = `${firstIssue?.path.join('.') || 'racine'} : ${firstIssue?.message}`;
          correction = [
            { role: 'assistant', content: text },
            { role: 'user', content: `${CORRECTION_MESSAGE} (${reason}). Corrige-la et réponds uniquement avec l'objet JSON demandé.` },
          ];
          throw new AiError('AI_INVALID_RESPONSE', `La réponse de l'IA ne respecte pas le format attendu (${reason}).`, {
            retryable: true,
          });
        }

        await logCall({
          module,
          promptName: prompt,
          provider: provider.name,
          model: provider.model,
          status: 'SUCCESS',
          attempts: attempt,
          durationMs: Date.now() - startedAt,
          ...tokens.get(),
        });
        return result.data;
      } catch (err) {
        const aiError = toAiError(err);
        if (aiError.retryable && attempt <= maxRetries) {
          const backoff = aiError.retryAfterMs ?? 500 * 2 ** (attempt - 1);
          await sleep(Math.min(backoff, MAX_BACKOFF_MS));
          continue;
        }
        await logCall({
          module,
          promptName: prompt,
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

  return { call, provider };
}

let defaultClient;

function getDefaultClient() {
  defaultClient ??= createAiClient({
    provider: createProvider(env),
    timeoutMs: env.AI_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES,
  });
  return defaultClient;
}

/** Appel au LLM avec le fournisseur configuré dans server/.env. */
export function callLLM(options) {
  return getDefaultClient().call(options);
}

/** Informations sur le fournisseur actif (affichées par /api/health). */
export function getAiInfo() {
  const { provider } = getDefaultClient();
  return { provider: provider.name, model: provider.model };
}
