// Fournisseur simulé : aucune clé API, aucune requête réseau.
// Chaque module fournit ses réponses simulées dans
//   server/src/modules/<module>/mocks/<prompt>.mock.js
// qui exporte par défaut une fonction ({ variables, messages }) => objet JSON.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { AiError } from '../errors.js';

const MODULES_DIR = fileURLToPath(new URL('../../../modules/', import.meta.url));

export function createMockProvider() {
  return {
    name: 'mock',
    model: 'mock',
    async complete({ meta, messages }) {
      const file = join(MODULES_DIR, meta.module, 'mocks', `${meta.prompt}.mock.js`);
      if (!existsSync(file)) {
        throw new AiError(
          'AI_PROVIDER_ERROR',
          `Aucune réponse simulée pour ${meta.module}/${meta.prompt} : créez modules/${meta.module}/mocks/${meta.prompt}.mock.js`,
        );
      }
      const { default: buildResponse } = await import(pathToFileURL(file).href);
      const response = await buildResponse({ variables: meta.variables, messages });
      return typeof response === 'string' ? response : JSON.stringify(response);
    },
  };
}
