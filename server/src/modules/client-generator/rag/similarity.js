// RAG — étape 3 « recherche » : similarité cosinus et sélection diversifiée des blocs.

/** cos(θ) = (A · B) / (‖A‖ ‖B‖), entre -1 et 1 ; 0 si l'un des vecteurs est nul. */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error('cosineSimilarity : vecteurs de dimensions différentes');
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA > 0 && normB > 0 ? dot / Math.sqrt(normA * normB) : 0;
}

/**
 * Sélection MMR (Maximal Marginal Relevance) de k candidats triés par score décroissant.
 * À chaque tour, retient le candidat qui maximise
 *   λ × (score / meilleur score) − (1 − λ) × ressemblance maximale avec ce qui est déjà couvert,
 * où « déjà couvert » = les vecteurs à éviter (scénarios existants) et les candidats déjà retenus.
 */
export function selectDiverse(candidates, { k, avoid = [], lambda = 0.5 }) {
  const bestScore = candidates[0]?.score || 1;
  const covered = [...avoid];
  const remaining = [...candidates];
  const selected = [];

  while (selected.length < k && remaining.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    remaining.forEach((candidate, index) => {
      const redundancy = Math.max(0, ...covered.map((vector) => cosineSimilarity(candidate.vector, vector)));
      const value = lambda * (candidate.score / bestScore) - (1 - lambda) * redundancy;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    });
    const [chosen] = remaining.splice(bestIndex, 1);
    selected.push(chosen);
    covered.push(chosen.vector);
  }
  return selected;
}
