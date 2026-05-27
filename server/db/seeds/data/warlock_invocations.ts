import type { Effect } from '../../schema/effects'
import type { FeaturePrerequisite } from '../../schema/features'

export type InvocationDef = {
  name: string
  description: string
  levelRequired: number
  prerequisites: FeaturePrerequisite | null
  effects: Effect[]
}

const cha = 'cha' as const

export const warlockInvocations: InvocationDef[] = [
  // ─── Niveau 1 (pas de prérequis de niveau) ───────────────────────────────────
  {
    name: 'Armure des ombres',
    description: 'Vous pouvez lancer Armure de mage sur vous-même à volonté, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Armure de mage', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Bouche-à-oreille bestiale',
    description: 'Vous pouvez lancer Communication avec les animaux à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Communication avec les animaux', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Influence enjôleuse',
    description: 'Vous obtenez la maîtrise des compétences Tromperie et Persuasion.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'skill_proficiency', value: { skill: 'deception' } },
      { type: 'skill_proficiency', value: { skill: 'persuasion' } },
    ],
  },
  {
    name: 'Vue éldritique',
    description: 'Vous pouvez lancer Détection de la magie à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Détection de la magie', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Lance éldritique',
    description: 'Quand vous lancez Décharge occulte, sa portée passe à 90 mètres.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'eldritch_blast_modifier', value: { kind: 'range_extended' } },
    ],
  },
  {
    name: 'Yeux du gardien des runes',
    description: 'Vous pouvez lire toutes les écritures, quelle que soit la langue.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'read_all_writing' } },
    ],
  },
  {
    name: 'Vigueur fiélonne',
    description: 'Vous pouvez lancer Fausse vie sur vous-même à volonté en tant que sort de niveau 1, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Fausse vie', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Masque aux mille visages',
    description: 'Vous pouvez lancer Déguisement à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Déguisement', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Visions trompeuses',
    description: 'Vous pouvez lancer Image silencieuse à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Image silencieuse', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Voleur de cinq destins',
    description: 'Vous pouvez lancer Châtiment une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Châtiment', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Coup éldritique agonisant',
    description: 'Quand vous lancez Décharge occulte, vous ajoutez votre modificateur de Charisme aux dégâts qu\'il inflige à chaque coup au but.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'eldritch_blast_modifier', value: { kind: 'agonizing' } },
    ],
  },
  {
    name: 'Décharge repoussante',
    description: 'Quand vous touchez une créature avec Décharge occulte, vous pouvez la pousser de 3 mètres en ligne droite à l\'opposé de vous.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'eldritch_blast_modifier', value: { kind: 'repelling' } },
    ],
  },
  {
    name: 'Vue du Diable',
    description: 'Vous voyez normalement dans la pénombre et l\'obscurité, magique ou non, jusqu\'à une distance de 36 mètres.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'magical_darkness_120' } },
    ],
  },
  {
    name: 'Livre des secrets anciens',
    description: 'Vous pouvez inscrire des sorts rituels dans votre Livre des Ombres. Choisissez deux sorts de niveau 1 possédant l\'aspect rituel dans la liste de sorts de n\'importe quelle classe. Tant que vous avez le Livre des Ombres, vous pouvez lancer ces sorts en tant que rituels. Vous pouvez ajouter d\'autres sorts rituels que vous trouvez dans vos aventures (en y consacrant temps et or).',
    levelRequired: 1,
    prerequisites: { requiredPactBoon: 'tome' },
    effects: [
      { type: 'other', value: { kind: 'book_of_ancient_secrets' } },
    ],
  },
  {
    name: 'Voix du maître des chaînes',
    description: 'Vous pouvez communiquer télépathiquement avec votre familier et percevoir ce qu\'il perçoit tant que vous êtes sur le même plan d\'existence. De plus, pendant que vous percevez par ses sens, vous pouvez aussi parler par sa bouche, si la créature est capable de parler.',
    levelRequired: 1,
    prerequisites: { requiredPactBoon: 'chain' },
    effects: [
      { type: 'other', value: { kind: 'voice_of_chain_master' } },
    ],
  },
  // TCoE niveau 1
  {
    name: 'Esprit occulte',
    description: 'Vous avez l\'avantage aux jets de sauvegarde de Constitution effectués pour maintenir votre concentration sur un sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'con', condition: 'concentration' } },
    ],
  },
  {
    name: 'Don des protecteurs',
    description: 'Quand une créature visible dont le nom est inscrit dans votre Livre des Ombres tombe à 0 point de vie à 9 mètres ou moins de vous et n\'est pas tuée sur le coup, elle tombe à 1 point de vie à la place. Une fois utilisée, vous ne pouvez plus utiliser cette manifestation avant la fin de votre prochain repos long. Le nombre de noms inscrits dans le Livre est limité à votre modificateur de Charisme (minimum 1).',
    levelRequired: 1,
    prerequisites: { requiredPactBoon: 'tome' },
    effects: [
      { type: 'other', value: { kind: 'gift_of_protectors' } },
    ],
  },
  // ─── Niveau 5 ────────────────────────────────────────────────────────────────
  {
    name: 'Lame assoiffée',
    description: 'Vous pouvez attaquer deux fois, et non plus une seule, lorsque vous effectuez l\'action Attaquer à votre tour avec votre arme de pacte.',
    levelRequired: 5,
    prerequisites: { requiredPactBoon: 'blade' },
    effects: [
      { type: 'pact_weapon_modifier', value: { kind: 'extra_attack' } },
    ],
  },
  {
    name: 'Au gré des ombres',
    description: 'Vous pouvez utiliser une action pour devenir invisible tant que vous restez dans la pénombre ou l\'obscurité. Vous ne perdez pas cette invisibilité en attaquant ou lançant un sort.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'invisible_in_dim_light' } },
    ],
  },
  {
    name: 'Embourber l\'esprit',
    description: 'Vous pouvez lancer Lenteur une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Lenteur', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Signe de mauvais augure',
    description: 'Vous pouvez lancer Mauvais sort une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Mauvais sort', countPerLongRest: 1 } },
    ],
  },
  // ─── Niveau 7 ────────────────────────────────────────────────────────────────
  {
    name: 'Murmures destructeurs',
    description: 'Vous pouvez lancer Rire hideux de Tasha une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 7,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Rire hideux de Tasha', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Verbe redouté',
    description: 'Vous pouvez lancer Confusion une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 7,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 4, spellcastingAbility: cha, spellName: 'Confusion', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Sculpteur de chair',
    description: 'Vous pouvez lancer Métamorphose une fois en utilisant un emplacement de sort d\'occultiste, sans pouvoir vous prendre vous-même pour cible. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 7,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 4, spellcastingAbility: cha, spellName: 'Métamorphose', countPerLongRest: 1 } },
    ],
  },
  // ─── Niveau 9 ────────────────────────────────────────────────────────────────
  {
    name: 'Pas ascendant',
    description: 'Vous pouvez lancer Lévitation sur vous-même à volonté, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 2, spellcastingAbility: cha, spellName: 'Lévitation', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Sbires du chaos',
    description: 'Vous pouvez lancer Conjuration d\'élémentaire une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 5, spellcastingAbility: cha, spellName: 'Conjuration d\'élémentaire', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Saut surnaturel',
    description: 'Vous pouvez lancer Saut sur vous-même à volonté, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Saut', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Murmures d\'outre-tombe',
    description: 'Vous pouvez lancer Communication avec les morts à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Communication avec les morts', countPerLongRest: 0 } },
    ],
  },
  // ─── Niveau 12 ───────────────────────────────────────────────────────────────
  {
    name: 'Buveuse de vie',
    description: 'Quand vous touchez une créature avec votre arme de pacte, la créature subit 1d6 dégâts nécrotiques supplémentaires, plus des dégâts nécrotiques supplémentaires égaux à votre modificateur de Charisme.',
    levelRequired: 12,
    prerequisites: { requiredPactBoon: 'blade' },
    effects: [
      { type: 'pact_weapon_modifier', value: { kind: 'lifedrinker' } },
    ],
  },
  // ─── Niveau 15 ───────────────────────────────────────────────────────────────
  {
    name: 'Chaînes de Carceri',
    description: 'Vous pouvez lancer Immobilisation de monstre à volonté sans dépenser d\'emplacement de sort, mais uniquement sur des créatures célestes, élémentaires ou fiélonnes. Vous ne pouvez pas relancer ce sort sur la même cible avant la fin d\'un repos long.',
    levelRequired: 15,
    prerequisites: { requiredPactBoon: 'chain' },
    effects: [
      { type: 'spell_grant', value: { level: 5, spellcastingAbility: cha, spellName: 'Immobilisation de monstre', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Maître des formes multiples',
    description: 'Vous pouvez lancer Modification d\'apparence à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 2, spellcastingAbility: cha, spellName: 'Modification d\'apparence', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Visions de mondes lointains',
    description: 'Vous pouvez lancer Œil d\'arcane à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 4, spellcastingAbility: cha, spellName: 'Œil d\'arcane', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Vue de sorcière',
    description: 'Vous voyez la vraie forme de toute créature déguisée, métamorphosée ou transformée, dans un rayon de 9 mètres et tant qu\'elle se trouve dans votre champ de vision.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'true_sight_disguise' } },
    ],
  },
]
