// Gabarits utilisés par le mock du prompt generate-scenario (démo sans clé API).
// Chaque famille de domaine propose plusieurs situations ; le style dépend du profil de personnalité.

export const FAMILIES = [
  {
    id: 'sante',
    keywords: ['santé', 'sante', 'médical', 'medical', 'clinique', 'hôpital', 'hopital', 'pharmacie', 'cabinet'],
    situations: [
      {
        org: 'Cabinet médical Les Oliviers',
        subject: 'prise de rendez-vous',
        clientName: 'Dr Amira Gharbi',
        clientRole: 'Médecin associée',
        context: 'Trois médecins partagent une seule secrétaire. Le téléphone sonne en continu le matin et beaucoup de patients ne se présentent pas à leur rendez-vous. Les créneaux libérés au dernier moment restent vides.',
        expressedNeed: 'je veux une application de prise de rendez-vous en ligne',
        hiddenNeed: 'Réduire les rendez-vous non honorés (environ 20 % des créneaux), qui font perdre du temps et de l\'argent, grâce à des confirmations et une liste d\'attente pour réattribuer les créneaux libérés.',
      },
      {
        org: 'Pharmacie du Centre',
        subject: 'gestion des commandes',
        clientName: 'M. Walid Chaabane',
        clientRole: 'Pharmacien titulaire',
        context: 'La pharmacie commande ses produits auprès de trois grossistes. Les ruptures de stock sur les traitements chroniques obligent à renvoyer des patients fidèles, qui finissent par aller ailleurs.',
        expressedNeed: 'je voudrais un logiciel pour passer mes commandes plus vite',
        hiddenNeed: 'Éviter les ruptures sur les traitements chroniques en anticipant les renouvellements d\'ordonnances, pour ne plus perdre les patients réguliers.',
      },
    ],
    constraints: [
      'Les données de santé doivent rester confidentielles et hébergées de manière conforme',
      'Une partie des patients est âgée et peu à l\'aise avec internet',
      'Aucune formation du personnel n\'est possible avant trois mois',
      'Le logiciel métier actuel ne peut pas être remplacé',
      'Le budget est limité à un abonnement mensuel modeste',
      'Le service doit fonctionner pendant les gardes du week-end',
    ],
  },
  {
    id: 'education',
    keywords: ['éducation', 'education', 'école', 'ecole', 'formation', 'université', 'universite', 'lycée', 'crèche'],
    situations: [
      {
        org: 'École privée Les Jasmins',
        subject: 'communication avec les parents',
        clientName: 'Mme Leila Mansouri',
        clientRole: 'Directrice',
        context: 'L\'école compte 400 élèves. Les informations aux parents passent par des carnets papier et des groupes de messagerie gérés par chaque enseignant. Les réclamations de parents mal informés augmentent chaque trimestre.',
        expressedNeed: 'je veux une application pour envoyer des messages aux parents',
        hiddenNeed: 'Garantir que chaque parent reçoit et lit les informations importantes (absences, retards de paiement, sorties), avec une trace de lecture, pour réduire les conflits avec les familles.',
      },
      {
        org: 'Centre de formation ProSkills',
        subject: 'suivi des stagiaires',
        clientName: 'M. Anis Ferjani',
        clientRole: 'Responsable pédagogique',
        context: 'Le centre forme des adultes en reconversion financés par des organismes publics. Les feuilles de présence papier sont souvent incomplètes et les remboursements des financeurs arrivent avec des mois de retard.',
        expressedNeed: 'il me faut une plateforme de cours en ligne',
        hiddenNeed: 'Fiabiliser les justificatifs de présence exigés par les financeurs pour être remboursé à temps et préserver la trésorerie du centre.',
      },
    ],
    constraints: [
      'Les enseignants refusent d\'utiliser leur numéro personnel',
      'Une partie des parents n\'a pas d\'ordinateur, seulement un téléphone',
      'Les informations doivent pouvoir être envoyées en arabe et en français',
      'Les financeurs exigent des justificatifs signés',
      'L\'année scolaire commence dans deux mois',
      'Le budget est voté une fois par an par le conseil d\'administration',
    ],
  },
  {
    id: 'commerce',
    keywords: ['commerce', 'boutique', 'vente', 'magasin', 'restaurant', 'restauration', 'boulangerie', 'e-commerce', 'détail'],
    situations: [
      {
        org: 'Boulangerie Le Bon Grain',
        subject: 'commandes de gâteaux',
        clientName: 'M. Hédi Ben Salah',
        clientRole: 'Gérant',
        context: 'Boulangerie familiale avec deux points de vente. Les commandes de gâteaux sont prises par téléphone et notées sur un cahier dans chaque boutique. Plusieurs commandes ont été oubliées le mois dernier.',
        expressedNeed: 'je veux un site web pour que les clients commandent leurs gâteaux',
        hiddenNeed: 'Ne plus perdre de commandes : un suivi centralisé des commandes des deux boutiques, avec un rappel la veille de la date de retrait.',
      },
      {
        org: 'Restaurant Dar Zitouna',
        subject: 'gestion des réservations',
        clientName: 'Mme Sarra Bouazizi',
        clientRole: 'Propriétaire',
        context: 'Le restaurant est complet le week-end mais à moitié vide en semaine. Les réservations arrivent par téléphone, par messagerie et sur les réseaux sociaux, et des tables sont parfois réservées deux fois.',
        expressedNeed: 'je veux un système de réservation en ligne',
        hiddenNeed: 'Remplir le restaurant en semaine en fidélisant les clients du week-end, et supprimer les doubles réservations en centralisant tous les canaux.',
      },
    ],
    constraints: [
      'Le personnel utilise uniquement un smartphone',
      'Le paiement se fait sur place uniquement',
      'Aucune licence payante supplémentaire n\'est acceptée',
      'Le lancement doit précéder la période des fêtes',
      'La connexion internet du local est instable',
      'Les prix changent chaque saison',
    ],
  },
  {
    id: 'logistique',
    keywords: ['logistique', 'transport', 'livraison', 'entrepôt', 'entrepot', 'flotte', 'distribution'],
    situations: [
      {
        org: 'TransSahel Express',
        subject: 'suivi de flotte',
        clientName: 'M. Karim Jaziri',
        clientRole: 'Directeur des opérations',
        context: 'L\'entreprise exploite 40 camions. Un précédent prestataire a livré un logiciel abandonné au bout de six mois. Les clients professionnels se plaignent de ne jamais savoir quand leur marchandise arrivera.',
        expressedNeed: 'je veux voir mes camions sur une carte en temps réel',
        hiddenNeed: 'Fidéliser les clients professionnels qui partent chez la concurrence : leur donner une heure de livraison fiable et les prévenir automatiquement des retards.',
      },
      {
        org: 'Entrepôts Medina Stock',
        subject: 'gestion des emplacements',
        clientName: 'Mme Rim Hammami',
        clientRole: 'Responsable d\'entrepôt',
        context: 'L\'entrepôt stocke la marchandise de quinze clients. Les préparateurs perdent du temps à chercher les palettes et les erreurs d\'expédition entraînent des pénalités contractuelles.',
        expressedNeed: 'il me faut un logiciel de gestion de stock',
        hiddenNeed: 'Réduire les erreurs d\'expédition qui coûtent des pénalités, en guidant les préparateurs vers le bon emplacement et en contrôlant chaque colis avant le départ.',
      },
    ],
    constraints: [
      'Les chauffeurs refusent d\'installer une application sur leur téléphone personnel',
      'Certaines zones du trajet n\'ont pas de réseau mobile',
      'L\'investissement doit être rentabilisé en moins d\'un an',
      'L\'intégration avec le logiciel de facturation existant est obligatoire',
      'Les préparateurs portent des gants et utilisent des terminaux durcis',
      'L\'activité ne peut pas être interrompue pendant le déploiement',
    ],
  },
  {
    id: 'finance',
    keywords: ['banque', 'finance', 'assurance', 'comptabilité', 'comptabilite', 'crédit', 'microfinance'],
    situations: [
      {
        org: 'Cabinet comptable Fiducia',
        subject: 'collecte des pièces',
        clientName: 'M. Mehdi Kallel',
        clientRole: 'Expert-comptable associé',
        context: 'Le cabinet gère 120 petites entreprises. Les clients envoient leurs factures en vrac, par email ou en papier, souvent la veille des déclarations fiscales. Les collaborateurs font des heures supplémentaires chaque fin de mois.',
        expressedNeed: 'je veux un espace en ligne pour que mes clients déposent leurs factures',
        hiddenNeed: 'Lisser la charge de travail du cabinet en obtenant les pièces tout au long du mois, avec des relances automatiques, pour éviter les retards de déclaration et leurs pénalités.',
      },
      {
        org: 'Mutuelle Assur\'Ensemble',
        subject: 'déclaration de sinistres',
        clientName: 'Mme Nadia Saidi',
        clientRole: 'Responsable du service client',
        context: 'Les adhérents déclarent leurs sinistres par téléphone. Les dossiers incomplets font des allers-retours pendant des semaines et le taux de satisfaction a fortement baissé cette année.',
        expressedNeed: 'il nous faut une application mobile pour les adhérents',
        hiddenNeed: 'Réduire le délai de traitement des sinistres en obtenant des dossiers complets dès la première déclaration, pour regagner la confiance des adhérents.',
      },
    ],
    constraints: [
      'Les données financières sont soumises au secret professionnel',
      'Un audit de sécurité est obligatoire avant la mise en production',
      'Les clients âgés doivent pouvoir continuer par téléphone',
      'Le système doit conserver un historique des documents pendant dix ans',
      'La période fiscale interdit tout changement de mars à mai',
      'Le budget est validé par un comité trimestriel',
    ],
  },
];

export const GENERIC_FAMILY = {
  id: 'generique',
  situations: [
    {
      org: 'Groupe Horizon',
      subject: 'centralisation des données',
      clientName: 'Mme Salma Trabelsi',
      clientRole: 'Directrice générale',
      context: 'L\'organisation gère ses activités avec des fichiers Excel partagés par email. Les erreurs de saisie se multiplient et les équipes passent leurs réunions à se disputer sur les chiffres.',
      expressedNeed: 'je veux une application pour remplacer nos fichiers Excel',
      hiddenNeed: 'Mettre fin aux conflits entre équipes causés par des données contradictoires : une source unique de vérité avec l\'historique des modifications.',
    },
    {
      org: 'Coopérative Al Amal',
      subject: 'suivi des adhérents',
      clientName: 'M. Sami Dridi',
      clientRole: 'Président',
      context: 'La coopérative compte 300 adhérents. Les cotisations sont suivies sur papier par un bénévole. Plusieurs adhérents contestent les montants réclamés et l\'assemblée générale approche.',
      expressedNeed: 'je voudrais un site internet pour la coopérative',
      hiddenNeed: 'Rendre la gestion des cotisations transparente et vérifiable par chaque adhérent, pour désamorcer les contestations avant l\'assemblée générale.',
    },
  ],
  constraints: [
    'Les utilisateurs principaux sont peu à l\'aise avec l\'informatique',
    'Aucune licence payante supplémentaire n\'est acceptée',
    'Le projet doit être livré avant la fin du trimestre',
    'Les données existantes doivent être reprises sans ressaisie',
    'Plusieurs personnes doivent pouvoir travailler en même temps',
    'L\'outil doit fonctionner sur téléphone et sur ordinateur',
  ],
};

/** Style du client selon le profil de personnalité. */
export const PROFILE_STYLES = {
  COOPERATIVE: {
    traits: ['bienveillant', 'ouvert', 'peu technique'],
    communicationStyle: 'Répond volontiers mais reste en surface',
    mood: 'confiant',
    phrase: (need) => `Bonjour ! En fait, ${need}. Je pense que ce sera assez simple pour vous.`,
  },
  RUSHED: {
    traits: ['pressé', 'direct', 'impatient'],
    communicationStyle: 'Phrases courtes, coupe court aux questions',
    mood: 'stressé',
    phrase: (need) => `Je n'ai pas beaucoup de temps : ${need}, et il me le faut vite.`,
  },
  SKEPTICAL: {
    traits: ['méfiant', 'exigeant', 'orienté résultats'],
    communicationStyle: 'Teste son interlocuteur et demande des garanties',
    mood: 'sceptique',
    phrase: (need) => `On a déjà été déçus par un prestataire. Cette fois, ${need}, mais je veux être sûr que ça marchera.`,
  },
  TALKATIVE: {
    traits: ['bavard', 'chaleureux', 'dispersé'],
    communicationStyle: 'Raconte des anecdotes, se perd dans les détails',
    mood: 'enthousiaste',
    phrase: (need) => `Alors, c'est toute une histoire… Pour faire court, ${need}, mais laissez-moi vous raconter comment tout a commencé.`,
  },
  CONTRADICTORY: {
    traits: ['changeant', 'exigeant', 'impulsif'],
    communicationStyle: 'Se contredit d\'une réponse à l\'autre',
    mood: 'agité',
    phrase: (need) => `Voilà : ${need}. Enfin, quelque chose de très simple… mais avec toutes les options, évidemment.`,
  },
  INDECISIVE: {
    traits: ['hésitant', 'prudent', 'peu sûr de lui'],
    communicationStyle: 'Hésite et renvoie les questions à l\'ingénieur',
    mood: 'inquiet',
    phrase: (need) => `Je ne sais pas trop… peut-être que ${need} ? Qu'est-ce que vous me conseillez ?`,
  },
};
