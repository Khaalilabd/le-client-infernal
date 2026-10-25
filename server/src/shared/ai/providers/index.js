// Choix du fournisseur IA selon AI_PROVIDER.
//   auto   -> claude si ANTHROPIC_API_KEY, sinon openai si OPENAI_API_KEY, sinon mock
//   claude / openai / ollama / mock -> fournisseur imposé
import { createClaudeProvider } from './claude.js';
import { createOpenAiProvider } from './openai.js';
import { createOllamaProvider } from './ollama.js';
import { createMockProvider } from './mock.js';

export function resolveProviderName(config) {
  if (config.AI_PROVIDER !== 'auto') return config.AI_PROVIDER;
  if (config.ANTHROPIC_API_KEY) return 'claude';
  if (config.OPENAI_API_KEY) return 'openai';
  return 'mock';
}

export function createProvider(config) {
  const name = resolveProviderName(config);
  switch (name) {
    case 'claude':
      return createClaudeProvider({ apiKey: config.ANTHROPIC_API_KEY, model: config.AI_MODEL });
    case 'openai':
      return createOpenAiProvider({ apiKey: config.OPENAI_API_KEY, model: config.AI_MODEL, baseUrl: config.OPENAI_BASE_URL });
    case 'ollama':
      return createOllamaProvider({ baseUrl: config.OLLAMA_BASE_URL, model: config.AI_MODEL });
    default:
      return createMockProvider();
  }
}
