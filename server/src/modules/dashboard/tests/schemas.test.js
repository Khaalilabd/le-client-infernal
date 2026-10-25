import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sessionParamsSchema,
  studentIdParamsSchema,
  teacherFeedbackBodySchema,
  recommendationSchema,
} from '../dashboard.schemas.js';
import recommendScenarioMock from '../mocks/recommend-scenario.mock.js';
import { loadPrompt } from '../../../shared/ai/promptLoader.js';

// ---------- Tests des schémas Zod ----------

test('sessionParamsSchema valide un ID de session correct', () => {
  const valid = { sessionId: 'abc123' };
  assert.ok(sessionParamsSchema.safeParse(valid).success);
});

test('sessionParamsSchema refuse un ID vide', () => {
  const invalid = { sessionId: '' };
  assert.equal(sessionParamsSchema.safeParse(invalid).success, false);
});

test('studentIdParamsSchema valide un ID d\'étudiant correct', () => {
  const valid = { studentId: 'user123' };
  assert.ok(studentIdParamsSchema.safeParse(valid).success);
});

test('studentIdParamsSchema refuse un ID vide', () => {
  const invalid = { studentId: '' };
  assert.equal(studentIdParamsSchema.safeParse(invalid).success, false);
});

test('teacherFeedbackBodySchema valide un commentaire et une note valides', () => {
  const valid = {
    comment: 'Excellent travail sur le recueil des besoins.',
    grade: 16.5,
  };
  assert.ok(teacherFeedbackBodySchema.safeParse(valid).success);
});

test('teacherFeedbackBodySchema valide un commentaire sans note', () => {
  const valid = {
    comment: 'Bon travail, continuez ainsi.',
  };
  assert.ok(teacherFeedbackBodySchema.safeParse(valid).success);
});

test('teacherFeedbackBodySchema refuse un commentaire trop court', () => {
  const invalid = { comment: 'Ok', grade: 15 };
  assert.equal(teacherFeedbackBodySchema.safeParse(invalid).success, false);
});

test('teacherFeedbackBodySchema refuse un commentaire trop long', () => {
  const invalid = { comment: 'a'.repeat(3001), grade: 15 };
  assert.equal(teacherFeedbackBodySchema.safeParse(invalid).success, false);
});

test('teacherFeedbackBodySchema refuse une note hors limites', () => {
  assert.equal(
    teacherFeedbackBodySchema.safeParse({ comment: 'Commentaire valide', grade: -1 }).success,
    false,
  );
  assert.equal(
    teacherFeedbackBodySchema.safeParse({ comment: 'Commentaire valide', grade: 21 }).success,
    false,
  );
});

test('recommendationSchema valide une recommandation complète', () => {
  const valid = {
    weaknesses: ['Entretien trop court', 'Exigences imprécises'],
    domain: 'e-commerce',
    level: 'BEGINNER',
    personality: 'COOPERATIVE',
    focusSkill: 'Recueil des besoins',
    rationale: 'Vous devez poser plus de questions ouvertes pour découvrir le vrai besoin.',
  };
  assert.ok(recommendationSchema.safeParse(valid).success);
});

test('recommendationSchema valide une recommandation sans personality', () => {
  const valid = {
    weaknesses: ['Points à améliorer'],
    domain: 'santé',
    level: 'INTERMEDIATE',
    focusSkill: 'Gestion des changements',
    rationale: 'Passez au niveau intermédiaire.',
  };
  assert.ok(recommendationSchema.safeParse(valid).success);
});

test('recommendationSchema refuse une liste de faiblesses vide', () => {
  const invalid = {
    weaknesses: [],
    domain: 'finance',
    level: 'ADVANCED',
    focusSkill: 'Analyse critique',
    rationale: 'Excellents résultats.',
  };
  assert.equal(recommendationSchema.safeParse(invalid).success, false);
});

test('recommendationSchema refuse trop de faiblesses', () => {
  const invalid = {
    weaknesses: ['1', '2', '3', '4', '5', '6'],
    domain: 'logistique',
    level: 'BEGINNER',
    focusSkill: 'Découverte',
    rationale: 'Trop de problèmes.',
  };
  assert.equal(recommendationSchema.safeParse(invalid).success, false);
});

test('recommendationSchema refuse un niveau invalide', () => {
  const invalid = {
    weaknesses: ['Problème détecté'],
    domain: 'industrie',
    level: 'EXPERT',
    focusSkill: 'Analyse',
    rationale: 'Niveau expert n\'existe pas.',
  };
  assert.equal(recommendationSchema.safeParse(invalid).success, false);
});

test('recommendationSchema refuse un domaine trop court', () => {
  const invalid = {
    weaknesses: ['Problème'],
    domain: 'a',
    level: 'BEGINNER',
    focusSkill: 'Test',
    rationale: 'Domaine invalide.',
  };
  assert.equal(recommendationSchema.safeParse(invalid).success, false);
});

test('recommendationSchema refuse une rationale trop courte', () => {
  const invalid = {
    weaknesses: ['Problème'],
    domain: 'éducation',
    level: 'BEGINNER',
    focusSkill: 'Test',
    rationale: 'Court.',
  };
  assert.equal(recommendationSchema.safeParse(invalid).success, false);
});

// ---------- Tests du mock ----------

test('le mock recommend-scenario est conforme au schéma avec historique vide', () => {
  const result = recommendScenarioMock({ variables: { history: '[]' } });
  const parsed = recommendationSchema.safeParse(result);
  assert.ok(parsed.success, parsed.error?.issues[0]?.message);
  assert.ok(result.weaknesses.length > 0);
  assert.ok(result.domain.length >= 2);
  assert.ok(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(result.level));
});

test('le mock recommend-scenario détecte les faiblesses dans l\'historique', () => {
  const history = JSON.stringify([
    {
      domain: 'santé',
      level: 'BEGINNER',
      finalScore: 55,
      interviewQuestions: 4,
      requirementsScore: 45,
      changeRequestsScore: 50,
    },
  ]);

  const result = recommendScenarioMock({ variables: { history } });
  const parsed = recommendationSchema.safeParse(result);
  assert.ok(parsed.success, parsed.error?.issues[0]?.message);

  // Doit détecter entretien court, exigences faibles, changements faibles
  assert.ok(
    result.weaknesses.some((w) => w.includes('questions') || w.includes('court')),
    'Entretien court non détecté',
  );
  assert.ok(
    result.weaknesses.some((w) => w.includes('xigences') || w.includes('imprécis')),
    'Exigences faibles non détectées',
  );
  assert.ok(
    result.weaknesses.some((w) => w.includes('changement')),
    'Changements faibles non détectés',
  );
});

test('le mock recommend-scenario recommande un niveau supérieur pour bon étudiant', () => {
  const history = JSON.stringify([
    {
      domain: 'e-commerce',
      level: 'BEGINNER',
      finalScore: 80,
      interviewQuestions: 12,
      requirementsScore: 85,
      changeRequestsScore: 75,
    },
  ]);

  const result = recommendScenarioMock({ variables: { history } });
  const parsed = recommendationSchema.safeParse(result);
  assert.ok(parsed.success, parsed.error?.issues[0]?.message);

  // Avec un bon score, doit recommander un niveau supérieur
  assert.ok(['INTERMEDIATE', 'ADVANCED'].includes(result.level));
  assert.ok(result.rationale.includes('75') || result.rationale.includes('80'));
});

test('le mock recommend-scenario évite les domaines déjà testés', () => {
  const history = JSON.stringify([
    { domain: 'e-commerce', level: 'BEGINNER', finalScore: 70, interviewQuestions: 10 },
    { domain: 'santé', level: 'BEGINNER', finalScore: 65, interviewQuestions: 9 },
    { domain: 'finance', level: 'BEGINNER', finalScore: 68, interviewQuestions: 11 },
  ]);

  const result = recommendScenarioMock({ variables: { history } });
  const parsed = recommendationSchema.safeParse(result);
  assert.ok(parsed.success, parsed.error?.issues[0]?.message);

  // Doit recommander un domaine différent
  assert.ok(!['e-commerce', 'santé', 'finance'].includes(result.domain));
});

test('le mock recommend-scenario adapte la personnalité aux faiblesses', () => {
  const history = JSON.stringify([
    {
      domain: 'logistique',
      level: 'BEGINNER',
      finalScore: 60,
      interviewQuestions: 5,
      requirementsScore: 70,
      changeRequestsScore: 45,
    },
  ]);

  const result = recommendScenarioMock({ variables: { history } });
  const parsed = recommendationSchema.safeParse(result);
  assert.ok(parsed.success, parsed.error?.issues[0]?.message);

  // Peu de questions → RESERVED ; faible changements → DEMANDING
  if (result.personality) {
    assert.ok(['RESERVED', 'DEMANDING'].includes(result.personality));
  }
});

test('le mock recommend-scenario identifie la compétence à travailler', () => {
  const history = JSON.stringify([
    {
      domain: 'industrie',
      level: 'BEGINNER',
      finalScore: 50,
      interviewQuestions: 15,
      requirementsScore: 30,
      changeRequestsScore: 70,
    },
  ]);

  const result = recommendScenarioMock({ variables: { history } });
  const parsed = recommendationSchema.safeParse(result);
  assert.ok(parsed.success, parsed.error?.issues[0]?.message);

  // Beaucoup de questions mais faible score exigences → focusSkill = Rédaction
  assert.ok(result.focusSkill.includes('daction') || result.focusSkill.includes('xigences'));
  assert.ok(result.rationale.includes('cahier') || result.rationale.includes('xigences'));
});

// ---------- Tests du prompt ----------

test('le prompt recommend-scenario v0.2 se construit avec toutes les variables', async () => {
  const history = JSON.stringify([
    {
      domain: 'e-commerce',
      level: 'BEGINNER',
      finalScore: 65,
      interviewQuestions: 8,
      requirementsScore: 60,
      changeRequestsScore: 70,
    },
  ]);

  const prompt = await loadPrompt('dashboard', 'recommend-scenario', { history });

  // Vérifie la présence des sections Few-shot
  assert.ok(prompt.includes('Historique'), 'Section Historique manquante');
  assert.ok(prompt.includes('Analyse'), 'Section Analyse manquante');
  assert.ok(prompt.includes('Recommandation'), 'Section Recommandation manquante');

  // Vérifie que les 3 exemples Few-shot sont présents
  assert.ok(
    (prompt.match(/Historique :/g) || []).length >= 3,
    'Il doit y avoir au moins 3 exemples',
  );

  // Vérifie que l'historique est bien injecté
  assert.ok(prompt.includes('e-commerce'));

  // Vérifie qu'il n'y a pas de variables non remplacées
  assert.ok(!prompt.includes('{{'), 'Variable non remplacée');
  assert.ok(!prompt.includes('<!--'), 'Commentaire non retiré');
});

test('le prompt recommend-scenario se construit avec l\'historique fourni', async () => {
  const history = JSON.stringify([
    {
      domain: 'finance',
      level: 'BEGINNER',
      finalScore: 70,
      interviewQuestions: 10,
      requirementsScore: 65,
      changeRequestsScore: 70,
    },
  ]);

  const prompt = await loadPrompt('dashboard', 'recommend-scenario', { history });

  // Vérifie que les données de l'historique sont bien présentes
  assert.ok(prompt.includes('finance'), 'Domaine absent du prompt');
  assert.ok(prompt.includes('BEGINNER'), 'Niveau absent du prompt');
  
  // Important : le service doit envoyer un historique déjà anonymisé
  // Ce test vérifie que le prompt utilise bien l'historique fourni
  assert.ok(prompt.includes(history.substring(0, 30)), 'L\'historique n\'est pas injecté correctement');
});
