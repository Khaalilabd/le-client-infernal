// Exporte des pages HTML en images PNG pleine page avec Chrome (ou Edge) sans interface.
// Utilisé pour les maquettes (docs/ui/maquettes) et les diagrammes du rapport (docs/rapport/diagrammes).
//
// Usage :
//   node scripts/export-images.mjs <dossier-html> <dossier-png> [largeur]
//   node scripts/export-images.mjs docs/ui/maquettes docs/ui/maquettes/png
//   node scripts/export-images.mjs docs/rapport/diagrammes docs/rapport/images 1200
//
// Une page peut fixer sa largeur : <meta name="capture-width" content="1200" />
// Nécessite Node 22+ (WebSocket natif). Chemin du navigateur modifiable via CHROME_PATH.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [inputDir, outputDir, defaultWidth = '1440'] = process.argv.slice(2);
if (!inputDir || !outputDir) {
  console.error('Usage : node scripts/export-images.mjs <dossier-html> <dossier-png> [largeur]');
  process.exit(1);
}

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const browserPath = BROWSERS.find((path) => existsSync(path));
if (!browserPath) {
  console.error('Chrome ou Edge introuvable. Définissez CHROME_PATH.');
  process.exit(1);
}

const PORT = 9333;
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return;
    } catch {
      // le navigateur démarre encore
    }
    await sleep(200);
  }
  throw new Error('Le navigateur ne répond pas sur le port de débogage.');
}

function connect(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve: done, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else done(message.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((done, reject) => {
      nextId += 1;
      pending.set(nextId, { resolve: done, reject });
      socket.send(JSON.stringify({ id: nextId, method, params }));
    });
  return new Promise((done, reject) => {
    socket.addEventListener('open', () => done({ send, close: () => socket.close() }));
    socket.addEventListener('error', reject);
  });
}

async function capture(page, file, width) {
  await page.send('Emulation.setDeviceMetricsOverride', { width, height: 600, deviceScaleFactor: 1, mobile: false });
  await page.send('Page.navigate', { url: pathToFileURL(file).href });
  // Attente du chargement complet (y compris les scripts comme Mermaid)
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const { result } = await page.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && !document.querySelector('.mermaid:not([data-processed])')",
      returnByValue: true,
    });
    if (result.value) break;
    await sleep(250);
  }
  await sleep(400);
  const { result } = await page.send('Runtime.evaluate', {
    expression: 'Math.ceil(document.body.scrollHeight)',
    returnByValue: true,
  });
  const height = Math.max(300, result.value);
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  return Buffer.from(data, 'base64');
}

const profileDir = mkdtempSync(join(tmpdir(), 'export-images-'));
const browser = spawn(
  browserPath,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profileDir}`, 'about:blank'],
  { stdio: 'ignore' },
);

try {
  await waitForDebugger();
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const page = await connect(target.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');

  mkdirSync(outputDir, { recursive: true });
  const files = readdirSync(inputDir).filter((file) => file.endsWith('.html') && file !== 'index.html');

  for (const file of files) {
    const source = resolve(inputDir, file);
    const html = readFileSync(source, 'utf8');
    const width = Number(html.match(/<meta name="capture-width" content="(\d+)"/)?.[1] ?? defaultWidth);
    const png = await capture(page, source, width);
    const output = join(outputDir, `${basename(file, '.html')}.png`);
    writeFileSync(output, png);
    console.log(`✓ ${output}`);
  }
  page.close();
} finally {
  browser.kill();
  await sleep(300);
  rmSync(profileDir, { recursive: true, force: true, maxRetries: 5 });
}
