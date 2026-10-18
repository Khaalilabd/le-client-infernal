// Tests du service IA partagé (sans base de données ni clé API).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { createAiClient, AiError } from '../src/shared/ai/index.js';
import { sanitizeText } from '../src/shared/ai/sanitize.js';
import { renderPrompt } from '../src/shared/ai/promptLoader.js';
import { createMockProvider } from '../src/shared/ai/providers/mock.js';
import { generatedScenarioSchema } from '../src/modules/client-generator/client-generator.schemas.js';

const schema = z.object({ answer: z.string() });
const noop = async () => {};

// Prompt de test propre à ce fichier : les tests du service IA ne dépendent
// d'aucun prompt de module (chaque module peut faire évoluer les siens librement).
const TEST_PROMPT = 'Prompt de test pour le domaine {{domain}} (niveau {{level}}). Réponds en JSON.';
const testPromptLoader = async (module, prompt, variables) => renderPrompt(TEST_PROMPT, variables);

function fakeProvider(responses) {
  const calls = [];
  return {
    name: 'fake',
    model: 'fake',
    calls,
    async complete(request) {
      calls.push(request);
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return typeof next === 'function' ? next(request) : next;
    },
  };
}

function client(provider, options = {}) {
  return createAiClient({
    provider,
    sleep: noop,
    logCall: noop,
    loadIdentity: async () => ({ firstName: 'Yassine', lastName: 'Ferchichi', email: 'yassine@demo.tn' }),
    promptLoader: testPromptLoader,
    ...options,
  });
}

const baseCall = { module: 'client-generator', prompt: 'generate-scenario', variables: { domain: 'Santé', level: 'débutant' }, schema };

test('renvoie la réponse validée par Zod', async () => {
  const provider = fakeProvider(['{"answer":"ok"}']);
  const result = await client(provider).call(baseCall);
  assert.deepEqual(result, { answer: 'ok' });
});

test('extrait le JSON d\'un bloc ```json', async () => {
  const provider = fakeProvider(['Voici :\n```json\n{"answer":"ok"}\n```']);
  const result = await client(provider).call(baseCall);
  assert.equal(result.answer, 'ok');
});

test('réponse invalide -> AI_INVALID_RESPONSE après les nouvelles tentatives', async () => {
  const provider = fakeProvider(['{"wrong":1}', '{"wrong":2}', '{"wrong":3}']);
  await assert.rejects(client(provider, { maxRetries: 2 }).call(baseCall), (err) => {
    assert.ok(err instanceof AiError);
    assert.equal(err.code, 'AI_INVALID_RESPONSE');
    return true;
  });
  assert.equal(provider.calls.length, 3);
});

test('429 puis succès -> nouvelle tentative réussie', async () => {
  const provider = fakeProvider([new AiError('AI_RATE_LIMIT', undefined, { retryable: true }), '{"answer":"ok"}']);
  const result = await client(provider).call(baseCall);
  assert.equal(result.answer, 'ok');
  assert.equal(provider.calls.length, 2);
});

test('clé absente -> AI_MISSING_KEY sans nouvelle tentative', async () => {
  const provider = fakeProvider([new AiError('AI_MISSING_KEY')]);
  await assert.rejects(client(provider).call(baseCall), { code: 'AI_MISSING_KEY' });
  assert.equal(provider.calls.length, 1);
});

test('timeout -> AI_TIMEOUT', async () => {
  const provider = { name: 'slow', model: 'slow', complete: () => new Promise(() => {}) };
  await assert.rejects(client(provider, { timeoutMs: 20, maxRetries: 1 }).call(baseCall), { code: 'AI_TIMEOUT' });
});

test('le nom et l\'email de l\'étudiant ne sont jamais envoyés au fournisseur', async () => {
  const provider = fakeProvider(['{"answer":"ok"}']);
  await client(provider).call({
    ...baseCall,
    messages: [{ role: 'user', content: 'Bonjour, je suis Yassine FERCHICHI (yassine@demo.tn).' }],
    userId: 'u1',
  });
  const sent = JSON.stringify(provider.calls[0]);
  assert.ok(!/yassine/i.test(sent), 'prénom transmis');
  assert.ok(!/ferchichi/i.test(sent), 'nom transmis');
  assert.ok(!sent.includes('@demo.tn'), 'email transmis');
});

test('sanitizeText ne masque pas les mots qui contiennent le prénom', () => {
  assert.equal(sanitizeText('Ali et Alibaba', { firstName: 'Ali' }), '[étudiant] et Alibaba');
});

test('renderPrompt signale une variable manquante', () => {
  assert.throws(() => renderPrompt('Bonjour {{name}}', {}), { code: 'AI_PROMPT_ERROR' });
});

test('le fournisseur mock produit un scénario conforme au schéma du module 1', async () => {
  const result = await client(createMockProvider()).call({ ...baseCall, schema: generatedScenarioSchema });
  assert.ok(result.hiddenNeed.length > 0);
});
