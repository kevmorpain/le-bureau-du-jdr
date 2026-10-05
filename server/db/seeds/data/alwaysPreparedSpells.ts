import type { Effect } from '../../schema/effects'

// Sorts de domaine du Clerc et de serment du Paladin (tableaux « sorts de domaine » et « sorts de
// serment » de chaque sous-classe) : toujours préparés, ils ne comptent pas dans la limite quotidienne.
// Clé = niveau DE CLASSE auquel le sort est acquis.
export type AlwaysPreparedTable = Record<number, readonly [string, string]>

export const CLERIC_DOMAIN_SPELLS: Record<string, AlwaysPreparedTable> = {
  'Domaine de la vie': {
    1: ['Bénédiction', 'Soins'],
    3: ['Arme spirituelle', 'Restauration partielle'],
    5: ['Lueur d\'espoir', 'Retour à la vie'],
    7: ['Gardien de la foi', 'Protection contre la mort'],
    9: ['Rappel à la vie', 'Soins de groupe'],
  },
  'Domaine de la lumière': {
    1: ['Lueurs féeriques', 'Mains brûlantes'],
    3: ['Rayon ardent', 'Sphère de feu'],
    5: ['Boule de feu', 'Lumière du jour'],
    7: ['Gardien de la foi', 'Mur de feu'],
    9: ['Colonne de flamme', 'Scrutation'],
  },
  'Domaine de la guerre': {
    1: ['Bouclier de la foi', 'Faveur divine'],
    3: ['Arme magique', 'Arme spirituelle'],
    5: ['Aura du croisé', 'Esprits gardiens'],
    7: ['Liberté de mouvement', 'Peau de pierre'],
    9: ['Colonne de flamme', 'Immobilisation de monstre'],
  },
  'Domaine de la tempête': {
    1: ['Nappe de brouillard', 'Vague tonnante'],
    3: ['Bourrasque', 'Fracassement'],
    5: ['Appel de la foudre', 'Tempête de neige'],
    7: ['Contrôle de l\'eau', 'Tempête de grêle'],
    9: ['Fléau d\'insectes', 'Vague destructrice'],
  },
  'Domaine de la nature': {
    1: ['Amitié avec les animaux', 'Communication avec les animaux'],
    3: ['Croissance d\'épines', 'Peau d\'écorce'],
    5: ['Croissance végétale', 'Mur de vent'],
    7: ['Domination de bête', 'Liane avide'],
    9: ['Fléau d\'insectes', 'Passage par les arbres'],
  },
  'Domaine de la duperie': {
    1: ['Charme-personne', 'Déguisement'],
    3: ['Image miroir', 'Passage sans trace'],
    5: ['Clignotement', 'Dissipation de la magie'],
    7: ['Métamorphose', 'Porte dimensionnelle'],
    9: ['Domination de personne', 'Modification de mémoire'],
  },
  'Domaine du savoir': {
    1: ['Identification', 'Injonction'],
    3: ['Augure', 'Suggestion'],
    5: ['Antidétection', 'Communication avec les morts'],
    7: ['Confusion', 'Œil magique'],
    9: ['Mythes et légendes', 'Scrutation'],
  },
}

export const PALADIN_OATH_SPELLS: Record<string, AlwaysPreparedTable> = {
  'Serment de dévotion': {
    3: ['Protection contre le mal et le bien', 'Sanctuaire'],
    5: ['Restauration partielle', 'Zone de vérité'],
    9: ['Dissipation de la magie', 'Lueur d\'espoir'],
    13: ['Gardien de la foi', 'Liberté de mouvement'],
    17: ['Colonne de flamme', 'Communion'],
  },
  'Serment des anciens': {
    3: ['Communication avec les animaux', 'Frappe piégeuse'],
    5: ['Foulée brumeuse', 'Rayon de lune'],
    9: ['Croissance végétale', 'Protection contre une énergie'],
    13: ['Peau de pierre', 'Tempête de grêle'],
    17: ['Communion avec la nature', 'Passage par les arbres'],
  },
  'Serment de vengeance': {
    3: ['Fléau', 'Marque du chasseur'],
    5: ['Foulée brumeuse', 'Immobilisation de personne'],
    9: ['Hâte', 'Protection contre une énergie'],
    13: ['Bannissement', 'Porte dimensionnelle'],
    17: ['Immobilisation de monstre', 'Scrutation'],
  },
}

// Cercle de la terre du Druide : les sorts dépendent du terrain choisi en rejoignant le
// cercle. Les clés du tableau sont les valeurs du choix `terrain`.
export const DRUID_CIRCLE_SPELLS = {
  Arctique: {
    3: ['Croissance d\'épines', 'Immobilisation de personne'],
    5: ['Lenteur', 'Tempête de neige'],
    7: ['Liberté de mouvement', 'Tempête de grêle'],
    9: ['Communion avec la nature', 'Cône de froid'],
  },
  Désert: {
    3: ['Flou', 'Silence'],
    5: ['Création de nourriture et d\'eau', 'Protection contre une énergie'],
    7: ['Flétrissement', 'Terrain hallucinatoire'],
    9: ['Fléau d\'insectes', 'Mur de pierre'],
  },
  Forêt: {
    3: ['Pattes d\'araignée', 'Peau d\'écorce'],
    5: ['Appel de la foudre', 'Croissance végétale'],
    7: ['Divination', 'Liberté de mouvement'],
    9: ['Communion avec la nature', 'Passage par les arbres'],
  },
  Littoral: {
    3: ['Foulée brumeuse', 'Image miroir'],
    5: ['Marche sur l\'eau', 'Respiration aquatique'],
    7: ['Contrôle de l\'eau', 'Liberté de mouvement'],
    9: ['Invocation d\'élémentaire', 'Scrutation'],
  },
  Marais: {
    3: ['Flèche acide de Melf', 'Ténèbres'],
    5: ['Marche sur l\'eau', 'Nuage nauséabond'],
    7: ['Liberté de mouvement', 'Localisation de créature'],
    9: ['Fléau d\'insectes', 'Scrutation'],
  },
  Montagne: {
    3: ['Croissance d\'épines', 'Pattes d\'araignée'],
    5: ['Éclair', 'Fusion dans la pierre'],
    7: ['Façonnage de la pierre', 'Peau de pierre'],
    9: ['Mur de pierre', 'Passe-muraille'],
  },
  Outreterre: {
    3: ['Pattes d\'araignée', 'Toile d\'araignée'],
    5: ['Forme gazeuse', 'Nuage nauséabond'],
    7: ['Façonnage de la pierre', 'Invisibilité supérieure'],
    9: ['Brume mortelle', 'Fléau d\'insectes'],
  },
  Plaine: {
    3: ['Invisibilité', 'Passage sans trace'],
    5: ['Hâte', 'Lumière du jour'],
    7: ['Divination', 'Liberté de mouvement'],
    9: ['Fléau d\'insectes', 'Songe'],
  },
} as const satisfies Record<string, AlwaysPreparedTable>

export const DRUID_TERRAINS = Object.keys(DRUID_CIRCLE_SPELLS) as Array<keyof typeof DRUID_CIRCLE_SPELLS>

/** `terrain` : l'effet ne vaut que pour le personnage qui a choisi ce terrain. */
export function alwaysPreparedEffects(table: AlwaysPreparedTable, terrain?: string): Effect[] {
  return Object.entries(table).flatMap(([level, spells]) =>
    spells.map(spellName => ({
      type: 'always_prepared_spell',
      value: { spellName, unlockLevel: Number(level), ...(terrain ? { terrain } : {}) },
    }) satisfies Effect))
}

export const CIRCLE_CARRIER_NAME = 'Terrain du cercle'
export const CIRCLE_SPELLS_FEATURE_NAME = 'Sorts de cercle'

export function circleSpellsDescription(): string {
  const lines = DRUID_TERRAINS.map(terrain =>
    `- ${terrain} : ${Object.entries(DRUID_CIRCLE_SPELLS[terrain]).map(([level, spells]) => `niv ${level} ${spells.join(', ')}`).join(' ; ')}`)
  return `Votre connexion à la terre vous apporte des sorts supplémentaires selon le terrain que vous avez choisi en rejoignant le cercle (toujours préparés, ils ne comptent pas dans votre limite) :\n\n${lines.join('\n')}`
}

export function circleSpellEffects(): Effect[] {
  return DRUID_TERRAINS.flatMap(terrain => alwaysPreparedEffects(DRUID_CIRCLE_SPELLS[terrain], terrain))
}
