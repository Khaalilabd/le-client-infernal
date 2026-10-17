// Données de démonstration : 1 enseignant, 2 étudiants, 3 scénarios, 2 séances.
// Lancement : npm run db:seed (le script vide d'abord toutes les tables).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Password123!';

const scenarios = [
  {
    domain: 'Commerce de détail',
    level: 'BEGINNER',
    title: 'Boulangerie artisanale : commandes en ligne',
    clientName: 'M. Hédi Ben Salah',
    clientRole: 'Gérant',
    companyName: 'Boulangerie Le Bon Grain (fictive)',
    personality: { traits: ['chaleureux', 'bavard', 'peu technique'], communicationStyle: 'Raconte des anecdotes', mood: 'enthousiaste' },
    context:
      'Boulangerie familiale de quartier avec deux points de vente. Les commandes de gâteaux se font par téléphone et sont notées sur un cahier. ' +
      'Plusieurs commandes ont été oubliées le mois dernier.',
    expressedNeed: 'Je veux un site web pour que les clients puissent commander leurs gâteaux.',
    hiddenNeed: "Ne plus perdre de commandes : il faut un suivi centralisé des commandes pour les deux boutiques, avec rappel la veille de la date de retrait.",
    implicitConstraints: ['Le personnel utilise uniquement un smartphone', 'Paiement à la boutique uniquement'],
  },
  {
    domain: 'Santé',
    level: 'INTERMEDIATE',
    title: 'Cabinet médical : gestion des rendez-vous',
    clientName: 'Dr Amira Gharbi',
    clientRole: 'Médecin généraliste associée',
    companyName: 'Cabinet Les Oliviers (fictif)',
    personality: { traits: ['pressée', 'directe', 'exigeante'], communicationStyle: 'Réponses courtes, souvent interrompue', mood: 'fatiguée' },
    context:
      'Cabinet de trois médecins avec une seule secrétaire. Le téléphone sonne sans arrêt et beaucoup de patients ne viennent pas à leur rendez-vous.',
    expressedNeed: 'Il nous faut une application de prise de rendez-vous en ligne.',
    hiddenNeed: 'Réduire les rendez-vous non honorés (environ 20 %) qui font perdre du temps et de l\'argent, grâce à des confirmations et une liste d\'attente.',
    implicitConstraints: [
      'Données de santé : confidentialité et hébergement conforme',
      'Patients âgés peu à l\'aise avec internet',
      'Aucune formation possible pour la secrétaire avant 3 mois',
    ],
  },
  {
    domain: 'Logistique',
    level: 'ADVANCED',
    title: 'Transporteur régional : suivi de flotte',
    clientName: 'M. Karim Jaziri',
    clientRole: 'Directeur des opérations',
    companyName: 'TransSahel Express (fictive)',
    personality: { traits: ['méfiant', 'contradictoire', 'orienté coûts'], communicationStyle: 'Change d\'avis, teste son interlocuteur', mood: 'sceptique' },
    context:
      'Entreprise de 40 camions. Un précédent prestataire a livré un logiciel abandonné au bout de six mois. ' +
      'Les clients se plaignent de ne jamais savoir quand leur marchandise arrivera.',
    expressedNeed: 'Je veux voir mes camions sur une carte en temps réel.',
    hiddenNeed: 'Fidéliser les clients professionnels qui partent chez la concurrence : ils veulent une estimation fiable de l\'heure de livraison et être prévenus des retards.',
    implicitConstraints: [
      'Les chauffeurs refusent d\'installer une application personnelle',
      'Zones sans réseau mobile sur certains trajets',
      'Budget validé seulement si retour sur investissement en moins d\'un an',
      'Intégration obligatoire avec le logiciel de facturation existant',
    ],
  },
];

async function main() {
  // Nettoyage (ordre inverse des dépendances)
  await prisma.teacherFeedback.deleteMany();
  await prisma.requirementsEvaluation.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.requirementsDocument.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.interviewMessage.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.scenario.deleteMany();
  await prisma.aiCallLog.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const teacher = await prisma.user.create({
    data: { email: 'enseignant@demo.tn', firstName: 'Sonia', lastName: 'Mansour', role: 'TEACHER', passwordHash },
  });
  const student1 = await prisma.user.create({
    data: { email: 'etudiant1@demo.tn', firstName: 'Yassine', lastName: 'Ferchichi', role: 'STUDENT', passwordHash },
  });
  const student2 = await prisma.user.create({
    data: { email: 'etudiant2@demo.tn', firstName: 'Ines', lastName: 'Hamdi', role: 'STUDENT', passwordHash },
  });

  const [bakery, clinic] = await Promise.all(
    scenarios.map((scenario) => prisma.scenario.create({ data: { ...scenario, createdById: teacher.id } })),
  );

  // Séance en cours pour l'étudiant 1 (données pour les modules 2, 3 et 4)
  const session1 = await prisma.trainingSession.create({
    data: { studentId: student1.id, scenarioId: bakery.id },
  });

  await prisma.interviewMessage.createMany({
    data: [
      { sessionId: session1.id, sender: 'STUDENT', content: 'Bonjour, pouvez-vous me décrire votre activité ?', proximity: 0.2 },
      { sessionId: session1.id, sender: 'CLIENT', content: 'Bien sûr ! Nous faisons du pain et surtout des gâteaux sur commande, dans nos deux boutiques.' },
      { sessionId: session1.id, sender: 'STUDENT', content: 'Comment gérez-vous les commandes actuellement, et quels problèmes rencontrez-vous ?', proximity: 0.7 },
      { sessionId: session1.id, sender: 'CLIENT', content: 'On note tout sur un cahier… et le mois dernier, on a oublié deux gâteaux d\'anniversaire. Une catastrophe !' },
    ],
  });

  await prisma.changeRequest.create({
    data: {
      sessionId: session1.id,
      title: 'Ajouter la livraison à domicile',
      description: 'Le client veut proposer la livraison des gâteaux à domicile.',
      reason: 'Un concurrent vient de lancer ce service.',
      impact: { scope: 'Commandes et planning', effort: 'HIGH', risk: 'Retard de la première version' },
    },
  });

  const document = await prisma.requirementsDocument.create({ data: { sessionId: session1.id } });
  await prisma.requirement.createMany({
    data: [
      {
        documentId: document.id,
        type: 'FUNCTIONAL',
        code: 'EF-01',
        title: 'Saisie d\'une commande',
        description: 'Le système doit permettre au personnel d\'enregistrer une commande avec la date de retrait et la boutique.',
        priority: 'MUST',
        position: 0,
      },
      {
        documentId: document.id,
        type: 'USER_STORY',
        code: 'US-01',
        title: 'Rappel de commande',
        description: 'En tant que vendeur, je veux recevoir la liste des commandes du lendemain afin de ne rien oublier.',
        priority: 'MUST',
        acceptanceCriteria: ['La liste est disponible chaque soir à 18 h', 'Elle regroupe les deux boutiques'],
        position: 1,
      },
      {
        documentId: document.id,
        type: 'NON_FUNCTIONAL',
        code: 'ENF-01',
        title: 'Utilisation sur smartphone',
        description: 'L\'interface doit être utilisable sur un smartphone sans formation préalable.',
        priority: 'SHOULD',
        position: 2,
      },
    ],
  });

  // Séance terminée pour l'étudiant 2 (données pour le dashboard)
  const session2 = await prisma.trainingSession.create({
    data: {
      studentId: student2.id,
      scenarioId: clinic.id,
      status: 'COMPLETED',
      finalScore: 72,
      completedAt: new Date(),
    },
  });
  await prisma.teacherFeedback.create({
    data: {
      sessionId: session2.id,
      teacherId: teacher.id,
      comment: 'Bon entretien. Les contraintes de confidentialité auraient dû apparaître dans les exigences non fonctionnelles.',
      grade: 14,
    },
  });

  console.log('Seed terminé.');
  console.log(`Comptes de démonstration (mot de passe : ${DEMO_PASSWORD}) :`);
  console.log('  - enseignant@demo.tn (TEACHER)');
  console.log('  - etudiant1@demo.tn  (STUDENT, une séance en cours)');
  console.log('  - etudiant2@demo.tn  (STUDENT, une séance terminée)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
