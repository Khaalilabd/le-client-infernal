// Script d'installation complète : dépendances, .env, base de données, migrations, seed.
// Usage : npm run setup
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { cwd: root, stdio: 'inherit' });
}

run('npm install');

const envFile = join(root, 'server', '.env');
if (!existsSync(envFile)) {
  copyFileSync(join(root, 'server', '.env.example'), envFile);
  console.log('\nFichier server/.env créé à partir de server/.env.example');
}

run('docker compose up -d --wait');
run('npm run db:deploy');
run('npm run db:seed');

console.log('\nInstallation terminée. Lancez maintenant : npm run dev');
