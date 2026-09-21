// Catalogue canonique des maîtrises d'OUTILS (PHB 2014, noms FR AideDD). Source unique partagée
// front/serveur : picker « Ajouter un outil » (ProficienciesSection), don Doué (3 maîtrises au choix),
// et validation serveur. Les maîtrises sont des chaînes d'affichage (pas de clé machine, comme les
// outils d'historique).

export const TOOL_CATEGORIES: Record<string, string[]> = {
  'Outils d\'artisan': [
    'Outils de forgeron', 'Outils de charpentier', 'Outils de cordonnier', 'Ustensiles de cuisinier',
    'Outils de bijoutier', 'Outils de maçon', 'Matériel de peintre', 'Outils de potier',
    'Outils de tanneur', 'Outils de tisserand', 'Outils de souffleur de verre', 'Matériel d\'alchimiste',
    'Matériel de brasseur', 'Matériel de calligraphe', 'Outils de cartographe', 'Outils de bricoleur',
    'Outils de menuisier',
  ],
  'Instruments de musique': [
    'Cornemuse', 'Cor', 'Flûte', 'Luth', 'Lyre', 'Tambour', 'Viole', 'Chalemie', 'Flûte de pan', 'Tympanon',
  ],
  'Jeux': [
    'Jeu de dés', 'Jeu de cartes', 'Jeu d\'échecs draconiques', 'Jeu des Dragons',
  ],
  'Outils spéciaux': [
    'Outils de voleur', 'Kit de déguisement', 'Kit d\'empoisonneur', 'Kit de contrefaçon',
    'Kit d\'herboriste', 'Outils de navigateur', 'Véhicules (terrestres)', 'Véhicules (maritimes)',
  ],
}

export const ALL_TOOLS: string[] = Object.values(TOOL_CATEGORIES).flat()

// Don Doué (« Skilled ») : 3 maîtrises au choix, compétences ou outils dans n'importe quelle combinaison.
export const SKILLED_FEAT_COUNT = 3
