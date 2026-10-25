// RAG — étape 2 « vectorisation », version locale (TF-IDF), sans appel réseau.
// Utilisée quand aucun fournisseur d'embeddings n'est configuré (mode mock, Claude sans clé OpenAI).
// Limite : les vecteurs TF-IDF rapprochent des textes qui partagent des mots, alors que de vrais
// embeddings rapprochent aussi des textes de même sens écrits avec d'autres mots.

const STOPWORDS = new Set(
  (
    'les des une est pour par sur avec dans aux ses son sont qui que quoi dont pas plus leur leurs elle ' +
    'ils elles nous vous mais car tout tous toute toutes cette ces cet aussi entre sans sous chez comme ' +
    'ainsi deux trois etre avoir fait faire peu tres bien'
  ).split(' '),
);

/** Mots normalisés : minuscules, sans accents, sans mots vides, pluriel simple retiré. */
export function tokenize(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .map((word) => (word.length > 4 && /[sx]$/.test(word) ? word.slice(0, -1) : word));
}

/**
 * Vectoriseur TF-IDF construit sur un corpus (les blocs de la base de connaissances) :
 * poids d'un mot = fréquence dans le texte × rareté dans le corpus (idf).
 * Les mots absents du corpus sont ignorés.
 */
export function createTfIdfVectorizer(documents) {
  const vocabulary = new Map();
  const documentFrequency = [];
  for (const document of documents) {
    for (const term of new Set(tokenize(document))) {
      if (!vocabulary.has(term)) {
        vocabulary.set(term, vocabulary.size);
        documentFrequency.push(0);
      }
      documentFrequency[vocabulary.get(term)] += 1;
    }
  }
  const idf = documentFrequency.map((frequency) => Math.log((documents.length + 1) / (frequency + 1)) + 1);

  function vectorize(text) {
    const vector = new Array(vocabulary.size).fill(0);
    for (const term of tokenize(text)) {
      const index = vocabulary.get(term);
      if (index !== undefined) vector[index] += idf[index];
    }
    return vector;
  }

  return { vectorize, vocabularySize: vocabulary.size };
}
