// Fournisseur Anthropic Claude (API Messages).
import { AiError } from '../errors.js';
import { postJson } from './http.js';

export function createClaudeProvider({ apiKey, model }) {
  return {
    name: 'claude',
    model: model ?? 'claude-sonnet-5-5',
    async complete({ system, messages, maxTokens, temperature, signal }) {
      if (!apiKey) {
        throw new AiError('AI_MISSING_KEY', 'ANTHROPIC_API_KEY absente dans server/.env (fournisseur claude).');
      }
      const body = { model: this.model, max_tokens: maxTokens, system, messages };
      if (temperature !== undefined) body.temperature = temperature;

      const data = await postJson('https://api.anthropic.com/v1/messages', {
        providerName: 'claude',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body,
        signal,
      });
      return (data.content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
    },
  };
}
