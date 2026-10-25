// Génère le rapport technique docs/rapport/Rapport_Client_Infernal.docx.
//
//   npm run rapport
//
// Sources :
//   - chapitres communs (1 à 4, 6, conclusion, annexes) : ce fichier (chef de projet) ;
//   - section de chaque module (chapitre 5) : docs/rapport/sections/5.x-<module>.md, rédigée par son responsable ;
//   - captures : docs/rapport/captures/ ; journaux de prompts : docs/prompts/.
//
// Ne modifiez pas le .docx à la main : il est écrasé à chaque génération. Modifiez les sources ci-dessus.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, TableOfContents, Footer, Header, PageNumber, PageBreak,
  VerticalAlign,
} = require('docx');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'rapport', 'Rapport_Client_Infernal.docx');
const BRAND = 'B3261E';
const BRAND_SOFT = 'FDECEB';
const GRAY = '5B6474';
const CONTENT_WIDTH = 9638; // A4 - 2 x 2 cm de marges (DXA)
const MAX_IMG_W = 640; // px
const MAX_IMG_H = 860; // px

// ---------- Aides ----------
function runs(text, base = {}) {
  // **gras**, `code`, _italique_
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g;
  let last = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index > last) parts.push(new TextRun({ text: text.slice(last, match.index), ...base }));
    const token = match[0];
    if (token.startsWith('**')) parts.push(new TextRun({ text: token.slice(2, -2), bold: true, ...base }));
    else if (token.startsWith('`')) parts.push(new TextRun({ text: token.slice(1, -1), font: 'Consolas', size: 19, color: '8C1D18', ...base }));
    else parts.push(new TextRun({ text: token.slice(1, -1), italics: true, ...base }));
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(new TextRun({ text: text.slice(last), ...base }));
  return parts;
}
const p = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), spacing: { after: 120, line: 300 }, alignment: opts.align ?? AlignmentType.JUSTIFIED, ...opts.para });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(text)] });
const h1NoBreak = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const bullet = (text, level = 0) => new Paragraph({ numbering: { reference: 'bullets', level }, children: runs(text), spacing: { after: 60, line: 280 } });
const numbered = (text, ref = 'steps') => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(text), spacing: { after: 60, line: 280 } });

let figure = 0;
let table = 0;
function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), buffer };
}
function img(relPath, caption) {
  const { width, height, buffer } = pngSize(path.join(ROOT, relPath));
  let w = Math.min(MAX_IMG_W, width);
  let h = Math.round((height * w) / width);
  if (h > MAX_IMG_H) {
    h = MAX_IMG_H;
    w = Math.round((width * h) / height);
  }
  figure += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true, children: [new ImageRun({ type: 'png', data: buffer, transformation: { width: w, height: h }, altText: { title: caption, description: caption, name: path.basename(relPath) } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Figure ${figure} — ${caption}`, italics: true, size: 19, color: GRAY })] }),
  ];
}
// Capture d'écran : insérée si le(s) fichier(s) existe(nt) dans docs/rapport/captures/, sinon cadre « à insérer ».
const CAPTURES_DIR = path.join(ROOT, 'docs', 'rapport', 'captures');
const missingCaptures = [];
const captureRegistry = []; // pour l'annexe B : toutes les captures utilisées dans le rapport
function capture(_id, files, description) {
  const list = Array.isArray(files) ? files : [files];
  const present = list.every((file) => fs.existsSync(path.join(CAPTURES_DIR, file)));
  captureRegistry.push({ files: list, description, present });
  const id = captureRegistry.length;
  if (present) {
    figure += 1;
    const out = [];
    list.forEach((file, index) => {
      const { width, height, buffer } = pngSize(path.join(CAPTURES_DIR, file));
      let w = Math.min(MAX_IMG_W, width);
      let h = Math.round((height * w) / width);
      if (h > MAX_IMG_H) {
        h = MAX_IMG_H;
        w = Math.round((width * h) / height);
      }
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: index === 0 ? 160 : 40, after: 40 },
          keepNext: true,
          children: [new ImageRun({ type: 'png', data: buffer, transformation: { width: w, height: h }, altText: { title: description, description, name: file } })],
        }),
      );
    });
    const parts = list.length > 1 ? ` (${list.length} captures successives)` : '';
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Figure ${figure} — ${description}${parts}`, italics: true, size: 19, color: GRAY })] }));
    return out;
  }
  missingCaptures.push(list[0]);
  const file = list[0];
  figure += 1;
  const border = { style: BorderStyle.DASHED, size: 8, color: BRAND, space: 8 };
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: BRAND_SOFT, color: 'auto' },
      border: { top: border, left: border, bottom: border, right: border },
      spacing: { before: 200, after: 60 },
      keepNext: true,
      children: [
        new TextRun({ text: `[CAPTURE ${id} À INSÉRER]`, bold: true, color: BRAND }),
        new TextRun({ text: description, break: 1 }),
        new TextRun({ text: `Fichier : docs/rapport/captures/${file}`, break: 1, font: 'Consolas', size: 18, color: GRAY }),
      ],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Figure ${figure} — ${description}`, italics: true, size: 19, color: GRAY })] }),
  ];
}
function todo(text) {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: 'FFF6E0', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: 'E8890C', space: 8 } },
    spacing: { before: 80, after: 160 },
    children: [new TextRun({ text: 'À compléter : ', bold: true, color: '8A5A00' }), ...runs(text, { color: '8A5A00' })],
  });
}
function note(text) {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: 'E8F0FC', color: 'auto' },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: '1F5FBF', space: 8 } },
    spacing: { before: 80, after: 160 },
    children: runs(text, { color: '1F3F7F' }),
  });
}
function tbl(headers, rows, widths, caption) {
  const total = widths.reduce((a, b) => a + b, 0);
  const scaled = widths.map((w) => Math.floor((w / total) * CONTENT_WIDTH));
  scaled[scaled.length - 1] += CONTENT_WIDTH - scaled.reduce((a, b) => a + b, 0);
  const cell = (text, i, header) =>
    new TableCell({
      width: { size: scaled[i], type: WidthType.DXA },
      shading: header ? { type: ShadingType.CLEAR, fill: BRAND, color: 'auto' } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ spacing: { after: 0 }, children: runs(String(text), header ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19 }) })],
    });
  const out = [
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: scaled,
      rows: [
        new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
        ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => {
          const tc = cell(c, i, false);
          return tc;
        }) })),
      ],
    }),
  ];
  if (caption) {
    table += 1;
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 240 }, children: [new TextRun({ text: `Tableau ${table} — ${caption}`, italics: true, size: 19, color: GRAY })] }));
  } else {
    out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  }
  return out;
}
function codeBlock(lines) {
  return lines.map((line, i) =>
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: 'F7F8FA', color: 'auto' },
      spacing: { after: 0, line: 240 },
      border: {
        ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 6, color: 'DDE1E8', space: 4 } } : {}),
        left: { style: BorderStyle.SINGLE, size: 6, color: 'DDE1E8', space: 6 },
        ...(i === lines.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DDE1E8', space: 4 } } : {}),
        right: { style: BorderStyle.SINGLE, size: 6, color: 'DDE1E8', space: 6 },
      },
      children: [new TextRun({ text: line === '' ? ' ' : line, font: 'Consolas', size: 16 })],
    }),
  );
}

// Prompts mot pour mot depuis le journal
const journal = fs.readFileSync(path.join(ROOT, 'docs', 'prompts', 'JOURNAL.md'), 'utf8');
const textBlocks = [...journal.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\n$/, ''));
const promptP001 = textBlocks[0].split('\n');

// ---------- Contenu ----------
const children = [];

// Page de garde
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 120 }, children: [new TextRun({ text: 'ESPRIT — École Supérieure Privée d\'Ingénierie et de Technologies', size: 22, color: GRAY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1400 }, children: [new TextRun({ text: 'Module « IA for Software Engineering » — Année universitaire 2026-2027', size: 22, color: GRAY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'RAPPORT TECHNIQUE', bold: true, size: 26, color: BRAND, characterSpacing: 60 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Le Client Infernal', bold: true, size: 64, color: '161A22' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 12 } }, children: [new TextRun({ text: 'Plateforme d\'entraînement au recueil des besoins face à un client simulé par l\'IA', size: 28, color: GRAY })] }),
);
children.push(
  ...tbl(
    ['Membre', 'Module', 'Responsabilité'],
    [
      ['Khalil Abdelmoumen (chef de projet)', 'client-generator', 'Génération des scénarios de clients fictifs'],
      ['Kenza Baccar', 'interview', 'Entretien en chat avec le client simulé'],
      ['Ismail Ismail', 'change-requests', 'Demandes de changement et évaluation des réponses'],
      ['Nadhem Hmida', 'requirements', 'Éditeur et évaluation du cahier des charges'],
      ['Aziz Louati', 'dashboard', 'Historique, statistiques, recommandation, espace enseignant'],
    ],
    [3, 2, 4],
  ),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 80 }, children: [new TextRun({ text: 'Encadrant(e) : ', bold: true }), new TextRun({ text: '[à compléter]', color: '8A5A00' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Version 0.2 — 18 octobre 2026 (document de travail)', color: GRAY, size: 20 })] }),
);

// Sommaire
children.push(
  new Paragraph({ pageBreakBefore: true, spacing: { after: 240 }, children: [new TextRun({ text: 'Sommaire', bold: true, size: 36, color: BRAND })] }),
  new TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-2' }),
  note('Dans Word, faites un clic droit sur le sommaire puis « Mettre à jour les champs » (ou F9) pour afficher les numéros de page.'),
);

// Introduction
children.push(
  h1('Introduction générale'),
  p('Le recueil des besoins est l\'une des étapes les plus délicates du génie logiciel : un client exprime rarement son besoin réel du premier coup. Il le formule de manière vague, oublie des contraintes qui lui semblent évidentes et change d\'avis en cours de projet. Ces compétences s\'acquièrent surtout par la pratique, alors que les occasions de s\'exercer face à un vrai client sont rares pendant la formation.'),
  p('Le projet **« Le Client Infernal »** répond à ce problème : une plateforme web où l\'étudiant joue le rôle de l\'ingénieur et un grand modèle de langage (LLM) joue celui d\'un client fictif doté d\'une personnalité et d\'un **besoin caché**. L\'étudiant doit découvrir ce besoin lors d\'un entretien en chat, rédiger un cahier des charges, gérer des demandes de changement, puis il est évalué.'),
  p('Ce projet est réalisé dans le cadre du module « IA for Software Engineering ». Il a donc un double objectif : construire une application qui **utilise** l\'IA, et **utiliser l\'IA pour construire** cette application. C\'est pourquoi ce rapport accorde une place importante à la démarche : chaque étape importante a été conduite à l\'aide d\'un assistant de programmation (Claude Code), et chaque prompt est tracé dans un journal versionné avec le code.'),
  p('Le rapport est organisé comme suit. Le chapitre 1 présente le projet et l\'organisation de l\'équipe. Le chapitre 2 décrit la démarche d\'ingénierie assistée par l\'IA et analyse les prompts utilisés. Le chapitre 3 détaille l\'architecture technique, et le chapitre 4 la conception de l\'interface. Le chapitre 5 présente la réalisation de chaque module, le chapitre 6 les tests, avant une conclusion.'),
);

// Chapitre 1
children.push(
  h1('1. Présentation du projet'),
  h2('1.1 Contexte et problématique'),
  p('Dans les projets réels, une grande partie des échecs s\'explique par des exigences mal comprises : le logiciel livré répond à ce que le client a **dit**, pas à ce dont il avait **besoin**. Former les futurs ingénieurs à poser les bonnes questions, à identifier les contraintes implicites et à négocier les changements est donc essentiel. Or les exercices classiques (études de cas écrites) ne reproduisent ni l\'interaction ni la résistance d\'un vrai client.'),
  h2('1.2 Solution proposée'),
  p('« Le Client Infernal » simule ce client grâce à un LLM. Chaque séance d\'entraînement repose sur un **scénario** généré automatiquement selon un domaine (santé, logistique, commerce…) et un niveau de difficulté. Le scénario contient :'),
  bullet('un client fictif (nom, fonction, entreprise) et sa **personnalité** (traits, style de communication, humeur) ;'),
  bullet('le **contexte** de l\'entreprise et le **besoin exprimé**, volontairement vague ;'),
  bullet('le **besoin caché**, le vrai problème métier que l\'étudiant doit découvrir ;'),
  bullet('des **contraintes implicites** que le client juge évidentes et ne mentionne pas spontanément.'),
  h2('1.3 Parcours de l\'étudiant'),
  p('Une séance suit cinq étapes : choix du scénario, entretien avec le client, rédaction du cahier des charges, gestion des demandes de changement, puis évaluation et suivi. La figure suivante montre les interactions entre l\'étudiant et les modules.'),
  ...img('docs/rapport/images/02-parcours-etudiant.png', 'Parcours d\'un étudiant à travers les modules'),
  h2('1.4 Organisation de l\'équipe'),
  p('L\'application est découpée en cinq modules indépendants, un par membre, autour d\'une **base commune** (authentification, mise en page, gestion des erreurs, service IA). La note individuelle dépendant des contributions de chacun, ce découpage permet à chaque membre de travailler sur sa propre branche Git sans bloquer les autres.'),
  ...tbl(
    ['Module', 'Responsable', 'Rôle dans l\'application'],
    [
      ['1. client-generator', 'Khalil Abdelmoumen', 'Génère un scénario JSON selon un domaine et un niveau'],
      ['2. interview', 'Kenza Baccar', 'Chat où le LLM joue le client et ne révèle le besoin caché que si les questions s\'en approchent'],
      ['3. change-requests', 'Ismail Ismail', 'Génère des demandes de changement et évalue la réponse (accepter, négocier, refuser)'],
      ['4. requirements', 'Nadhem Hmida', 'Éditeur du cahier des charges et évaluation selon une grille, comparée au besoin caché'],
      ['5. dashboard', 'Aziz Louati', 'Historique, statistiques, recommandation du prochain scénario, espace enseignant'],
      ['Base commune', 'Équipe (pilotage : chef de projet)', 'Authentification et rôles, layout, erreurs, service IA, schéma de données'],
    ],
    [2.2, 2.2, 5],
    'Répartition des modules',
  ),
  h2('1.5 Contraintes obligatoires'),
  p('Quatre contraintes encadrent l\'usage de l\'IA dans l\'application. Elles ont guidé toute l\'architecture (voir section 3.7) :'),
  numbered('Aucune donnée personnelle brute n\'est envoyée au LLM : jamais le nom ni l\'email de l\'étudiant.', 'constraints'),
  numbered('Toute sortie du LLM est validée par un schéma Zod avant d\'être utilisée ou affichée.', 'constraints'),
  numbered('Les erreurs d\'appel au LLM sont gérées : délai dépassé, quota dépassé (429), clé API absente, réponse invalide.', 'constraints'),
  numbered('Le besoin caché ne quitte jamais le serveur : il est exclu de toutes les réponses envoyées au navigateur.', 'constraints'),
  h2('1.6 Choix technologiques'),
  ...tbl(
    ['Couche', 'Technologie', 'Justification'],
    [
      ['Front-end', 'React 19, Vite 7, React Router 7', 'Écosystème connu de l\'équipe, démarrage instantané en développement'],
      ['Back-end', 'Node.js, Express 5', 'Même langage que le front-end ; gestion native des erreurs asynchrones'],
      ['Données', 'PostgreSQL 16 + Prisma 6 (Docker)', 'Schéma typé, migrations versionnées, une base locale par membre'],
      ['Validation', 'Zod 4', 'Un seul outil pour valider les entrées HTTP et les sorties du LLM'],
      ['LLM', 'Service abstrait : Claude, OpenAI, Ollama, mock', 'Fournisseur interchangeable ; le mock permet de développer sans clé API'],
      ['Langage', 'JavaScript (modules ES)', 'Configuration minimale pour une équipe d\'étudiants ; Zod sert de contrat de types'],
    ],
    [1.4, 3, 4.6],
    'Stack technique',
  ),
);

// Chapitre 2
children.push(
  h1('2. Démarche d\'ingénierie assistée par l\'IA'),
  h2('2.1 Outil utilisé et mémoire du projet'),
  p('Le développement est assisté par **Claude Code**, l\'assistant de programmation d\'Anthropic, utilisé dans l\'éditeur VS Code. Contrairement à un chatbot généraliste, cet outil lit et écrit directement les fichiers du projet, exécute des commandes (installation, tests, base de données) et vérifie lui-même le résultat.'),
  p('Pour que l\'IA garde le contexte d\'une session à l\'autre et d\'un membre à l\'autre, le projet contient un fichier **`CLAUDE.md`** à la racine. Il reprend le cadre, les modules, la stack, les contraintes obligatoires et les conventions. Ce fichier est rechargé automatiquement à chaque session et partagé via Git : les cinq membres travaillent donc avec la même « mémoire » du projet.'),
  h2('2.2 Méthode de travail'),
  p('Chaque demande importante à l\'IA suit le même cycle, conçu pour garder le contrôle humain sur les décisions :'),
  numbered('**Contexte et objectif** : le prompt décrit le projet, les contraintes et le résultat attendu.', 'method'),
  numbered('**Plan avant action** : l\'IA présente son plan (fichiers, choix techniques) et pose ses questions ; rien n\'est créé avant validation.', 'method'),
  numbered('**Validation humaine** : l\'équipe répond aux questions et valide ou corrige le plan.', 'method'),
  numbered('**Génération** : l\'IA produit le code et la documentation.', 'method'),
  numbered('**Vérification** : l\'IA installe, lance les tests et le projet, et corrige les erreurs constatées.', 'method'),
  numbered('**Traçabilité** : le prompt et un résumé du résultat sont ajoutés au journal des prompts.', 'method'),
  h2('2.3 Traçabilité des prompts'),
  p('Le fichier `docs/prompts/JOURNAL.md` contient une entrée par demande : numéro (P-001, P-002…), date, auteur, module, prompt copié **mot pour mot** et résumé de ce que l\'IA a produit. Une rubrique « Modifications de l\'équipe » permet de noter ce qui a été corrigé ou réécrit à la main. Les prompts système utilisés **par l\'application** sont distincts : ils sont stockés dans le dossier `prompts/` de chaque module et ne sont jamais écrits en dur dans le code.'),
  ...tbl(
    ['N°', 'Date', 'Auteur', 'Objet'],
    [
      ['P-001', '17/10/2026', 'Khalil Abdelmoumen', 'Conception de l\'architecture et génération de la base de code'],
      ['P-002', '18/10/2026', 'Khalil Abdelmoumen', 'Correction de l\'auteur du premier commit avant publication'],
      ['P-003', '18/10/2026', 'Khalil Abdelmoumen', 'Charte graphique, maquettes UI/UX et début du rapport'],
      ['P-004', '18/10/2026', 'Khalil Abdelmoumen', 'Publication du travail et rédaction du prompt du module 1'],
      ['P-005', '18/10/2026', 'Khalil Abdelmoumen', 'Module 1 client-generator : version complète (v0.2)'],
      ['P-006', '18/10/2026', 'Khalil Abdelmoumen', 'Captures d\'écran et rapport v0.2'],
      ['P-007', '18/10/2026', 'Khalil Abdelmoumen', 'Guide de l\'équipe et prompts de départ des modules 2 à 5'],
      ['P-008', '18/10/2026', 'Khalil Abdelmoumen', 'Ordre de travail de l\'équipe et coordination des modules 3 et 4'],
      ['P-009', '18/10/2026', 'Khalil Abdelmoumen', 'Revue du module 4 et rapport généré à partir de sections Markdown'],
      ['P-010', '18/10/2026', 'Khalil Abdelmoumen', 'Accompagnement du module 2 et configuration de Kiro'],
      ['P-011', '18/10/2026', 'Khalil Abdelmoumen', 'Prompt court pour le module 2'],
      ['P-012', '19/10/2026', 'Khalil Abdelmoumen', 'Revue et fusion des modules 2 et 3'],
      ['P-013', '24/10/2026', 'Nadhem Hmida', 'Fournisseur compatible OpenAI (Gemini) : variable OPENAI_BASE_URL'],
      ['P-014', '25/10/2026', 'Khalil Abdelmoumen', 'Partie IA de chaque membre : techniques vues en cours'],
      ['P-015', '25/10/2026', 'Khalil Abdelmoumen', 'Finalisation : module 5, fin de séance, partie IA du module 3, rapport complet'],
      ['P-016', '25/10/2026', 'Khalil Abdelmoumen', 'Test de toute l\'application avec un vrai LLM (Gemini) et corrections'],
    ],
    [1, 1.4, 2.4, 5],
    'Prompts du journal commun (base commune et projet)',
  ),
  p('Les prompts propres à chaque module sont tracés dans le journal du module (`docs/prompts/<module>.md`, numérotés P-M1-001, P-M2-001…) et présentés au chapitre 5. Tous les membres ont utilisé un assistant de programmation : Claude Code (modules 1, 3 et 4), Kiro (modules 2 et 5) et Antigravity (module 3).'),
  h2('2.4 Prompt P-001 : génération de l\'architecture'),
  h3('Objectif'),
  p('Partir d\'un dossier vide et obtenir une base de code complète sur laquelle chaque membre peut travailler immédiatement, uniquement dans son module. Le prompt intégral figure en annexe A.'),
  h3('Structure du prompt'),
  p('Le prompt a été rédigé comme un cahier des charges adressé à un architecte logiciel. Il est découpé en cinq parties :'),
  ...tbl(
    ['Partie', 'Contenu', 'Intérêt'],
    [
      ['Consigne initiale', 'Rôle d\'architecte, dossier vide, « présente ton plan et attends ma validation »', 'Garde le contrôle humain avant toute création de fichier'],
      ['1. Contexte', 'Cadre, application, 5 modules, stack, contraintes, conventions, traçabilité (à copier dans CLAUDE.md)', 'Donne à l\'IA une mémoire persistante et partagée'],
      ['2. Documentation', 'ARCHITECTURE.md : diagrammes Mermaid, modèle de données, contrat d\'API, service IA, Git', 'Produit directement un contenu réutilisable dans ce rapport'],
      ['3. Base commune', 'Prisma + seed, authentification JWT, erreurs, service IA, layout client, Docker', 'Fixe les fondations que tous les modules partagent'],
      ['4. Squelettes', 'Pour chaque module : routes, controller, service, Zod, prompts, pages, README', 'Chaque membre démarre avec un exemple fonctionnel'],
      ['5. Finalisation', 'README, journal, Git (main, develop), vérification du démarrage', 'Exige une vérification réelle, pas seulement du code'],
    ],
    [1.6, 4.6, 3.6],
    'Structure du prompt P-001',
  ),
  ...capture('1', ['p001-01-prompt-1.png', 'p001-01-prompt-2.png', 'p001-01-prompt-3.png', 'p001-01-prompt-4.png'], 'Le prompt P-001 envoyé dans Claude Code'),
  h3('Plan proposé et validation'),
  p('Conformément à la consigne, l\'IA a d\'abord présenté un plan : arborescence complète, modèle de données, endpoints d\'exemple et protections prévues pour les contraintes obligatoires. Elle a ensuite posé quatre questions sur les points non précisés : JavaScript ou TypeScript, auteur de l\'entrée P-001, modèle Claude par défaut, port de la base de données. Les réponses ont conduit à choisir JavaScript et à confirmer qu\'**une base PostgreSQL locale par membre** est créée par Docker.'),
  ...capture('2', ['p001-02-plan-1.png', 'p001-02-plan-2.png', 'p001-02-plan-3.png', 'p001-02-plan-4.png'], 'Le plan d\'architecture proposé par l\'IA avant toute création de fichier'),
  ...capture('3', 'p001-03-questions.png', 'Les questions de l\'IA et les réponses du chef de projet'),
  h3('Résultat'),
  p('Après validation, l\'IA a généré **132 fichiers** : la documentation (`CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md`, journal), la base commune côté serveur et côté client, le schéma Prisma avec sa migration et ses données de démonstration, ainsi que les squelettes des cinq modules. Chaque module dispose d\'un endpoint d\'exemple fonctionnel, d\'un prompt système en brouillon, d\'une réponse simulée et d\'un README listant ses tâches.'),
  ...capture('4', ['p001-04-arborescence-1.png', 'p001-04-arborescence-2.png'], 'L\'arborescence générée, vue dans l\'explorateur de VS Code : côté serveur puis côté client'),
  h3('Vérifications effectuées par l\'IA'),
  bullet('Installation des dépendances et exécution de **13 tests automatisés** à ce stade (service IA, délai dépassé, quota 429, clé absente, réponse invalide, masquage des données personnelles, protection du besoin caché) : tous réussis.'),
  bullet('Démarrage de PostgreSQL avec Docker, création de la migration initiale, chargement des données de démonstration.'),
  bullet('Appel de tous les endpoints d\'exemple : contrôle des rôles, validation des entrées, format des erreurs et **absence du besoin caché** dans chaque réponse.'),
  bullet('Vérification de l\'erreur « clé API absente » (code 503) en forçant le fournisseur Claude sans clé.'),
  bullet('Compilation du client React et vérification du proxy vers l\'API.'),
  ...capture('5', 'p001-05-tests.png', 'Exécution des tests automatisés (npm test)'),
  ...capture('6', ['p001-06-application-connexion.png', 'p001-06-application-accueil.png'], 'L\'application lancée dans le navigateur (connexion et accueil)'),
  ...capture('7', 'p001-07-github.png', 'Le dépôt GitHub après le premier push (branches main et develop)'),
  h3('Analyse critique'),
  p('**Points forts du prompt.** Exiger un plan avant toute action a évité de générer un projet dans une mauvaise direction. La liste explicite des contraintes obligatoires a produit des mécanismes concrets et testés (masquage des données personnelles, triple protection du besoin caché) plutôt que de simples intentions. Enfin, demander une vérification réelle a permis de détecter des problèmes invisibles à la simple lecture du code.'),
  p('**Problèmes détectés et corrigés pendant la vérification.**'),
  bullet('Le port 5433 prévu pour PostgreSQL était déjà occupé sur la machine du chef de projet : le port est passé à **5434** et reste modifiable (variable `DB_PORT`).'),
  bullet('Un diagramme Mermaid de la documentation contenait une erreur de syntaxe (accent dans une étiquette sans guillemets) qui l\'aurait empêché de s\'afficher sur GitHub. Il a été détecté et corrigé lors de l\'export des figures de ce rapport (prompt P-003).'),
  p('**Limites.** Les prompts système des modules ne sont que des brouillons, à affiner par chaque responsable. Une faille de sécurité signalée par `npm audit` concerne l\'outil Prisma en ligne de commande (utilisé uniquement en développement) ; sa correction impose une montée de version majeure, reportée. Enfin, l\'interface générée était fonctionnelle mais sobre, ce qui a motivé le travail de conception UI/UX (prompt P-003).'),
  p('**Modifications de l\'équipe.** Aucune modification manuelle du code n\'a été consignée après P-001. Chaque correction a été demandée à l\'IA, puis tracée dans une nouvelle entrée du journal : P-002 pour l\'auteur des commits, P-005 pour le découplage des tests de la base commune, P-012 et P-015 pour les corrections faites à l\'intégration des modules.'),
  h2('2.5 Prompt P-002 : auteur des commits'),
  p('Avant le premier push, le chef de projet a demandé que l\'historique Git n\'affiche ni son pseudonyme GitHub ni l\'assistant comme co-auteur. L\'IA a réécrit le commit local (encore non publié) avec l\'identité « Khalil Abdelmoumen » et sans mention de co-auteur, puis a rappelé que GitHub rattache un commit à un compte par l\'adresse email. Le recours à l\'IA reste documenté de manière transparente dans ce rapport et dans le journal des prompts, comme l\'exige le module.'),
  h2('2.6 Prompt P-003 : interface et rapport'),
  p('Le troisième prompt demandait de préparer l\'interface (UI/UX) et de commencer ce rapport au format Word, avec des captures d\'écran comme preuves de la démarche. L\'IA a proposé deux options pour chaque livrable ; l\'équipe a retenu **une charte graphique accompagnée de maquettes**, et un **rapport Word** complété au fur et à mesure.'),
  p('Résultat : une charte graphique appliquée au fichier de styles commun de l\'application, dix maquettes d\'écrans couvrant les cinq modules, un script d\'export des maquettes et des diagrammes en images, et la première version du rapport (chapitre 4).'),
  ...capture('8', ['p003-01-prompt-1.png', 'p003-01-prompt-2.png'], 'Les deux messages du prompt P-003'),
  h2('2.7 Prompt P-004 : un prompt rédigé avec l\'IA'),
  p('Avant de développer son module, le chef de projet a demandé à l\'IA de publier le travail sur GitHub, puis de l\'aider à **rédiger un prompt unique et complet** pour le module 1. L\'objectif était de pouvoir présenter dans ce rapport un prompt clairement identifié et le résultat qu\'il a produit.'),
  p('Le prompt proposé reprend volontairement la structure de P-001 (rôle, contexte, plan avant action, contraintes, vérification, traçabilité) et l\'aligne sur le tableau officiel des modules. Il a été relu puis envoyé tel quel par le chef de projet : c\'est l\'entrée P-005. Cette démarche est assumée : l\'IA aide à formuler la demande, mais c\'est l\'humain qui la valide, l\'envoie et contrôle le résultat.'),
  h2('2.8 Prompt P-005 : version complète du module 1'),
  h3('Objectif et structure'),
  p('Faire passer le module 1 du squelette à une version complète et démontrable : choix du domaine, du niveau et de la personnalité, prompt système v0.2, consultation et suppression des scénarios, interface conforme à la maquette, mode sans clé API, tests et documentation. Le prompt se termine par une exigence de **résumé en six points** (demandé, réalisé, fichiers, vérifications, problèmes, limites), conçu pour alimenter directement ce rapport.'),
  ...capture('10', ['p005-01-prompt-1.png', 'p005-01-prompt-2.png'], 'Le prompt P-005 envoyé dans Claude Code'),
  h3('Déroulement'),
  p('Comme demandé, l\'IA a d\'abord présenté son plan (choix techniques, endpoints, fichiers) et posé deux questions : que faire lorsqu\'on supprime un scénario déjà joué par des étudiants, et qui peut générer des scénarios. Le chef de projet lui a délégué ces choix (« Faîtes ce qui convient le mieux ») ; l\'IA a appliqué ses recommandations et les a **documentées** : suppression refusée (erreur 409) pour ne pas effacer le travail des étudiants, génération ouverte aux deux rôles.'),
  ...capture('11', ['p005-02-plan-1.png', 'p005-02-plan-2.png', 'p005-02-plan-3.png'], 'Le plan proposé par l\'IA pour le module 1'),
  p('En cours de vérification, les tests ont révélé que des tests de la base commune dépendaient du prompt du module 1. Conformément à la contrainte du prompt (« si tu dois toucher la base commune, demande-moi avant »), l\'IA s\'est arrêtée et a proposé trois options au chef de projet, qui a choisi de découpler les tests.'),
  ...capture('12', 'p005-03-question-base-commune.png', 'La question posée par l\'IA avant de modifier la base commune'),
  h3('Analyse critique'),
  p('**Points forts.** La contrainte « demande avant de toucher la base commune » a réellement été respectée : l\'IA n\'a modifié le code partagé qu\'après accord, ce qui est essentiel dans un projet à cinq. Les tests exigés par le prompt ont détecté un couplage invisible à la lecture du code. Le format de résumé imposé rend le résultat directement exploitable (section 5.1).'),
  p('**Limites.** Déléguer une décision à l\'IA (« ce qui convient le mieux ») est efficace mais doit rester exceptionnel et tracé : les choix retenus sont consignés dans le journal. Le prompt système v0.2 n\'a pas encore été évalué avec un vrai fournisseur, faute de clé API : seul le mode simulé a été testé.'),
  h2('2.9 Les techniques du cours appliquées dans l\'application'),
  p('Chaque membre applique dans son module au moins une technique vue en cours (P-014). Les cours de référence sont « Prompt Engineering », « Génération du code assistée par l\'IA » (Séance 3) et « Adaptation et optimisation des LLM, intégration d\'une API IA » (Séance 4). Chaque technique répond à un problème réel du module et elle est vérifiée par des tests automatisés. Elle est détaillée dans la sous-section « Technique d\'IA du cours appliquée » de chaque section du chapitre 5.'),
  ...tbl(
    ['Module', 'Membre', 'Technique du cours', 'Application', 'Section'],
    [
      ['M1 Générateur de clients', 'Khalil Abdelmoumen', 'RAG (Séance 4) ; Knowledge generation (PE, p. 18)', 'Fiches métier retrouvées par similarité cosinus et injectées dans le prompt ; sources citées et vérifiées par Zod', '5.1'],
      ['M2 Entretien client', 'Kenza Baccar (réalisé par le chef de projet)', 'Chain-of-Thought et Few-shot (PE, p. 20-22) ; défense contre le prompt injection (p. 32)', 'Analyse de chaque question en 4 étapes avant la réponse ; 4 exemples de calibrage ; messages de l\'étudiant traités comme des données', '5.2'],
      ['M3 Demandes de changement', 'Ismail Ismail (réalisé par le chef de projet)', 'Self-consistency (PE, p. 16-17)', '3 évaluations indépendantes, vote majoritaire, note médiane, évaluation incertaine signalée', '5.3'],
      ['M4 Cahier des charges', 'Nadhem Hmida', 'Least-to-most (PE, p. 14-15) ; Few-shot', 'Besoin caché découpé en points traités un à un, notes de couverture calculées par le serveur', '5.4'],
      ['M5 Tableau de bord', 'Aziz Louati', 'Few-shot (PE, p. 20) ; données anonymisées (p. 34-35)', '3 exemples « historique → recommandation », points faibles avant la recommandation, historique anonymisé', '5.5'],
    ],
    [2, 2, 2.6, 4, 0.8],
    'Techniques d\'IA du cours appliquées par module',
  ),
  p('Le fine-tuning, LoRA, QLoRA, RAFT et le pruning (Séance 4) demandent un GPU et un jeu de données d\'entraînement que le projet n\'a pas : ils ne sont pas appliqués. La quantization est en revanche présente indirectement, par les modèles du fournisseur Ollama (section 3.6). Le cours de la Séance 3 structure enfin la manière dont l\'équipe a développé avec l\'IA (section 2.2) : prompts organisés en contexte, objectif, contraintes et format, plan demandé avant le code (Chain-of-Thought), itérations successives et vérification avant fusion (tests, contrôle des secrets, relecture).'),
);

// Chapitre 3
children.push(
  h1('3. Architecture technique'),
  h2('3.1 Vue d\'ensemble'),
  p('L\'application suit une architecture client-serveur classique en trois couches, complétée par un **service IA partagé** qui isole tous les appels au LLM.'),
  ...img('docs/rapport/images/01-architecture-globale.png', 'Architecture globale de l\'application'),
  ...tbl(
    ['Couche', 'Rôle'],
    [
      ['Présentation (React)', 'Interface en français. `shared/` contient le layout, l\'authentification et le client HTTP ; chaque module a ses pages dans `modules/<module>/`.'],
      ['API (Express)', 'Routes REST sous `/api`, middlewares communs : sécurité HTTP, authentification JWT, contrôle des rôles, validation Zod, filtre des secrets.'],
      ['Métier (services)', 'Découpage routes → controller → service dans chaque module ; la logique métier et l\'accès aux données sont dans le service.'],
      ['Service IA', 'Point d\'entrée unique vers les LLM : prompts en fichiers, masquage des données personnelles, délai, nouvelles tentatives, validation Zod.'],
      ['Données (Prisma)', 'Client unique, configuré pour omettre par défaut les champs secrets du scénario.'],
      ['Persistance', 'PostgreSQL 16 dans Docker, une base locale par membre.'],
    ],
    [2.2, 7.8],
    'Rôle de chaque couche',
  ),
  h2('3.2 Organisation du dépôt'),
  p('Le dépôt est un **monorepo** à deux espaces de travail npm (`server` et `client`). La base commune se trouve dans `server/src/shared/` et `client/src/shared/` ; chaque module occupe ses propres dossiers `server/src/modules/<module>/` et `client/src/modules/<module>/`. Deux **registres** (un côté serveur, un côté client) branchent automatiquement les cinq modules : aucun membre n\'a besoin de modifier la base commune pour rendre son module accessible, ce qui limite fortement les conflits Git.'),
  h2('3.3 Modèle de données'),
  ...img('docs/rapport/images/03-modele-de-donnees.png', 'Modèle de données (diagramme entité-association)'),
  ...tbl(
    ['Table', 'Propriétaire', 'Lue par'],
    [
      ['User, TrainingSession, AiCallLog', 'Base commune', 'Tous les modules'],
      ['Scenario', 'M1 client-generator', 'M2, M3, M4 (besoin caché côté serveur), M5'],
      ['InterviewMessage', 'M2 interview', 'M4 (optionnel), M5'],
      ['ChangeRequest', 'M3 change-requests', 'M5'],
      ['RequirementsDocument, Requirement, RequirementsEvaluation', 'M4 requirements', 'M3 (optionnel), M5'],
      ['TeacherFeedback', 'M5 dashboard', 'M5'],
    ],
    [4, 2.4, 3.6],
    'Propriétaire de chaque table',
  ),
  p('Règle : un module n\'écrit que dans ses propres tables ; il peut lire celles des autres. La table `TrainingSession` (une séance d\'un étudiant sur un scénario) relie tous les modules.'),
  h2('3.4 Circulation du scénario'),
  ...img('docs/rapport/images/04-circulation-scenario.png', 'Circulation du scénario du module 1 vers les modules 2 à 5'),
  p('Le module 1 génère et enregistre le scénario ; l\'API n\'en renvoie que la version publique. Les modules 2, 3 et 4 lisent le besoin caché côté serveur, uniquement pour construire leurs prompts : il part vers le LLM, jamais vers le navigateur.'),
  h2('3.5 Contrat d\'API'),
  p('Toutes les routes sont préfixées par `/api`, échangent du JSON et utilisent un format d\'erreur unique `{ error: { code, message, details } }`. Le contrat complet (y compris les endpoints prévus) est dans `docs/ARCHITECTURE.md` ; le tableau suivant liste les endpoints déjà fonctionnels.'),
  ...tbl(
    ['Module', 'Endpoints fonctionnels'],
    [
      ['Base commune', 'POST /auth/register, POST /auth/login, GET /auth/me, GET/POST /sessions, GET /sessions/:id, PATCH /sessions/:id/status, GET /health'],
      ['M1 client-generator', 'POST /client-generator/scenarios, GET /client-generator/scenarios, GET /client-generator/scenarios/:id'],
      ['M2 interview', 'GET et POST /interview/sessions/:id/messages'],
      ['M3 change-requests', 'GET /change-requests/sessions/:id, POST /change-requests/sessions/:id/generate'],
      ['M4 requirements', 'GET et PUT /requirements/sessions/:id/document'],
      ['M5 dashboard', 'GET /dashboard/me/stats (étudiant), GET /dashboard/teacher/overview (enseignant)'],
    ],
    [2.2, 7.8],
    'Endpoints implémentés à ce stade',
  ),
  h2('3.6 Service IA partagé'),
  p('Tous les appels au LLM passent par une fonction unique, `callLLM()`. Le module indique le prompt à utiliser, ses variables et le **schéma Zod** attendu ; le service se charge du reste.'),
  ...img('docs/rapport/images/05-service-ia.png', 'Déroulement d\'un appel au service IA'),
  ...tbl(
    ['Code d\'erreur', 'HTTP', 'Cas', 'Nouvelle tentative'],
    [
      ['AI_TIMEOUT', '504', 'Pas de réponse dans le délai', 'Oui'],
      ['AI_RATE_LIMIT', '429', 'Quota du fournisseur dépassé', 'Oui (respecte Retry-After)'],
      ['AI_MISSING_KEY', '503', 'Clé API absente ou refusée', 'Non'],
      ['AI_INVALID_RESPONSE', '502', 'Réponse vide, pas du JSON ou non conforme au schéma', 'Oui'],
      ['AI_PROVIDER_ERROR', '502', 'Fournisseur injoignable ou en erreur', 'Selon le cas'],
      ['AI_EMBEDDINGS_UNAVAILABLE', '503', 'Aucun fournisseur d\'embeddings configuré (le module utilise sa vectorisation locale)', 'Non'],
    ],
    [2.6, 0.9, 4, 2.4],
    'Erreurs gérées par le service IA',
  ),
  p('Le fournisseur est choisi par une variable d\'environnement. En mode `auto`, Claude est utilisé si une clé Anthropic est présente, sinon OpenAI, sinon un **fournisseur simulé (mock)** : chaque module fournit ses réponses simulées, ce qui permet à toute l\'équipe de développer sans clé API ni coût.'),
  p('Depuis P-M1-001, le service partagé fournit aussi des **embeddings** (`embedTexts()`), utilisés par le RAG du module 1 (section 5.1), avec les mêmes garanties que `callLLM` : timeout, nouvelles tentatives, validation Zod des vecteurs et journalisation sans contenu. Les fournisseurs sont OpenAI et Ollama ; sans fournisseur d\'embeddings, le code `AI_EMBEDDINGS_UNAVAILABLE` indique au module d\'utiliser sa vectorisation locale.'),
  p('Le test avec Gemini (P-016, section 6.4) a ajouté deux règles. La conversation envoyée au modèle se termine toujours par un message de l\'utilisateur. Après une réponse refusée par le schéma, la nouvelle tentative transmet au modèle sa réponse et le motif du refus : le champ et la règle non respectée, jamais un secret.'),
  p('Le fournisseur `ollama` exécute le modèle sur la machine, sans clé ni coût. Les modèles qu\'il propose sont généralement **quantifiés** (poids sur 4 bits) : c\'est la technique d\'optimisation vue en Séance 4, qui permet de faire tourner un LLM sur un ordinateur portable au prix d\'une légère perte de précision.'),
  h2('3.7 Sécurité et respect des contraintes'),
  ...tbl(
    ['Contrainte', 'Mise en œuvre'],
    [
      ['Pas de données personnelles envoyées au LLM', 'Les prompts ne contiennent que des données de scénario ; `callLLM` masque en plus l\'email, le nom et le prénom de l\'étudiant (testé automatiquement).'],
      ['Sorties du LLM validées par Zod', 'Le schéma est un paramètre obligatoire de `callLLM` ; seule la donnée validée est renvoyée.'],
      ['Erreurs du LLM gérées', 'Erreurs typées avec statut HTTP et message en français, nouvelles tentatives automatiques.'],
      ['Besoin caché côté serveur uniquement', 'Triple protection : omission par défaut dans Prisma, sérialiseur public, middleware qui retire les champs secrets de toute réponse.'],
      ['Mots de passe et rôles', 'Hachage bcrypt, jeton JWT, contrôle des rôles ; l\'inscription crée toujours un compte étudiant.'],
    ],
    [3, 7],
    'Mise en œuvre des contraintes obligatoires',
  ),
  h2('3.8 Travail en parallèle avec Git'),
  ...img('docs/rapport/images/06-branches-git.png', 'Stratégie de branches'),
  p('La branche `main` contient la version stable, `develop` sert à l\'intégration, et chaque membre travaille sur `feature/<module>`. Les commits suivent la convention « type(portée): description », par exemple `feat(interview): ajout de l\'historique du chat`. Toute modification du schéma de données passe par une migration et est signalée à l\'équipe.'),
  h2('3.9 Fin de séance et note finale'),
  p('Une séance se termine par l\'endpoint commun `PATCH /api/sessions/:sessionId/status`, appelé depuis le bilan de la séance (module 5). Terminer la séance exige un cahier des charges évalué. Le serveur calcule alors la note finale à partir des notes des trois étapes notées du parcours (`server/src/shared/sessions/sessionScore.js`, P-015). Une séance abandonnée n\'a pas de note.'),
  ...tbl(
    ['Étape', 'Note sur 100', 'Poids'],
    [
      ['Entretien (module 2)', 'Moyenne des 3 meilleures proximités des questions de l\'étudiant, × 100 : l\'exploration du contexte n\'est pas pénalisée', '30 %'],
      ['Cahier des charges (module 4)', 'Note globale de la dernière évaluation', '50 %'],
      ['Demandes de changement (module 3)', 'Moyenne des notes des demandes traitées', '20 %'],
    ],
    [3, 6, 1],
    'Calcul de la note finale d\'une séance',
  ),
  p('Les poids sont répartis sur les étapes déjà notées : une séance sans demande de changement est notée sur l\'entretien et le cahier des charges. Seules des notes agrégées sont exposées, jamais la proximité d\'une question ni un secret du scénario.'),
);

// Chapitre 4
const mockups = [
  ['01-connexion', 'Écran de connexion', 'Commun'],
  ['02-accueil', 'Accueil de l\'étudiant : séance en cours et accès aux modules', 'Commun'],
  ['03-m1-generateur', 'Module 1 — génération et choix d\'un scénario', 'M1'],
  ['04-m2-entretien', 'Module 2 — entretien avec le client simulé', 'M2'],
  ['05-m4-cahier-des-charges', 'Module 4 — éditeur du cahier des charges', 'M4'],
  ['06-m4-evaluation', 'Module 4 — évaluation du cahier des charges selon la grille', 'M4'],
  ['07-m3-demande-changement', 'Module 3 — réponse à une demande de changement', 'M3'],
  ['08-m5-tableau-de-bord', 'Module 5 — tableau de bord de l\'étudiant', 'M5'],
  ['09-m5-espace-enseignant', 'Module 5 — espace enseignant', 'M5'],
];
children.push(
  h1('4. Conception de l\'interface (UI/UX)'),
  h2('4.1 Intention'),
  p('La plateforme confronte l\'étudiant à un client exigeant, parfois de mauvaise foi ; l\'interface doit au contraire rester **calme, lisible et rassurante** : le défi vient du client, pas de l\'outil. L\'identité visuelle repose sur un rouge « infernal » pour la marque et les actions principales, un orange « flamme » réservé aux indices et à la progression, et des gris neutres pour le reste.'),
  h2('4.2 Charte graphique'),
  p('La charte est implémentée sous forme de **jetons de design** (variables CSS) et de composants réutilisables dans le fichier de styles commun `client/src/styles.css`. Les maquettes utilisent ce même fichier : un écran développé avec ces classes ressemble donc fidèlement à sa maquette. La charte complète est décrite dans `docs/ui/CHARTE.md`.'),
  ...img('docs/ui/maquettes/png/00-charte.png', 'Charte graphique : couleurs, typographie et composants'),
  ...tbl(
    ['Rôle', 'Couleur', 'Usage'],
    [
      ['Marque', '#B3261E', 'Boutons principaux, liens, élément actif'],
      ['Flamme', '#E8890C', 'Indices, jauges de progression'],
      ['Succès', '#1E7D4F', 'Étape terminée, bonne note, niveau débutant'],
      ['Attention', '#8A5A00', 'En attente, niveau intermédiaire'],
      ['Information', '#1F5FBF', 'Astuces, statut « en cours »'],
      ['Texte', '#161A22 / #5B6474', 'Texte principal / secondaire'],
    ],
    [2, 2.4, 5.6],
    'Palette de couleurs',
  ),
  p('Les contrastes ont été vérifiés par calcul selon le référentiel WCAG (niveau AA, 4,5:1 minimum pour le texte). Un gris trop clair (2,5:1), initialement utilisé pour de petits libellés, a été remplacé ; il est désormais réservé aux textes d\'exemple des champs et aux éléments décoratifs.'),
  h2('4.3 Principes d\'expérience utilisateur'),
  bullet('**Parcours guidé** : un indicateur d\'étapes (Scénario → Entretien → Cahier des charges → Changements → Évaluation) situe l\'étudiant dans sa séance.'),
  bullet('**La séance suit l\'étudiant** : elle est conservée dans l\'adresse de la page pour passer d\'un module à l\'autre sans la perdre.'),
  bullet('**Le besoin caché reste caché** : aucun écran ne l\'affiche, même indirectement ; les évaluations donnent des pistes, pas la réponse.'),
  bullet('**L\'IA est lente et faillible, on le montre** : chaque appel affiche un état d\'attente, et les erreurs temporaires proposent un bouton « Réessayer ».'),
  bullet('**Une action principale par écran**, et jamais d\'écran vide sans action pour avancer.'),
  bullet('**Accessibilité** : contraste AA, focus visible, libellés sur tous les champs, navigation au clavier, adaptation aux petits écrans.'),
  h2('4.4 Maquettes des écrans'),
  p('Les maquettes suivantes définissent la cible visuelle de chaque module. Les données affichées sont fictives ; certains éléments (fin d\'entretien, jauge de compétences…) correspondent à des fonctionnalités prévues que chaque responsable implémentera.'),
  ...mockups.flatMap(([file, caption]) => img(`docs/ui/maquettes/png/${file}.png`, caption)),
  ...capture('9', 'p003-02-maquettes-navigateur.png', 'Une maquette ouverte dans le navigateur (écran d\'entretien, docs/ui/maquettes/04-m2-entretien.html)'),
);

// Chapitre 5
const moduleChapters = [
  ['5.1 Module 1 — Générateur de clients', 'Khalil Abdelmoumen', 'client-generator'],
  ['5.2 Module 2 — Entretien client', 'Kenza Baccar', 'interview'],
  ['5.3 Module 3 — Demandes de changement', 'Ismail Ismail', 'change-requests'],
  ['5.4 Module 4 — Cahier des charges', 'Nadhem Hmida', 'requirements'],
  ['5.5 Module 5 — Tableau de bord', 'Aziz Louati', 'dashboard'],
];
children.push(
  h1('5. Réalisation des modules'),
  p('Chaque responsable rédige la section de son module, en suivant la même structure : objectif et fonctionnalités, prompts utilisés, réalisation et captures, tests, difficultés et apport de l\'IA, limites.'),
);
const SECTIONS_DIR = path.join(ROOT, 'docs', 'rapport', 'sections');
for (const [title, owner, mod] of moduleChapters) {
  const file = path.join(SECTIONS_DIR, `${title.slice(0, 3)}-${mod}.md`);
  if (fs.existsSync(file)) {
    children.push(...markdownSection(fs.readFileSync(file, 'utf8')));
    continue;
  }
  children.push(
    h2(title),
    p(`**Responsable :** ${owner} · **Branche :** \`feature/${mod}\` · **Dossiers :** \`server/src/modules/${mod}/\`, \`client/src/modules/${mod}/\``),
    h3('Objectif et fonctionnalités'),
    todo('décrire les fonctionnalités réalisées et les endpoints implémentés.'),
    h3('Prompts utilisés'),
    todo('lister les prompts du journal (P-xxx) liés au module : prompts de développement adressés à l\'assistant et prompts système de l\'application (dossier prompts/), avec leurs versions successives.'),
    h3('Réalisation et captures'),
    todo('ajouter les captures des écrans réalisés et les comparer aux maquettes du chapitre 4.'),
    h3('Difficultés et apport de l\'IA'),
    todo('analyser ce que l\'IA a bien fait, ce qu\'il a fallu corriger à la main, et les limites rencontrées.'),
  );
}

/**
 * Convertit une section Markdown (docs/rapport/sections/*.md) en éléments Word.
 * Syntaxe reconnue (volontairement simple) :
 *   ## Titre de la section              ### Sous-titre
 *   Paragraphe avec **gras** et `code`   - puce
 *   > À compléter : texte (encadré orange)       > texte (encadré bleu)
 *   | a | b |  (tableau, 1re ligne = en-tête)    Tableau : légende (ligne juste après le tableau)
 *   ![légende](../captures/fichier.png)   (plusieurs lignes consécutives de même légende = une figure)
 *   <!-- commentaire --> (ignoré)
 */
function markdownSection(markdown) {
  const out = [];
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  let i = 0;
  const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
    } else if (line.startsWith('### ')) {
      out.push(h3(line.slice(4)));
      i += 1;
    } else if (line.startsWith('## ')) {
      out.push(h2(line.slice(3)));
      i += 1;
    } else if (line.startsWith('- ')) {
      out.push(bullet(line.slice(2)));
      i += 1;
    } else if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      const match = text.match(/^À compléter\s*:\s*(.*)$/);
      out.push(match ? todo(match[1]) : note(text));
      i += 1;
    } else if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!/^\|(\s*:?-+:?\s*\|)+$/.test(lines[i].trim())) rows.push(cells(lines[i]));
        i += 1;
      }
      // Légende « Tableau : … » juste après le tableau (lignes vides tolérées)
      let caption;
      let look = i;
      while (look < lines.length && lines[look].trim() === '') look += 1;
      const next = (lines[look] ?? '').trim();
      if (next.startsWith('Tableau :')) {
        caption = next.replace(/^Tableau :\s*/, '');
        i = look + 1;
      }
      const [header, ...body] = rows;
      const widths = header.map((_, column) => {
        const lengths = rows.map((row) => (row[column] ?? '').length);
        return Math.min(60, Math.max(6, lengths.reduce((a, b) => a + b, 0) / lengths.length));
      });
      out.push(...tbl(header, body.map((row) => header.map((_, column) => row[column] ?? '')), widths, caption));
    } else if (line.startsWith('![')) {
      const figures = [];
      while (i < lines.length && lines[i].trim().startsWith('![')) {
        const [, alt, src] = lines[i].trim().match(/^!\[(.*?)\]\((.*?)\)$/) ?? [];
        if (src) figures.push({ alt, file: path.basename(src) });
        i += 1;
      }
      // regroupement des images consécutives de même légende en une seule figure
      let start = 0;
      while (start < figures.length) {
        let end = start + 1;
        while (end < figures.length && figures[end].alt === figures[start].alt) end += 1;
        const group = figures.slice(start, end);
        out.push(...capture(null, group.map((figure) => figure.file), group[0].alt));
        start = end;
      }
    } else {
      out.push(p(line));
      i += 1;
    }
  }
  return out;
}

// Chapitre 6
children.push(
  h1('6. Tests et validation'),
  h2('6.1 Tests automatisés'),
  p('Le projet compte **241 tests automatisés**, tous réussis et aucun ignoré (`npm test`, base de démonstration lancée).'),
  ...tbl(
    ['Partie', 'Tests', 'Ce qui est vérifié en priorité'],
    [
      ['Base commune', '32', 'Service IA (dont la correction demandée après un refus), embeddings, données personnelles, besoin caché, fin de séance et note finale'],
      ['M1 Générateur de clients', '36', 'Schémas, RAG (découpage, cosinus, TF-IDF, MMR, embeddings et seuils par modèle), sources citées, endpoints'],
      ['M2 Entretien client', '36', 'Schémas, Chain-of-Thought et Few-shot, prompt injection, ordre des messages, endpoints'],
      ['M3 Demandes de changement', '45', 'Schémas, protection du besoin caché, Self-consistency, endpoints'],
      ['M4 Cahier des charges', '37', 'Schémas, correspondance (Least-to-most), versions, endpoints'],
      ['M5 Tableau de bord', '55', 'Schémas, Few-shot, anonymisation, bilan de séance, rôles et isolation'],
      ['Total', '241', ''],
    ],
    [3, 1, 6],
    'Répartition des tests automatisés',
  ),
  p('Ceux de la base commune vérifient en priorité les contraintes obligatoires :'),
  bullet('validation Zod des réponses, extraction du JSON, nouvelles tentatives sur erreur 429, absence de nouvelle tentative sur clé absente, délai dépassé ;'),
  bullet('mêmes garanties pour le service d\'embeddings : un vecteur par texte, de même dimension, nouvelles tentatives, délai dépassé, format des requêtes OpenAI et Ollama ;'),
  bullet('absence du nom, du prénom et de l\'email de l\'étudiant dans tout ce qui est envoyé au fournisseur IA ;'),
  bullet('absence du besoin caché et des contraintes implicites dans les réponses de l\'API, y compris dans des objets imbriqués.'),
  h2('6.2 Tests d\'intégration'),
  p('Lors de la génération de l\'architecture (P-001), tous les endpoints d\'exemple ont été appelés sur une base réelle avec les comptes de démonstration : connexion, contrôle des rôles (un étudiant ne peut pas accéder à l\'espace enseignant, un enseignant ne peut pas envoyer de message à la place d\'un étudiant), validation des entrées et format des erreurs.'),
  p('Chaque module ajoute ses propres tests d\'intégration, qui démarrent l\'application et s\'exécutent sur la base de démonstration (ignorés automatiquement si la base n\'est pas lancée). Les fichiers de test étant exécutés en parallèle, les tests créent leurs propres séances et les suppriment à la fin : aucun module ne modifie les données utilisées par un autre.'),
  p('**Un test ignoré n\'est pas un test réussi.** Lors de la fusion du module 5, deux fichiers d\'intégration s\'arrêtaient à chaque exécution sur une erreur interceptée, avec le message « comptes de démonstration absents ». `npm test` affichait « 0 échec » alors que ces tests ne s\'étaient jamais exécutés (section 5.5). Depuis, la campagne de validation exige aussi « 0 ignoré », base lancée.'),
  h2('6.3 Campagne de tests finale'),
  p('Avant la démonstration, un parcours complet a été joué par l\'API puis vérifié dans le navigateur, en mode simulé et avec le compte étudiant de démonstration. Il couvre trois séances :'),
  bullet('génération d\'un client par le RAG (module 1) ;'),
  bullet('entretien de 5 questions et synthèse (module 2) ;'),
  bullet('cahier des charges de 5 exigences, soumis puis évalué (module 4) ;'),
  bullet('une demande de changement négociée (module 3) ;'),
  bullet('pour deux des séances, fin de séance (module 5).'),
  ...tbl(
    ['Séance', 'Cahier des charges', 'Changement (votes)', 'Note finale'],
    [
      ['Tourisme · débutant · client coopératif', '51', '78 (3 NEGOTIATE sur 3)', '65,1'],
      ['Santé · intermédiaire · client méfiant', '46', '78 (3 NEGOTIATE sur 3)', '62,6'],
      ['Logistique · intermédiaire · client pressé', '48', '78 (3 NEGOTIATE sur 3)', 'séance laissée en cours'],
    ],
    [4, 2, 3, 2],
    'Résultats de la campagne finale (mode simulé)',
  ),
  p('Les résultats sont conformes aux règles : notes finales calculées selon la pondération de la section 3.9, recommandation produite par l\'IA (« Éducation · débutant · client méfiant ») après deux séances terminées, commentaire de l\'enseignant visible par l\'étudiant, générateur pré-rempli par la recommandation. Les captures des sections 5.1 à 5.5 ont été prises à l\'issue de cette campagne, dans un navigateur piloté automatiquement. Aucune réponse de l\'API ne contenait le besoin caché, les contraintes implicites, une proximité individuelle ou un raisonnement de l\'IA, et le filet de sécurité `responseGuard` n\'a jamais eu à intervenir.'),
  p('Le mode simulé applique les mêmes schémas Zod et les mêmes contrôles que les vrais fournisseurs, mais il ne mesure pas la qualité des réponses d\'un vrai LLM. Le parcours a donc été rejoué avec Gemini (section 6.4).'),
  h2('6.4 Test avec un vrai LLM (Gemini)'),
  p('Le 25 octobre 2026 (P-016), toute l\'application a été lancée avec un vrai LLM : Gemini, de Google, par son API compatible OpenAI (variable `OPENAI_BASE_URL`, P-013). Le modèle `gemini-flash-lite-latest` produit les réponses et `gemini-embedding-001` les embeddings du RAG. La clé API, gratuite, reste dans `server/.env`, exclu de Git : elle n\'apparaît ni dans le code, ni dans le journal, ni dans ce rapport.'),
  p('Une séance complète a été jouée par l\'API avec le compte étudiant de démonstration :'),
  bullet('génération d\'un client du domaine Restauration, niveau intermédiaire, client méfiant ;'),
  bullet('entretien de 6 questions, dont une tentative de prompt injection ;'),
  bullet('cahier des charges de 4 exigences ;'),
  bullet('une demande de changement négociée ;'),
  bullet('fin de séance et recommandation.'),
  p('Le cahier des charges avait été rédigé avant de connaître le client : il porte sur des réservations de restaurant, alors que le client généré est un traiteur. C\'est voulu : le test vérifie aussi que l\'évaluation ne récompense pas un document hors sujet.'),
  ...tbl(
    ['Module', 'Résultat avec Gemini', 'Temps de réponse'],
    [
      ['M1 Générateur de clients', '« Le Grenier Gourmand », traiteur pour événements. Le RAG retient une fiche du domaine Restauration avec les vrais embeddings. La demande exprimée (un formulaire de devis en ligne) est éloignée du besoin caché. Le besoin caché est reformulé : au plus 4 mots consécutifs identiques à la fiche, sur 27.', '5,0 s, dont la vectorisation des 36 blocs de la base'],
      ['M2 Entretien client', 'Le client reste un gérant méfiant et révèle ses difficultés peu à peu : devis faits à la main, prix des matières premières qui varient, mariages réalisés à perte. L\'injection est classée « manipulation » et ne révèle rien. La synthèse relève la tentative de manipulation.', '1,1 à 1,8 s par message, synthèse 1,8 s'],
      ['M4 Cahier des charges', 'Note de 25 sur 100, dont 0 sur 30 pour la couverture du besoin réel : c\'est la note attendue pour un document hors sujet.', '4,0 s (2 appels)'],
      ['M3 Demandes de changement', 'La demande porte sur le vrai problème : suivre les prix des matières premières et alerter si la marge descend sous 25 %. La réponse négociée obtient 85, avec 3 évaluations sur 3 concordantes. La réaction du client correspond à sa personnalité.', 'Génération 1,4 s, 3 évaluations en parallèle 2,4 s'],
      ['M5 Tableau de bord', 'Note finale de 50,5. L\'IA recommande un scénario Commerce de détail, niveau intermédiaire, client bavard, parce que les entretiens de l\'étudiant sont trop courts.', '1,1 s'],
    ],
    [2.4, 5.6, 2],
    'Parcours complet avec Gemini',
  ),
  p('Le journal technique `AiCallLog` compte **17 appels** pour cette séance : 2 pour les embeddings et 15 pour les réponses, sans erreur ni nouvelle tentative. Les 16 endpoints de lecture de la séance ont ensuite été appelés avec les comptes étudiant et enseignant. Aucune réponse ne contenait le besoin caché, une contrainte implicite, une proximité ou un raisonnement de l\'IA, et `responseGuard` n\'a jamais eu à intervenir.'),
  ...capture(null, 'p016-01-entretien-gemini.png', 'Entretien joué avec Gemini : la tentative d\'injection et la réponse du client, resté dans son rôle'),
  ...capture(null, 'p016-02-changement-gemini.png', 'Demande de changement générée et évaluée par Gemini (3 évaluations sur 3 concordantes)'),
  h3('Défauts révélés et corrigés'),
  p('Le test a révélé trois défauts. Les deux premiers ne pouvaient pas apparaître en mode simulé. Chaque correction est vérifiée par un nouveau test automatisé.'),
  bullet('**Conversation terminée par le modèle.** Pour la synthèse de l\'entretien, l\'historique envoyé se terminait par la dernière réponse du client. Gemini refuse une telle requête (erreur 400). Le service IA partagé ajoute désormais un dernier message de l\'utilisateur. C\'est aussi plus sûr avec Claude, qui prendrait cette fin pour un début de réponse à compléter.'),
  bullet('**Nouvelle tentative identique à la précédente.** Le client a recopié mot pour mot une contrainte implicite. La protection du module 2 a refusé la réponse, mais chaque nouvelle tentative renvoyait la même requête : trois refus, puis une erreur 502 pour l\'étudiant. Désormais, la nouvelle tentative transmet au modèle sa réponse refusée et le motif du refus. Lors du parcours rejoué ensuite, aucune réponse n\'a été refusée.'),
  bullet('**Ordre des messages de l\'entretien.** La question et la réponse sont enregistrées dans la même transaction et recevaient la même date. L\'historique pouvait donc afficher la réponse avant la question. Les deux messages reçoivent maintenant des dates distinctes. À date égale, la question est triée avant la réponse, ce qui répare aussi les messages déjà enregistrés.'),
  h3('Calibrage des embeddings du RAG'),
  p('Les seuils de pertinence du module 1 avaient été fixés pour la vectorisation locale et pour des embeddings génériques. Avec `gemini-embedding-001`, les scores sont plus élevés et plus resserrés :'),
  bullet('de 0,62 à 0,76 pour les blocs du bon domaine ;'),
  bullet('de 0,49 à 0,62 pour les blocs des autres domaines.'),
  p('Avec l\'ancienne règle (score d\'au moins 0,3 et d\'au moins 85 % du meilleur), 9 blocs d\'autres fiches passaient le seuil pour le domaine Santé. Pour un domaine sans fiche comme Aéronautique, les 36 blocs le passaient tous. Une règle propre à ce modèle a été ajoutée : un score d\'au moins 0,6, à moins de 0,03 du meilleur. Pour un domaine sans fiche, le meilleur score reste sous 0,6 (0,59 pour Aéronautique, 0,56 pour Jeux vidéo) : aucune fiche n\'est retenue et le scénario est généré sans fiche, comme prévu.'),
  h3('Limites de ce test'),
  bullet('Il porte sur une seule séance, avec un seul modèle, sur l\'offre gratuite de Gemini, qui limite le nombre d\'appels par minute et par jour.'),
  bullet('Le commentaire d\'évaluation du module 4 oriente l\'étudiant vers « les véritables problématiques de gestion et de chiffrage » du client, sans recopier le besoin caché. La limite relevée par Nadhem lors de P-013 est donc confirmée : le prompt evaluate-document reste à renforcer.'),
  bullet('Les 3 évaluations de l\'auto-cohérence ont concordé sur l\'unique réponse évaluée : la proportion d\'évaluations incertaines reste à mesurer sur davantage de réponses.'),
);

// Conclusion
children.push(
  h1('Conclusion et perspectives'),
  h2('Bilan fonctionnel'),
  p('« Le Client Infernal » couvre tout le parcours prévu : un client fictif généré à partir d\'une base de connaissances métier, un entretien où le besoin caché ne se révèle qu\'aux bonnes questions, un cahier des charges évalué point par point contre ce besoin, des demandes de changement à négocier, puis un bilan, une note finale et une recommandation du prochain scénario. L\'enseignant suit chaque étudiant et commente ses séances. Les quatre contraintes obligatoires sont respectées et vérifiées par des tests : aucune donnée personnelle envoyée au LLM, toute sortie validée par Zod, erreurs du LLM gérées, besoin caché jamais transmis au front-end.'),
  h2('Bilan de l\'usage de l\'IA'),
  p('L\'IA intervient à deux niveaux. **Dans l\'application**, chaque module applique une technique du cours (section 2.9) :'),
  bullet('RAG pour ancrer les scénarios dans des situations réelles ;'),
  bullet('Chain-of-Thought et Few-shot pour un client cohérent qui résiste aux manipulations ;'),
  bullet('Self-consistency pour des évaluations reproductibles ;'),
  bullet('Least-to-most pour une évaluation du cahier des charges justifiable point par point ;'),
  bullet('Few-shot pour une recommandation ciblée.'),
  p('**Pour développer**, chaque membre a travaillé avec un assistant de programmation, selon la méthode de la Séance 3 : prompt structuré, plan avant le code, validation humaine, tests et traçabilité de chaque prompt.'),
  p('Trois enseignements se dégagent :'),
  bullet('**Le code garantit ce que le prompt demande.** Les consignes du prompt sont doublées de vérifications par le code : schémas Zod, contrôle de fuite, valeurs autorisées. L\'exemple du module 5 le montre : des exemples Few-shot erronés auraient été reproduits par le modèle.'),
  bullet('**Les défauts se révèlent à l\'intégration.** Les problèmes les plus graves ne se voyaient pas dans un module isolé et sont apparus à la fusion : séance terminée trop tôt (P-012), tests ignorés en silence, aucune fin de séance (P-015). Le test avec un vrai LLM en a révélé trois autres (P-016). L\'intégration et le parcours complet doivent être testés régulièrement, pas seulement à la fin.'),
  bullet('**Les décisions restent humaines.** Une IA produit vite un module plausible ; c\'est la relecture, les tests réellement exécutés et les décisions humaines qui le rendent fiable.'),
  h2('Perspectives'),
  bullet('Étendre le test avec un vrai LLM (section 6.4) : plusieurs séances par module, d\'autres fournisseurs (Claude, OpenAI) et la part d\'évaluations incertaines de l\'auto-cohérence.'),
  bullet('Renforcer le prompt d\'évaluation du cahier des charges, pour que ses commentaires n\'orientent pas vers le besoin caché.'),
  bullet('Ajouter l\'export CSV et les filtres de l\'espace enseignant, des notifications de commentaires et un mode sombre.'),
  bullet('Enrichir la base de connaissances (plus de situations par domaine, nouveaux domaines).'),
);

// Annexes
children.push(
  h1('Annexe A — Prompt P-001 intégral'),
  p('Prompt envoyé à Claude Code le 17 octobre 2026 par le chef de projet, reproduit mot pour mot.'),
  ...codeBlock(promptP001),
);

// Annexe B : construite à la fin, à partir de toutes les captures réellement utilisées dans le rapport
function annexB() {
  const describeFiles = (files) => {
    const names = files.map((file) => file.replace(/\.png$/, ''));
    return names.length === 1 ? names[0] : `${names[0]} (+${names.length - 1})`;
  };
  return [
    h1('Annexe B — Captures d\'écran'),
    p('Les captures sont enregistrées dans `docs/rapport/captures/`. Celles qui manquent apparaissent dans le rapport sous forme de cadre « Capture à insérer » : il suffit d\'ajouter le fichier puis de relancer `npm run rapport`.'),
    ...tbl(
      ['N°', 'Fichier(s)', 'Contenu', 'État'],
      captureRegistry.map((entry, index) => [String(index + 1), describeFiles(entry.files), entry.description, entry.present ? 'Insérée' : 'À fournir']),
      [0.6, 3.6, 4.6, 1.2],
      'Liste des captures',
    ),
  ];
}
children.push(...annexB());

// ---------- Document ----------
const doc = new Document({
  creator: 'Équipe Le Client Infernal',
  title: 'Le Client Infernal — Rapport technique',
  description: 'Rapport technique du projet Le Client Infernal (ESPRIT, IA for Software Engineering)',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22, color: '161A22' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, color: BRAND }, paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '161A22' }, paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '8C1D18' }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }, { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } }] },
      ...['steps', 'constraints', 'method'].map((reference) => ({ reference, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] })),
    ],
  },
  sections: [
    {
      properties: { titlePage: true, page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Le Client Infernal — Rapport technique', size: 17, color: GRAY })] })] }),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ESPRIT · IA for Software Engineering · 2026-2027 — page ', size: 17, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], size: 17, color: GRAY })] })] }),
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children,
    },
  ],
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
// docx-js écrit les bordures dans l'ordre top/bottom/left/right ; le schéma Word impose top/left/bottom/right.
async function fixBorderOrder(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml').async('string');
  const order = ['top', 'left', 'bottom', 'right', 'between', 'bar'];
  const fixed = xml.replace(/<w:pBdr>([\s\S]*?)<\/w:pBdr>/g, (match, inner) => {
    const items = inner.match(/<w:(\w+)\b[^>]*\/>/g) ?? [];
    items.sort((a, b) => order.indexOf(a.match(/<w:(\w+)/)[1]) - order.indexOf(b.match(/<w:(\w+)/)[1]));
    return `<w:pBdr>${items.join('')}</w:pBdr>`;
  });
  zip.file('word/document.xml', fixed);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

Packer.toBuffer(doc).then(fixBorderOrder).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  if (missingCaptures.length) console.log('Captures manquantes :', missingCaptures.join(', '));
  console.log(`Rapport généré : ${OUT} (${Math.round(buffer.length / 1024)} Ko, ${figure} figures, ${table} tableaux)`);
});
