// RAG du module 1 (cours, Séance 4) : retrouve dans la base de connaissances les situations métier
// les plus proches du domaine demandé, en écartant celles que les scénarios existants exploitent déjà.
//   1. découpage      : knowledgeBase.js (un bloc par situation)
//   2. vectorisation  : embeddings du fournisseur IA (service partagé), sinon TF-IDF local
//   3. recherche      : similarité cosinus, seuil de pertinence, top-k diversifié (MMR)
//   4. génération     : formatKnowledge() remplit la variable {{knowledge}} du prompt generate-scenario
import { AiError } from '../../../shared/ai/index.js';
import { embedTexts } from '../../../shared/ai/embeddings.js';
import { loadKnowledgeBase } from './knowledgeBase.js';
import { createTfIdfVectorizer } from './vectorizer.js';
import { cosineSimilarity, selectDiverse } from './similarity.js';

const MODULE = 'client-generator';
export const TOP_K = 2;

// Un bloc est pertinent s'il dépasse le seuil minimal du mode ET une part du meilleur score.
// Les seuils des embeddings dépendent du modèle : à recalibrer avec le fournisseur utilisé.
export const RELEVANCE = {
  local: { minScore: 0.02, relativeToBest: 0.5 },
  embeddings: { minScore: 0.3, relativeToBest: 0.85 },
};
const DIVERSITY_LAMBDA = 0.5;
// Après un échec des embeddings, la vectorisation locale est utilisée pendant ce délai.
const EMBEDDINGS_PAUSE_MS = 5 * 60 * 1000;

/** Texte d'un scénario existant, comparé aux blocs (champs publics uniquement). */
export function scenarioText({ title, context, expressedNeed }) {
  return [title, context, expressedNeed].filter(Boolean).join('\n');
}

/** Blocs retenus, mis en forme pour la variable {{knowledge}} du prompt. */
export function formatKnowledge(results) {
  if (results.length === 0) return 'Aucune fiche de la base de connaissances ne correspond à ce domaine.';
  return results.map((result) => `[${result.id}] ${result.content}`).join('\n\n');
}

export function createRetriever({
  embed = embedTexts,
  knowledgeBase = loadKnowledgeBase(),
  relevance = RELEVANCE,
  now = Date.now,
  warn = console.warn,
} = {}) {
  const { chunks } = knowledgeBase;
  let local = null;
  let chunkEmbeddings = null;
  let embeddingsPausedUntil = 0;

  function localVectors() {
    if (!local) {
      const vectorizer = createTfIdfVectorizer(chunks.map((chunk) => chunk.vectorText));
      local = {
        vectorize: vectorizer.vectorize,
        chunkVectors: chunks.map((chunk) => vectorizer.vectorize(chunk.vectorText)),
      };
    }
    return local;
  }

  async function vectorize(texts) {
    if (now() >= embeddingsPausedUntil) {
      try {
        chunkEmbeddings ??= (await embed(chunks.map((chunk) => chunk.vectorText), { module: MODULE })).vectors;
        const { vectors, provider, model } = await embed(texts, { module: MODULE });
        return { mode: 'embeddings', engine: `${provider}/${model}`, chunkVectors: chunkEmbeddings, vectors };
      } catch (err) {
        if (!(err instanceof AiError)) throw err;
        if (err.code !== 'AI_EMBEDDINGS_UNAVAILABLE') {
          warn(`RAG : embeddings indisponibles (${err.code}), vectorisation locale TF-IDF utilisée.`);
        }
        embeddingsPausedUntil = now() + EMBEDDINGS_PAUSE_MS;
      }
    }
    const { vectorize: toVector, chunkVectors } = localVectors();
    return { mode: 'local', engine: 'tf-idf', chunkVectors, vectors: texts.map(toVector) };
  }

  /**
   * @param {{ domain: string, existingScenarios?: Array<{ title: string, context: string, expressedNeed: string }>, k?: number }} input
   * @returns {Promise<{ mode: 'embeddings' | 'local', engine: string, results: Array<object> }>}
   *   results : blocs retenus ({ id, domain, situation, content, vectorText, score }), du plus utile au moins utile
   */
  async function retrieve({ domain, existingScenarios = [], k = TOP_K }) {
    const { mode, engine, chunkVectors, vectors } = await vectorize([domain, ...existingScenarios.map(scenarioText)]);
    const [queryVector, ...avoid] = vectors;

    const scored = chunks
      .map((chunk, index) => ({ chunk, vector: chunkVectors[index], score: cosineSimilarity(queryVector, chunkVectors[index]) }))
      .sort((a, b) => b.score - a.score);
    const { minScore, relativeToBest } = relevance[mode];
    const threshold = Math.max(minScore, (scored[0]?.score ?? 0) * relativeToBest);
    const candidates = scored.filter((item) => item.score >= threshold);

    const selected = selectDiverse(candidates, { k, avoid, lambda: DIVERSITY_LAMBDA });
    return { mode, engine, results: selected.map(({ chunk, score }) => ({ ...chunk, score })) };
  }

  return { retrieve };
}
