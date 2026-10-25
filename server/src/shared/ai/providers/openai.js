// Fournisseur OpenAI (Chat Completions, sortie JSON forcée).
// OPENAI_BASE_URL (facultatif) permet d'utiliser une API compatible OpenAI (ex. Gemini, Groq, OpenRouter).
import { AiError } from '../errors.js';
import { postJson } from './http.js';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export function createOpenAiProvider({ apiKey, model, baseUrl = DEFAULT_BASE_URL }) {
  const url = `${(baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')}/chat/completions`;
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

      const data = await postJson(url, {
        providerName: 'openai',
        headers: { authorization: `Bearer ${apiKey}` },
        body,
        signal,
      });
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
