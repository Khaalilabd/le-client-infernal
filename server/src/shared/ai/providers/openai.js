// Fournisseur OpenAI (Chat Completions, sortie JSON forcée).
import { AiError } from '../errors.js';
import { postJson } from './http.js';

export function createOpenAiProvider({ apiKey, model }) {
  return {
    name: 'openai',
    model: model ?? 'gpt-4o-mini',
    async complete({ system, messages, maxTokens, temperature, signal }) {
      if (!apiKey) {
        throw new AiError('AI_MISSING_KEY', 'OPENAI_API_KEY absente dans server/.env (fournisseur openai).');
      }
      const body = {
        model: this.model,
        messages: [{ role: 'system', content: system }, ...messages],
        max_completion_tokens: maxTokens,
        response_format: { type: 'json_object' },
      };
      if (temperature !== undefined) body.temperature = temperature;

      const data = await postJson('https://api.openai.com/v1/chat/completions', {
        providerName: 'openai',
        headers: { authorization: `Bearer ${apiKey}` },
        body,
        signal,
      });
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
