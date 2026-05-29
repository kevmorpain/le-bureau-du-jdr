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
    description: 'Vous pouvez lancer Fausse vie sur vous-même à volonté en tant que sort de niveau 1, sans dépenser d\'emplacement de sort ni de composantes matérielles.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Fausse vie', countPerLongRest: 0 } },
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
    name: 'Voleur des cinq destinées',
    description: 'Vous pouvez lancer Châtiment une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 1,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 1, spellcastingAbility: cha, spellName: 'Châtiment', countPerLongRest: 1 } },
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
    name: 'Voix du maître des Chaînes',
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
    name: 'Aspect de la Lune',
    description: 'Vous n\'avez plus besoin de dormir et ne pouvez pas être forcé à dormir par aucun moyen. Pour bénéficier d\'un repos long, vous pouvez passer ces 8 heures à exécuter des activités peu fatigantes, comme lire votre Livre des Ombres et monter la garde.',
    levelRequired: 5,
    prerequisites: { requiredPactBoon: 'tome' },
    effects: [
      { type: 'other', value: { kind: 'aspect_of_the_moon' } },
    ],
  },
  {
    name: 'Manteau de mouches',
    description: 'En action bonus, vous pouvez vous envelopper d\'un essaim de mouches spectrales jusqu\'au début de votre prochain tour. Le manteau dégage une odeur écœurante. Pendant la durée, vous avez l\'avantage aux tests de Charisme (Intimidation) mais le désavantage à tous les autres tests de Charisme. Toute créature autre que vous qui commence son tour à 1,50 mètre ou moins de vous subit des dégâts de poison égaux à votre modificateur de Charisme (minimum 0). Une fois utilisée, vous ne pouvez plus l\'utiliser avant la fin d\'un repos court ou long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'cloak_of_flies' } },
    ],
  },
  {
    name: 'Tombeau de Levistus',
    description: 'En réaction, lorsque vous subissez des dégâts, vous pouvez vous entourer d\'un tombeau de glace, qui fond à la fin de votre prochain tour. Vous gagnez 10 points de vie temporaires. Si des dégâts vous restent après ce gain, ils continuent à s\'appliquer normalement. Tant que les PV temporaires durent, vous êtes entravé et avez la vulnérabilité aux dégâts de feu. Une fois utilisée, vous ne pouvez plus l\'utiliser avant la fin d\'un repos court ou long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'tomb_of_levistus' } },
    ],
  },
  {
    name: 'Étreinte de Hadar',
    description: 'Quand vous touchez une créature avec Décharge occulte, vous pouvez la déplacer en ligne droite vers vous de 3 mètres. La cible doit être de taille G ou plus petite, et au-delà de 1,50 m de vous.',
    levelRequired: 5,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'other', value: { kind: 'eldritch_blast_grasp_of_hadar' } },
    ],
  },
  {
    name: 'Lance de léthargie',
    description: 'Quand vous touchez une créature avec Décharge occulte, vous pouvez réduire sa vitesse de 3 mètres jusqu\'à la fin de votre prochain tour.',
    levelRequired: 5,
    prerequisites: { requiredSpellName: 'Décharge occulte' },
    effects: [
      { type: 'other', value: { kind: 'eldritch_blast_lance_of_lethargy' } },
    ],
  },
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
    description: 'Vous pouvez utiliser une action pour devenir invisible tant que vous restez dans la pénombre ou l\'obscurité. Vous ne perdez pas cette invisibilité en attaquant ou lançant un sort.',
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
    description: 'Vous pouvez lancer Mauvais sort une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 5,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 3, spellcastingAbility: cha, spellName: 'Mauvais sort', countPerLongRest: 1 } },
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
  {
    name: 'Regard fantomatique',
    description: 'En action, vous gagnez la vision aveugle jusqu\'à 9 mètres pour 1 minute. Pendant cette durée, vous voyez à travers les objets solides comme s\'ils étaient transparents. Une fois utilisée, vous ne pouvez plus l\'utiliser avant la fin d\'un repos court ou long.',
    levelRequired: 7,
    prerequisites: null,
    effects: [
      { type: 'other', value: { kind: 'ghostly_gaze' } },
    ],
  },
  {
    name: 'Investiture du maître des chaînes',
    description: 'Quand vous lancez Appel de familier, votre familier gagne plusieurs bénéfices : il gagne un bonus à ses jets d\'attaque, sauvegardes et tests égal à votre bonus de maîtrise, ses attaques sont magiques pour vaincre les résistances. Quand il subit des dégâts, vous pouvez utiliser votre réaction pour leur donner la résistance jusqu\'à la fin de votre prochain tour. Tant que vous êtes sur le même plan d\'existence, vous pouvez communiquer télépathiquement avec lui.',
    levelRequired: 7,
    prerequisites: { requiredPactBoon: 'chain' },
    effects: [
      { type: 'other', value: { kind: 'investment_of_the_chain_master' } },
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
    description: 'Vous pouvez lancer Conjuration d\'élémentaire une fois en utilisant un emplacement de sort d\'occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d\'un repos long.',
    levelRequired: 9,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 5, spellcastingAbility: cha, spellName: 'Conjuration d\'élémentaire', countPerLongRest: 1 } },
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
    description: 'Vous pouvez lancer Œil d\'arcane à volonté, sans dépenser d\'emplacement de sort.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'spell_grant', value: { level: 4, spellcastingAbility: cha, spellName: 'Œil d\'arcane', countPerLongRest: 0 } },
    ],
  },
  {
    name: 'Vision de sorcier',
    description: 'Vous voyez la vraie forme de toute créature déguisée, métamorphosée ou transformée, dans un rayon de 9 mètres et tant qu\'elle se trouve dans votre champ de vision.',
    levelRequired: 15,
    prerequisites: null,
    effects: [
      { type: 'sight_modifier', value: { kind: 'true_sight_disguise' } },
    ],
  },
]
