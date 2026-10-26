// Fournisseur Ollama (modèle local, pas de clé API).
import { postJson } from './http.js';

export function createOllamaProvider({ baseUrl, model }) {
  return {
    name: 'ollama',
    model: model ?? 'llama3.1',
    async complete({ system, messages, temperature, signal }) {
      const body = {
        model: this.model,
        messages: [{ role: 'system', content: system }, ...messages],
        stream: false,
        format: 'json',
      };
      if (temperature !== undefined) body.options = { temperature };

      const data = await postJson(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
        providerName: 'ollama',
        body,
        signal,
      });
      return { text: data.message?.content ?? '', usage: { inputTokens: data.prompt_eval_count, outputTokens: data.eval_count } };
    },
  };
}
