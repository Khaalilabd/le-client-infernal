// Extrait les diagrammes Mermaid de docs/ARCHITECTURE.md et les exporte en PNG pour le rapport.
// Usage : node scripts/export-diagrams.mjs
// Résultat : docs/rapport/diagrammes/*.html (sources) et docs/rapport/images/*.png
// Nécessite une connexion internet (Mermaid est chargé depuis un CDN) et Chrome ou Edge.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const markdown = readFileSync(join(root, 'docs', 'ARCHITECTURE.md'), 'utf8');
const blocks = [...markdown.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((match) => match[1]);

// Noms des diagrammes, dans l'ordre d'apparition dans ARCHITECTURE.md
const NAMES = [
  ['architecture-globale', 1400],
  ['parcours-etudiant', 1200],
  ['modele-de-donnees', 1400],
  ['circulation-scenario', 1200],
  ['service-ia', 1100],
  ['branches-git', 1100],
];

const htmlDir = join(root, 'docs', 'rapport', 'diagrammes');
mkdirSync(htmlDir, { recursive: true });

blocks.forEach((code, index) => {
  const [name, width] = NAMES[index] ?? [`diagramme-${index + 1}`, 1200];
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="capture-width" content="${width}" />
<title>${name}</title>
<style>
  body { margin: 0; padding: 32px; background: #fff; font-family: 'Segoe UI', system-ui, sans-serif; }
  .mermaid { display: flex; justify-content: center; }
</style>
</head>
<body>
<pre class="mermaid">
${code.replace(/</g, '&lt;')}</pre>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      primaryColor: '#FDECEB',
      primaryBorderColor: '#B3261E',
      primaryTextColor: '#161A22',
      lineColor: '#5B6474',
      secondaryColor: '#FFF4E5',
      tertiaryColor: '#F7F8FA',
    },
    flowchart: { htmlLabels: true, curve: 'basis' },
  });
</script>
</body>
</html>
`;
  writeFileSync(join(htmlDir, `${String(index + 1).padStart(2, '0')}-${name}.html`), html);
});

console.log(`${blocks.length} diagrammes extraits de docs/ARCHITECTURE.md`);
execFileSync(process.execPath, [join(root, 'scripts', 'export-images.mjs'), htmlDir, join(root, 'docs', 'rapport', 'images')], {
  stdio: 'inherit',
});
