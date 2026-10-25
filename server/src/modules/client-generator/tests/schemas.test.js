// Tests unitaires du module client-generator (sans base de données).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateScenarioBodySchema,
  createGeneratedScenarioSchema,
  listScenariosQuerySchema,
} from '../client-generator.schemas.js';
import { LEVELS, PROFILE_IDS, IMPLICIT_CONSTRAINTS_RANGE, resolveProfile, getLevel } from '../client-generator.catalog.js';
import generateScenarioMock from '../mocks/generate-scenario.mock.js';
import { FAMILIES } from '../mocks/scenario-templates.js';
import { loadPrompt } from '../../../shared/ai/promptLoader.js';

const validScenario = (constraintCount) => ({
  title: 'Cabinet test : rendez-vous',
  clientName: 'Dr Test',
  clientRole: 'Médecin',
  companyName: 'Cabinet Test (fictif)',
  personality: { traits: ['pressé', 'direct'], communicationStyle: 'Phrases courtes', mood: 'stressé' },
  context: 'Un cabinet de trois médecins avec une seule secrétaire, débordée par les appels téléphoniques.',
  expressedNeed: 'Je veux une application de rendez-vous.',
  hiddenNeed: 'Réduire les rendez-vous non honorés qui font perdre du temps et de l\'argent.',
  implicitConstraints: Array.from({ length: constraintCount }, (_, i) => `Contrainte numéro ${i + 1}`),
});

test('la personnalité vaut « aléatoire » par défaut', () => {
  const body = generateScenarioBodySchema.parse({ domain: 'Santé', level: 'BEGINNER' });
  assert.equal(body.personality, 'RANDOM');
});

test('un profil de personnalité inconnu est refusé', () => {
  assert.equal(generateScenarioBodySchema.safeParse({ domain: 'Santé', level: 'BEGINNER', personality: 'GRUMPY' }).success, false);
  assert.equal(listScenariosQuerySchema.safeParse({ personality: 'RANDOM' }).success, false);
});

test('le nombre de contraintes implicites doit correspondre au niveau', () => {
  for (const level of LEVELS) {
    const [min, max] = IMPLICIT_CONSTRAINTS_RANGE[level.id];
    const schema = createGeneratedScenarioSchema(level.id);
    assert.equal(schema.safeParse(validScenario(min)).success, true, `${level.id} min`);
    assert.equal(schema.safeParse(validScenario(max)).success, true, `${level.id} max`);
    if (min > 1) assert.equal(schema.safeParse(validScenario(min - 1)).success, false, `${level.id} trop peu`);
    if (max < 6) assert.equal(schema.safeParse(validScenario(max + 1)).success, false, `${level.id} trop`);
  }
});

test('un besoin caché identique au besoin exprimé est refusé', () => {
  const scenario = { ...validScenario(2), hiddenNeed: 'Je veux une application de rendez-vous !' };
  const result = createGeneratedScenarioSchema('BEGINNER').safeParse(scenario);
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], 'hiddenNeed');
});

test('« aléatoire » est remplacé par un vrai profil', () => {
  for (let i = 0; i < 20; i += 1) {
    assert.ok(PROFILE_IDS.includes(resolveProfile('RANDOM').id));
  }
  assert.equal(resolveProfile('SKEPTICAL').id, 'SKEPTICAL');
});

test('le mock est conforme au schéma pour chaque domaine, niveau et profil', () => {
  const domains = [...FAMILIES.map((family) => family.keywords[0]), 'Agriculture'];
  for (const domain of domains) {
    for (const level of LEVELS) {
      for (const personalityId of PROFILE_IDS) {
        const scenario = generateScenarioMock({ variables: { domain, levelId: level.id, personalityId } });
        const result = createGeneratedScenarioSchema(level.id).safeParse(scenario);
        assert.ok(result.success, `${domain}/${level.id}/${personalityId} : ${result.error?.issues[0]?.message}`);
      }
    }
  }
});

test('le mock évite un titre déjà existant quand c\'est possible', () => {
  const first = generateScenarioMock({ variables: { domain: 'Santé', levelId: 'BEGINNER' } }, () => 0);
  const second = generateScenarioMock({ variables: { domain: 'Santé', levelId: 'BEGINNER', existingTitles: `- ${first.title}` } }, () => 0);
  assert.notEqual(first.title, second.title);
});

test('le prompt v0.3 se construit avec les variables fournies par le service', async () => {
  for (const level of LEVELS) {
    const prompt = await loadPrompt('client-generator', 'generate-scenario', {
      domain: 'Santé',
      level: getLevel(level.id).label.toLowerCase(),
      levelRules: await loadPrompt('client-generator', `level-${level.id.toLowerCase()}`, {}),
      personalityLabel: 'Méfiant',
      personalityBehavior: 'doute de tout',
      existingTitles: 'Aucun.',
      knowledge: '[sante-01] Santé — Fiche de test\n- Organisation : Cabinet médical',
    });
    assert.ok(prompt.includes('Santé'));
    assert.ok(prompt.includes('[sante-01]'), 'fiches du RAG absentes du prompt');
    assert.ok(prompt.includes('knowledgeSources'));
    assert.ok(!prompt.includes('{{'), 'variable non remplacée');
    assert.ok(!prompt.includes('<!--'), 'commentaire non retiré');
  }
});
