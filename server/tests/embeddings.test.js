// Tests du service d'embeddings partagé (sans base de données ni clé API).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AiError } from '../src/shared/ai/index.js';
import {
  createEmbeddingClient,
  createOllamaEmbeddingProvider,
  createOpenAiEmbeddingProvider,
  resolveEmbeddingProviderName,
} from '../src/shared/ai/embeddings.js';

const noop = async () => {};
const config = (overrides) => ({ AI_PROVIDER: 'auto', AI_EMBEDDING_PROVIDER: 'auto', ...overrides });

function fakeProvider(responses) {
  const calls = [];
  return {
    name: 'fake',
    model: 'fake',
    calls,
    async embed(texts) {
      calls.push(texts);
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

const client = (provider, options = {}) => createEmbeddingClient({ provider, sleep: noop, logCall: noop, ...options });

/** Remplace fetch le temps d'un test et mémorise les requêtes. */
function stubFetch(t, body) {
  const requests = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  return requests;
}

test('choix du fournisseur d\'embeddings', () => {
  assert.equal(resolveEmbeddingProviderName(config({ AI_PROVIDER: 'mock', OPENAI_API_KEY: 'k' })), 'none');
  assert.equal(resolveEmbeddingProviderName(config({ AI_PROVIDER: 'ollama' })), 'ollama');
  assert.equal(resolveEmbeddingProviderName(config({ ANTHROPIC_API_KEY: 'k' })), 'none');
  assert.equal(resolveEmbeddingProviderName(config({ ANTHROPIC_API_KEY: 'k', OPENAI_API_KEY: 'k' })), 'openai');
  assert.equal(resolveEmbeddingProviderName(config({ AI_PROVIDER: 'mock', AI_EMBEDDING_PROVIDER: 'ollama' })), 'ollama');
});

test('sans fournisseur -> AI_EMBEDDINGS_UNAVAILABLE', async () => {
  await assert.rejects(client(null).embed(['texte']), { code: 'AI_EMBEDDINGS_UNAVAILABLE' });
});

test('renvoie un vecteur par texte, validé', async () => {
  const provider = fakeProvider([[[1, 0], [0, 1]]]);
  const result = await client(provider).embed(['a', 'b'], { module: 'client-generator' });
  assert.deepEqual(result, { vectors: [[1, 0], [0, 1]], provider: 'fake', model: 'fake' });
});

test('aucun appel pour une liste vide', async () => {
  const provider = fakeProvider([]);
  assert.deepEqual((await client(provider).embed([])).vectors, []);
  assert.equal(provider.calls.length, 0);
});

test('nombre ou dimensions de vecteurs incorrects -> AI_INVALID_RESPONSE', async () => {
  const wrongCount = fakeProvider([[[1, 0]], [[1, 0]]]);
  await assert.rejects(client(wrongCount, { maxRetries: 1 }).embed(['a', 'b']), { code: 'AI_INVALID_RESPONSE' });
  assert.equal(wrongCount.calls.length, 2);
  const wrongSize = fakeProvider([[[1, 0], [1]]]);
  await assert.rejects(client(wrongSize, { maxRetries: 0 }).embed(['a', 'b']), { code: 'AI_INVALID_RESPONSE' });
});

test('429 puis succès -> nouvelle tentative réussie', async () => {
  const provider = fakeProvider([new AiError('AI_RATE_LIMIT', undefined, { retryable: true }), [[0.5, 0.5]]]);
  assert.deepEqual((await client(provider).embed(['a'])).vectors, [[0.5, 0.5]]);
  assert.equal(provider.calls.length, 2);
});

test('timeout -> AI_TIMEOUT', async () => {
  const provider = { name: 'slow', model: 'slow', embed: () => new Promise(() => {}) };
  await assert.rejects(client(provider, { timeoutMs: 20, maxRetries: 0 }).embed(['a']), { code: 'AI_TIMEOUT' });
});

test('openai : requête /embeddings et vecteurs remis dans l\'ordre des textes', async (t) => {
  const requests = stubFetch(t, { data: [{ index: 1, embedding: [0, 1] }, { index: 0, embedding: [1, 0] }] });
  const provider = createOpenAiEmbeddingProvider({ apiKey: 'cle', baseUrl: 'https://exemple.test/v1/' });
  assert.deepEqual(await provider.embed(['a', 'b']), [[1, 0], [0, 1]]);
  assert.equal(requests[0].url, 'https://exemple.test/v1/embeddings');
  assert.deepEqual(requests[0].body, { model: 'text-embedding-3-small', input: ['a', 'b'] });
  assert.equal(requests[0].headers.authorization, 'Bearer cle');
});

test('openai sans clé -> AI_MISSING_KEY', async () => {
  await assert.rejects(createOpenAiEmbeddingProvider({}).embed(['a']), { code: 'AI_MISSING_KEY' });
});

test('ollama : requête /api/embed', async (t) => {
  const requests = stubFetch(t, { embeddings: [[1, 2]] });
  const provider = createOllamaEmbeddingProvider({ baseUrl: 'http://localhost:11434' });
  assert.deepEqual(await provider.embed(['a']), [[1, 2]]);
  assert.equal(requests[0].url, 'http://localhost:11434/api/embed');
  assert.deepEqual(requests[0].body, { model: 'nomic-embed-text', input: ['a'] });
});
