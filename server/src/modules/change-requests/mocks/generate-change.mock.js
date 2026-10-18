// Réponses simulées du prompt generate-change v0.2 (variées selon la demande précédente et le niveau).
const SAMPLES = [
  {
    title: 'Ajouter un export PDF des rapports',
    description: "Le client souhaite pouvoir exporter chaque rapport mensuel en PDF pour l'envoyer à ses partenaires sans qu'ils aient à se connecter à l'application.",
    reason: "Notre conseil d'administration ne veut pas se connecter à un nouvel outil. Un rapport imprimable suffit pour les réunions de direction.",
    impact: { scope: 'Module de rapports et génération de documents', effort: 'MEDIUM', risk: 'Retard possible sur la livraison du lot 1' },
  },
  {
    title: 'Accès hors connexion sur tablette',
    description: "Les équipes de terrain doivent pouvoir saisir des données sans connexion internet et synchroniser quand elles reviennent au bureau.",
    reason: 'Nos dépôts sont situés dans des zones industrielles mal couvertes par le réseau mobile.',
    impact: { scope: 'Architecture client (PWA) et synchronisation des données', effort: 'HIGH', risk: 'Conflits de synchronisation et complexité de la résolution' },
  },
  {
    title: 'Notification par SMS pour les alertes critiques',
    description: "En plus des notifications par email, le client veut recevoir un SMS pour toute alerte dépassant le seuil critique, afin de réagir même sans accès à l'application.",
    reason: "J'ai raté une alerte critique le mois dernier parce que je ne consultais pas mes mails. Ça m'a coûté cher.",
    impact: { scope: 'Système de notifications et intégration SMS (Twilio ou équivalent)', effort: 'LOW', risk: 'Coût par SMS à facturer au client selon le volume' },
  },
];

export default function generateChangeMock({ variables }) {
  const previous = Array.isArray(variables.previousRequests)
    ? variables.previousRequests.length
    : typeof variables.previousRequests === 'string' && variables.previousRequests !== 'Aucune demande précédente.'
      ? variables.previousRequests.split('\n').length
      : 0;
  return SAMPLES[previous % SAMPLES.length];
}
