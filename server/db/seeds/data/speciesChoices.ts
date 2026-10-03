import type { FeatureChoice } from '~~/shared/rules/choices'

// Points de choix des traits d'espèce 2014, partagés par les lignées et les anciennes espèces séparées (les
// tests d'équivalence D12 comparent les deux). Créés en base par la migration 0109.

export const oneLanguageChoice: FeatureChoice = { kind: 'language', count: 1, optionSource: { type: 'languages' } }

// Demi-elfe, Polyvalence.
export const twoSkillsChoice: FeatureChoice = { kind: 'skill', count: 2, optionSource: { type: 'skills', from: 'all' } }

// AideDD, Nain : « outils de forgeron, outils de brasseur ou outils de maçon » (noms du catalogue d'outils).
export const dwarfToolChoice: FeatureChoice = {
  kind: 'tool',
  count: 1,
  optionSource: { type: 'tools', from: ['Outils de forgeron', 'Matériel de brasseur', 'Outils de maçon'] },
}

// AideDD, UA « Peuples de la Féerie », Fadette, Magie des fées : l'Intelligence, la Sagesse ou le Charisme.
export const fairyCastingAbilityChoice: FeatureChoice = {
  kind: 'spellcasting_ability',
  count: 1,
  optionSource: { type: 'enum', values: ['int', 'wis', 'cha'] },
}

// Haut-elfe, Sort mineur : un sort mineur de la liste du magicien.
export const wizardCantripChoice: FeatureChoice = {
  kind: 'cantrip',
  count: 1,
  optionSource: { type: 'spells', spellClass: 'wizard', cantripsOnly: true },
}
