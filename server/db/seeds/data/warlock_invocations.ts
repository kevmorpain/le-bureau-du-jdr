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

// Noms et prérequis alignés sur AideDD (PHB 2014 pour les 32 manifestations de
// base ; les entrées XGtE/TCoE conservées sont signalées par un commentaire).
// `levelRequired: 1` = aucun prérequis de niveau d'occultiste.
export const warlockInvocations: InvocationDef[] = [
  // ─── Niveau 1 (pas de prérequis de niveau) ───────────────────────────────────
  {
    name: 'Armure d\'ombres',
    description: 'Vous pouvez lancer Armure de mage sur vous-même à volonté, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Armure de mage', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Langage animal',
    description: 'Vous pouvez lancer Communication avec les animaux à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Communication avec les animaux', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Présence captivante',
    description: 'Vous obtenez la maîtrise des compétences Tromperie et Persuasion.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'skill_proficiency', value: { skill: 'deception' } },
      { type: 'skill_proficiency', value: { skill: 'persuasion' } },
    ],
  },
  {
    name: 'Vision occulte',
    description: 'Vous pouvez lancer Détection de la magie à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Détection de la magie', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Lance occulte',
    description: 'Quand vous lancez Décharge occulte, sa portée passe à 90 mètres.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'eldritch_blast_modifier', value: { kind: 'range_extended' } },
    ],
  },
  {
    name: 'Oeil du gardien des runes',
    description: 'Vous pouvez lire toutes les écritures, quelle que soit la langue.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'read_all_writing' } },
    ],
  },
  {
    name: 'Vigueur fiélonne',
    description: 'Vous pouvez lancer Simulacre de vie sur vous-même à volonté en tant que sort de niveau 1, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Simulacre de vie', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Mille visages',
    description: 'Vous pouvez lancer Déguisement à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Déguisement', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Visions embrumées',
    description: 'Vous pouvez lancer Image silencieuse à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Image silencieuse', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Perception transférée',
    description: 'Par une action, vous touchez un humanoïde consentant et percevez ce qu\'il perçoit jusqu\'à la fin de votre prochain tour. Tant qu\'il reste sur votre plan d\'existence, vous pouvez dépenser une action à chacun de vos tours pour prolonger la connexion d\'autant. Pendant ce temps, vous bénéficiez de ses sens particuliers, mais vous êtes aveugle et sourd à ce qui vous entoure.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'gaze_of_two_minds' } },
    ],
  },
  {
    name: 'Voleur des cinq destinées',
    description: 'Vous pouvez lancer Fléau une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Fléau', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Décharge déchirante',
    description: 'Quand vous lancez Décharge occulte, vous ajoutez votre modificateur de Charisme aux dégâts qu\'il inflige à chaque coup au but.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'eldritch_blast_modifier', value: { kind: 'agonizing' } },
    ],
  },
  {
    name: 'Décharge répulsive',
    description: 'Quand vous touchez une créature avec Décharge occulte, vous pouvez la pousser de 3 mètres en ligne droite à l\'opposé de vous.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'eldritch_blast_modifier', value: { kind: 'repelling' } },
    ],
  },
  {
    name: 'Vision du diable',
    description: 'Vous voyez normalement dans les ténèbres, magiques ou non, jusqu\'à une distance de 36 mètres.',
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
    name: 'Voix du maître des Chaînes',
    description: 'Vous pouvez communiquer télépathiquement avec votre familier et percevoir ce qu\'il perçoit tant que vous êtes sur le même plan d\'existence. De plus, pendant que vous percevez par ses sens, vous pouvez aussi parler par sa bouche, si la créature est capable de parler.',
    levelRequired: 1,
    prerequisites: { requiredPactBoon: 'chain' },
    effects: [
      { type: 'other', value: { kind: 'voice_of_chain_master' } },
    ],
  },
  // Hors PHB — niveau 1
  {
    name: 'Esprit occulte', // TCoE
    description: 'Vous avez l\'avantage aux jets de sauvegarde de Constitution effectués pour maintenir votre concentration sur un sort.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'con', condition: 'concentration' } },
    ],
  },
  {
    name: 'Aspect de la lune', // XGtE
    description: 'Vous n\'avez plus besoin de dormir et ne pouvez pas être forcé à dormir par aucun moyen. Pour bénéficier d\'un repos long, vous pouvez passer ces 8 heures à exécuter des activités peu fatigantes, comme lire votre Livre des Ombres et monter la garde.',
    levelRequired: 1,
    prerequisites: { requiredPactBoon: 'tome' },
    effects: [
      { type: 'other', value: { kind: 'aspect_of_the_moon' } },
    ],
  },
  {
    name: 'Étreinte de Hadar', // XGtE
    description: 'Une fois à chacun de vos tours, quand vous touchez une créature avec Décharge occulte, vous pouvez la déplacer de 3 mètres en ligne droite dans votre direction.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'other', value: { kind: 'eldritch_blast_grasp_of_hadar' } },
    ],
  },
  {
    name: 'Lance de léthargie', // XGtE
    description: 'Une fois à chacun de vos tours, quand vous touchez une créature avec Décharge occulte, vous pouvez réduire sa vitesse de 3 mètres jusqu\'à la fin de votre prochain tour.',
    levelRequired: 1,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'other', value: { kind: 'eldritch_blast_lance_of_lethargy' } },
    ],
  },
  {
    name: 'Engagement du maître des Chaînes', // TCoE
    description: 'Quand vous lancez Appel de familier, votre familier gagne une vitesse de vol et de nage, ses attaques comptent comme magiques pour vaincre les résistances, et il peut effectuer l\'action Attaquer lorsque vous renoncez à l\'une des vôtres. Quand il subit des dégâts, vous pouvez utiliser votre réaction pour lui accorder la résistance à ces dégâts.',
    levelRequired: 1,
    prerequisites: { requiredPactBoon: 'chain' },
    effects: [
      { type: 'other', value: { kind: 'investment_of_the_chain_master' } },
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
    name: 'Maître des ombres',
    description: 'Quand vous vous trouvez dans une zone de pénombre ou d\'obscurité, vous pouvez utiliser une action pour devenir invisible. L\'invisibilité prend fin dès que vous vous déplacez ou que vous effectuez une action ou une réaction.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'invisible_in_dim_light' } },
    ],
  },
  {
    name: 'Lenteur de l\'esprit',
    description: 'Vous pouvez lancer Lenteur une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Lenteur', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Sombre présage',
    description: 'Vous pouvez lancer Malédiction une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Malédiction', countPerLongRest: 1 } },
    ],
  },
  // Hors PHB — niveau 5
  {
    name: 'Voile de mouches', // XGtE
    description: 'Par une action bonus, vous vous entourez d\'une aura magique évoquant un essaim de mouches bourdonnantes, qui s\'étend sur 1,50 mètre autour de vous et que tout abri total bloque. Elle dure jusqu\'à ce que vous soyez incapable d\'agir ou que vous y mettiez fin par une action bonus. Elle vous donne l\'avantage aux tests de Charisme (Intimidation) et le désavantage à vos autres tests de Charisme. Toute créature qui commence son tour dans l\'aura subit des dégâts de poison égaux à votre modificateur de Charisme (minimum 0). Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'cloak_of_flies' } },
    ],
  },
  {
    name: 'Tombe de Levistus', // XGtE
    description: 'Par une réaction, quand vous subissez des dégâts, vous pouvez vous enfermer dans un bloc de glace qui fond à la fin de votre prochain tour. Vous gagnez 10 points de vie temporaires par niveau d\'occultiste, puis vous encaissez les dégâts qui ont déclenché la réaction. Immédiatement après, vous gagnez la vulnérabilité aux dégâts de feu, votre vitesse tombe à 0 et vous êtes incapable d\'agir. Ces effets, ainsi que les points de vie temporaires restants, prennent fin quand la glace fond. Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'tomb_of_levistus' } },
    ],
  },
  // ─── Niveau 7 ────────────────────────────────────────────────────────────────
  {
    name: 'Murmures ensorcelants',
    description: 'Vous pouvez lancer Compulsion une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 7,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 4, spellcastingAbility: cha, spellName: 'Compulsion', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Mot d\'effroi',
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
  // Hors PHB — niveau 7
  {
    name: 'Regard fantomatique', // XGtE
    description: 'Par une action, vous pouvez voir à travers les objets solides jusqu\'à 9 mètres ; sur cette distance, vous disposez également de la vision dans le noir si vous ne l\'aviez pas déjà. Cette vue dure 1 minute ou jusqu\'à ce que votre concentration prenne fin, comme pour un sort. Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.',
    levelRequired: 7,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'ghostly_gaze' } },
    ],
  },
  // ─── Niveau 9 ────────────────────────────────────────────────────────────────
  {
    name: 'Pas aérien',
    description: 'Vous pouvez lancer Lévitation sur vous-même à volonté, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 2, spellcastingAbility: cha, spellName: 'Lévitation', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Sbires du chaos',
    description: 'Vous pouvez lancer Invocation d\'élémentaire une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 5, spellcastingAbility: cha, spellName: 'Invocation d\'élémentaire', countPerLongRest: 1 } },
    ],
  },
  {
    name: 'Saut d\'Outremonde',
    description: 'Vous pouvez lancer Saut sur vous-même à volonté, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Saut', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Murmures de la tombe',
    description: 'Vous pouvez lancer Communication avec les morts à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Communication avec les morts', countPerLongRest: 0 } },
    ],
  },
  // Hors PHB — niveau 9
  {
    name: 'Don des protecteurs', // TCoE
    description: 'Quand une créature visible dont le nom est inscrit dans votre Livre des Ombres tombe à 0 point de vie à 9 mètres ou moins de vous et n\'est pas tuée sur le coup, elle tombe à 1 point de vie à la place. Une fois utilisée, vous ne pouvez plus utiliser cette manifestation avant la fin de votre prochain repos long. Le nombre de noms inscrits dans le Livre est limité à votre modificateur de Charisme (minimum 1).',
    levelRequired: 9,
    prerequisites: { requiredPactBoon: 'tome' },
    effects: [
      { type: 'other', value: { kind: 'gift_of_protectors' } },
    ],
  },
  // ─── Niveau 12 ───────────────────────────────────────────────────────────────
  {
    name: 'Buveuse de vie',
    description: 'Quand vous touchez une créature avec votre arme de pacte, elle subit des dégâts nécrotiques supplémentaires égaux à votre modificateur de Charisme (minimum 1).',
    levelRequired: 12,
    prerequisites: { requiredPactBoon: 'blade' },
    effects: [
      { type: 'pact_weapon_modifier', value: { kind: 'lifedrinker' } },
    ],
  },
  // ─── Niveau 15 ───────────────────────────────────────────────────────────────
  {
    name: 'Chaînes des Carcères',
    description: 'Vous pouvez lancer Immobilisation de monstre à volonté sans dépenser d\'emplacement de sort, mais uniquement sur des créatures célestes, élémentaires ou fiélonnes. Vous ne pouvez pas relancer ce sort sur la même cible avant la fin d\'un repos long.',
    levelRequired: 15,
    prerequisites: { requiredPactBoon: 'chain' },
    effects: [
      { type: 'spell_grant', value: { level: 5, spellcastingAbility: cha, spellName: 'Immobilisation de monstre', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Maître des formes',
    description: 'Vous pouvez lancer Modification d\'apparence à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 2, spellcastingAbility: cha, spellName: 'Modification d\'apparence', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Royaumes lointains',
    description: 'Vous pouvez lancer Oeil magique à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 4, spellcastingAbility: cha, spellName: 'Oeil magique', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Vision de sorcier',
    description: 'Vous discernez la forme véritable de tout métamorphe et de toute créature dissimulée par une magie d\'illusion ou de transmutation, si elle se trouve dans un rayon de 9 mètres et dans votre ligne de mire.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'true_sight_disguise' } },
    ],
  },
]
