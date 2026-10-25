// Chargement et validation des variables d'environnement (Zod).
// Toute la configuration du serveur passe par cet objet : ne pas lire process.env ailleurs.
import 'dotenv/config';
import { z } from 'zod';

const DEV_JWT_SECRET = 'dev-secret-a-remplacer';

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://infernal:infernal@localhost:5434/client_infernal?schema=public'),
  JWT_SECRET: z.string().min(16).default(DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('8h'),

  AI_PROVIDER: z.enum(['auto', 'mock', 'claude', 'openai', 'ollama']).default('auto'),
  AI_MODEL: optionalString,
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_EMBEDDING_PROVIDER: z.enum(['auto', 'none', 'openai', 'ollama']).default('auto'),
  AI_EMBEDDING_MODEL: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_BASE_URL: optionalString,
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuration invalide dans server/.env :');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')} : ${issue.message}`);
  }
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET === DEV_JWT_SECRET) {
  console.error('JWT_SECRET doit être défini en production.');
  process.exit(1);
}

export const env = parsed.data;
