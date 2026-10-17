// Réponse simulée du prompt generate-change.
const SAMPLES = [
  {
    title: 'Ajouter un export PDF des rapports',
    description: 'Le client souhaite pouvoir exporter chaque rapport en PDF pour les envoyer à ses partenaires.',
    reason: 'Notre conseil d\'administration ne veut pas se connecter à une nouvelle application.',
    impact: { scope: 'Module de rapports', effort: 'MEDIUM', risk: 'Retard de la livraison du lot 1' },
  },
  {
    title: 'Accès hors connexion sur tablette',
    description: 'Les équipes de terrain doivent pouvoir saisir des données sans connexion internet.',
    reason: 'Nos dépôts sont situés dans des zones mal couvertes par le réseau.',
    impact: { scope: 'Architecture client et synchronisation', effort: 'HIGH', risk: 'Conflits de synchronisation des données' },
  },
];

export default function generateChangeMock({ variables }) {
  const previous = Array.isArray(variables.previousRequests) ? variables.previousRequests.length : 0;
  return SAMPLES[previous % SAMPLES.length];
}
