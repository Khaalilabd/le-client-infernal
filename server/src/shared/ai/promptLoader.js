// Chargement des prompts système depuis server/src/modules/<module>/prompts/<nom>.md
// Les variables s'écrivent {{nomVariable}} dans le fichier ; les commentaires HTML <!-- --> sont retirés
// (ils servent à documenter le prompt pour l'équipe sans être envoyés au LLM).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { AiError } from './errors.js';

const MODULES_DIR = fileURLToPath(new URL('../../modules/', import.meta.url));
const SAFE_NAME = /^[a-z0-9-]+$/;

export function renderPrompt(template, variables = {}) {
  const withoutComments = template.replace(/<!--[\s\S]*?-->/g, '').trim();
  return withoutComments.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => {
    if (!(name in variables) || variables[name] === undefined) {
      throw new AiError('AI_PROMPT_ERROR', `Variable de prompt manquante : {{${name}}}`);
    }
    const value = variables[name];
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  });
}

export async function loadPrompt(moduleName, promptName, variables) {
  if (!SAFE_NAME.test(moduleName) || !SAFE_NAME.test(promptName)) {
    throw new AiError('AI_PROMPT_ERROR', `Nom de prompt invalide : ${moduleName}/${promptName}`);
  }
  const file = join(MODULES_DIR, moduleName, 'prompts', `${promptName}.md`);
  let template;
  try {
    template = await readFile(file, 'utf8');
  } catch {
    throw new AiError('AI_PROMPT_ERROR', `Prompt introuvable : modules/${moduleName}/prompts/${promptName}.md`);
  }
  return renderPrompt(template, variables);
}
