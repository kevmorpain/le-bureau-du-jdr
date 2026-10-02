import type { Effect } from '../../schema/effects'

// Sorts de domaine du Clerc et de serment du Paladin (AideDD, tableaux « sorts de domaine » et « sorts de
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

export function alwaysPreparedEffects(table: AlwaysPreparedTable): Effect[] {
  return Object.entries(table).flatMap(([level, spells]) =>
    spells.map(spellName => ({ type: 'always_prepared_spell', value: { spellName, unlockLevel: Number(level) } }) satisfies Effect))
}
