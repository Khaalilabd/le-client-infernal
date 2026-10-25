// RAG — étape 1 « découpage » : lit les fiches métier de knowledge/ et les découpe en blocs,
// un par situation (format des fiches : knowledge/README.md).
import { readdirSync, readFileSync } from 'node:fs';

const KNOWLEDGE_DIR = new URL('../knowledge/', import.meta.url);
export const MAX_CHUNK_WORDS = 220;

/** Champs obligatoires d'une situation, dans l'ordre du format. */
export const SITUATION_FIELDS = [
  'Organisation',
  'Interlocuteur',
  'Sujet',
  'Situation actuelle',
  'Demande typique',
  'Besoin réel',
  'Contraintes fréquentes',
  'Outils existants',
];

/** Lit une fiche Markdown : domaine, mots-clés et situations (champs « - Libellé : valeur »). */
export function parseFiche(markdown, slug) {
  const fiche = { slug, domain: '', keywords: [], situations: [] };
  let situation = null;
  for (const rawLine of markdown.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      situation = { title: line.slice(3).trim(), fields: {} };
      fiche.situations.push(situation);
    } else if (line.startsWith('# ')) {
      fiche.domain = line.slice(2).trim();
    } else if (/^Mots-clés\s*:/i.test(line)) {
      fiche.keywords = line.slice(line.indexOf(':') + 1).split(',').map((word) => word.trim()).filter(Boolean);
    } else if (situation && line.startsWith('- ') && line.includes(' : ')) {
      const separator = line.indexOf(' : ');
      situation.fields[line.slice(2, separator).trim()] = line.slice(separator + 3).trim();
    }
  }
  return fiche;
}

const countWords = (line) => line.split(/\s+/).filter(Boolean).length;

/**
 * Regroupe des lignes en blocs d'au plus maxWords mots. Chaque nouveau bloc reprend les
 * overlapLines dernières lignes du précédent (chevauchement, pour ne pas couper une idée en deux).
 */
export function chunkLines(lines, { maxWords = MAX_CHUNK_WORDS, overlapLines = 1 } = {}) {
  const chunks = [];
  let current = [];
  let words = 0;
  for (const line of lines) {
    if (current.length > 0 && words + countWords(line) > maxWords) {
      chunks.push(current);
      current = current.slice(-overlapLines);
      words = current.reduce((sum, kept) => sum + countWords(kept), 0);
    }
    current.push(line);
    words += countWords(line);
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * Blocs de la base : `content` est envoyé au LLM, `vectorText` (avec domaine et mots-clés)
 * sert à la vectorisation. L'identifiant (ex. « sante-02 ») permet au LLM de citer ses sources.
 */
export function buildChunks(fiches, options) {
  return fiches.flatMap((fiche) =>
    fiche.situations.flatMap((situation, index) => {
      const header = `${fiche.domain} — ${situation.title}`;
      const lines = Object.entries(situation.fields).map(([label, value]) => `- ${label} : ${value}`);
      const parts = chunkLines(lines, options);
      const baseId = `${fiche.slug}-${String(index + 1).padStart(2, '0')}`;
      return parts.map((part, partIndex) => ({
        id: parts.length > 1 ? `${baseId}-${partIndex + 1}` : baseId,
        domain: fiche.domain,
        situation: situation.title,
        content: [header, ...part].join('\n'),
        vectorText: [fiche.domain, fiche.keywords.join(', '), header, ...part].join('\n'),
      }));
    }),
  );
}

let cached;

/** Fiches et blocs de la base de connaissances (lus une seule fois). */
export function loadKnowledgeBase() {
  if (!cached) {
    const files = readdirSync(KNOWLEDGE_DIR)
      .filter((file) => file.endsWith('.md') && file !== 'README.md')
      .sort();
    const fiches = files.map((file) =>
      parseFiche(readFileSync(new URL(file, KNOWLEDGE_DIR), 'utf8'), file.replace(/\.md$/, '')),
    );
    cached = { fiches, chunks: buildChunks(fiches) };
  }
  return cached;
}
