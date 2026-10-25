// Tests du RAG du module client-generator (sans base de données ni clé API).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AiError } from '../../../shared/ai/index.js';
import { DOMAIN_SUGGESTIONS, LEVELS, PROFILE_IDS } from '../client-generator.catalog.js';
import { createGeneratedScenarioSchema } from '../client-generator.schemas.js';
import { SITUATION_FIELDS, chunkLines, loadKnowledgeBase, parseFiche } from '../rag/knowledgeBase.js';
import { createTfIdfVectorizer, tokenize } from '../rag/vectorizer.js';
import { cosineSimilarity, selectDiverse } from '../rag/similarity.js';
import { TOP_K, createRetriever, formatKnowledge } from '../rag/retriever.js';
import generateScenarioMock, { parseKnowledge } from '../mocks/generate-scenario.mock.js';

const knowledgeBase = loadKnowledgeBase();
const localRetriever = () => createRetriever({ embed: async () => { throw new AiError('AI_EMBEDDINGS_UNAVAILABLE'); } });

// ---------- Base de connaissances et découpage ----------

test('chaque domaine suggéré a sa fiche, et chaque situation respecte le format', () => {
  const domains = knowledgeBase.fiches.map((fiche) => fiche.domain);
  for (const domain of DOMAIN_SUGGESTIONS) assert.ok(domains.includes(domain), `fiche manquante : ${domain}`);

  for (const fiche of knowledgeBase.fiches) {
    assert.ok(fiche.keywords.length >= 5, `${fiche.slug} : mots-clés`);
    assert.ok(fiche.situations.length >= 3, `${fiche.slug} : au moins 3 situations`);
    for (const { title, fields } of fiche.situations) {
      for (const name of SITUATION_FIELDS) assert.ok(fields[name], `${fiche.slug} / ${title} : champ « ${name} » manquant`);
      assert.equal(fields['Contraintes fréquentes'].split(';').length, 5, `${fiche.slug} / ${title} : 5 contraintes`);
      assert.notEqual(fields['Demande typique'], fields['Besoin réel']);
    }
  }
  const ids = knowledgeBase.chunks.map((chunk) => chunk.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants de blocs en double');
});

test('parseFiche lit le domaine, les mots-clés et les champs', () => {
  const fiche = parseFiche('<!-- note -->\n# Test\n\nMots-clés : a, b\n\n## Situation\n- Sujet : essai : deux points\n- Libre', 'test');
  assert.equal(fiche.domain, 'Test');
  assert.deepEqual(fiche.keywords, ['a', 'b']);
  assert.deepEqual(fiche.situations[0].fields, { Sujet: 'essai : deux points' });
});

test('le découpage respecte la taille maximale et fait chevaucher les blocs', () => {
  const lines = ['un deux trois', 'quatre cinq six', 'sept huit neuf', 'dix onze douze'];
  assert.deepEqual(chunkLines(lines, { maxWords: 100 }), [lines]);
  const chunks = chunkLines(lines, { maxWords: 6, overlapLines: 1 });
  assert.deepEqual(chunks, [lines.slice(0, 2), lines.slice(1, 3), lines.slice(2, 4)]);
});

// ---------- Vectorisation et similarité ----------

test('tokenize normalise les accents, les mots vides et le pluriel', () => {
  assert.deepEqual(tokenize('Les données de Santé des patients'), ['donnee', 'sante', 'patient']);
});

test('similarité cosinus : identiques = 1, orthogonaux = 0, vecteur nul = 0', () => {
  assert.equal(cosineSimilarity([1, 2, 3], [2, 4, 6]).toFixed(6), '1.000000');
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
  assert.throws(() => cosineSimilarity([1], [1, 2]));
});

test('TF-IDF : un texte est plus proche d\'un texte du même sujet', () => {
  const corpus = ['rendez-vous des patients du cabinet', 'tournées des camions de livraison', 'cotisations des adhérents du club'];
  const { vectorize } = createTfIdfVectorizer(corpus);
  const query = vectorize('patients absents à leur rendez-vous');
  const scores = corpus.map((text) => cosineSimilarity(query, vectorize(text)));
  assert.ok(scores[0] > scores[1] && scores[0] > scores[2]);
});

test('MMR : un candidat proche de ce qui existe déjà passe après un candidat différent', () => {
  const candidates = [
    { id: 'a', score: 1, vector: [1, 0] },
    { id: 'b', score: 0.9, vector: [0, 1] },
  ];
  assert.deepEqual(selectDiverse(candidates, { k: 2 }).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(selectDiverse(candidates, { k: 1, avoid: [[1, 0]] }).map((item) => item.id), ['b']);
});

// ---------- Recherche ----------

test('chaque domaine suggéré retrouve ses propres fiches (vectorisation locale)', async () => {
  const retriever = localRetriever();
  for (const domain of DOMAIN_SUGGESTIONS) {
    const { mode, results } = await retriever.retrieve({ domain });
    assert.equal(mode, 'local');
    assert.equal(results.length, TOP_K, domain);
    assert.ok(results.every((result) => result.domain === domain), `${domain} : ${results.map((r) => r.id)}`);
  }
});

test('un domaine absent de la base ne retrouve aucune fiche', async () => {
  const { results } = await localRetriever().retrieve({ domain: 'Aéronautique' });
  assert.equal(results.length, 0);
  assert.match(formatKnowledge(results), /Aucune fiche/);
});

test('les fiches déjà exploitées par un scénario existant sont écartées en priorité', async () => {
  const retriever = localRetriever();
  const first = await retriever.retrieve({ domain: 'Santé' });
  const existing = generateScenarioMock({ variables: { domain: 'Santé', knowledge: formatKnowledge(first.results) } }, () => 0);
  const second = await retriever.retrieve({ domain: 'Santé', existingScenarios: [existing] });
  assert.notEqual(second.results[0].id, first.results[0].id);
});

test('avec un fournisseur d\'embeddings, les blocs ne sont vectorisés qu\'une fois', async () => {
  const { vectorize } = createTfIdfVectorizer(knowledgeBase.chunks.map((chunk) => chunk.vectorText));
  const calls = [];
  const embed = async (texts) => {
    calls.push(texts.length);
    return { vectors: texts.map(vectorize), provider: 'fake', model: 'fake' };
  };
  const retriever = createRetriever({ embed, relevance: { embeddings: { minScore: 0.02, relativeToBest: 0.5 } } });
  const result = await retriever.retrieve({ domain: 'Tourisme' });
  await retriever.retrieve({ domain: 'Agriculture' });
  assert.equal(result.mode, 'embeddings');
  assert.equal(result.engine, 'fake/fake');
  assert.ok(result.results.every((item) => item.domain === 'Tourisme'));
  assert.deepEqual(calls, [knowledgeBase.chunks.length, 1, 1]);
});

test('si les embeddings échouent, repli sur la vectorisation locale sans réessayer à chaque appel', async () => {
  let calls = 0;
  const warnings = [];
  const retriever = createRetriever({
    embed: async () => {
      calls += 1;
      throw new AiError('AI_RATE_LIMIT');
    },
    warn: (message) => warnings.push(message),
  });
  const result = await retriever.retrieve({ domain: 'Logistique' });
  await retriever.retrieve({ domain: 'Logistique' });
  assert.equal(result.mode, 'local');
  assert.equal(result.results.length, TOP_K);
  assert.equal(calls, 1);
  assert.equal(warnings.length, 1);
});

test('une erreur de programmation n\'est pas masquée par le repli', async () => {
  const retriever = createRetriever({ embed: async () => { throw new TypeError('bug'); } });
  await assert.rejects(retriever.retrieve({ domain: 'Santé' }), TypeError);
});

// ---------- Génération : sources citées et mock ----------

test('le schéma refuse une source inconnue ou l\'absence de source quand des fiches sont fournies', () => {
  const scenario = generateScenarioMock({ variables: { domain: 'Santé', levelId: 'BEGINNER' } }, () => 0);
  const schema = createGeneratedScenarioSchema('BEGINNER', { allowedSources: ['sante-01'] });
  assert.equal(schema.safeParse({ ...scenario, knowledgeSources: ['sante-01'] }).success, true);
  assert.equal(schema.safeParse({ ...scenario, knowledgeSources: ['inventee-99'] }).success, false);
  assert.equal(schema.safeParse({ ...scenario, knowledgeSources: [] }).success, false);
  assert.equal(createGeneratedScenarioSchema('BEGINNER', { allowedSources: [] }).safeParse(scenario).success, true);
});

test('le mock construit un scénario conforme à partir des fiches, pour chaque domaine, niveau et profil', async () => {
  const retriever = localRetriever();
  for (const domain of DOMAIN_SUGGESTIONS) {
    const { results } = await retriever.retrieve({ domain });
    const allowedSources = results.map((result) => result.id);
    for (const level of LEVELS) {
      for (const personalityId of PROFILE_IDS) {
        const variables = { domain, levelId: level.id, personalityId, knowledge: formatKnowledge(results) };
        const scenario = generateScenarioMock({ variables });
        const check = createGeneratedScenarioSchema(level.id, { allowedSources }).safeParse(scenario);
        assert.ok(check.success, `${domain}/${level.id}/${personalityId} : ${check.error?.issues[0]?.message}`);
        assert.deepEqual(scenario.knowledgeSources, [allowedSources[0]]);
      }
    }
  }
});

test('parseKnowledge relit le bloc {{knowledge}} envoyé au LLM', async () => {
  const { results } = await localRetriever().retrieve({ domain: 'Immobilier' });
  const fiches = parseKnowledge(formatKnowledge(results));
  assert.deepEqual(fiches.map((fiche) => fiche.id), results.map((result) => result.id));
  assert.ok(fiches[0].fields['Besoin réel']);
});
