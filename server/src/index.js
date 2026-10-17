// Démarrage du serveur HTTP.
import { env } from './config/env.js';
import { createApp } from './app.js';
import { prisma } from './shared/db/prisma.js';
import { getAiInfo } from './shared/ai/index.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  const ai = getAiInfo();
  console.log(`API « Le Client Infernal » démarrée sur http://localhost:${env.PORT}`);
  console.log(`Fournisseur IA : ${ai.provider} (modèle : ${ai.model})`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
