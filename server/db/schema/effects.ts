import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { DamageType } from '~~/shared/rules/damageTypes'
import type { SkillKey } from '~~/shared/rules/skills'
import type { ResourceKey } from '~~/shared/rules/classResources'
import type { SpeedBonusCondition } from '~~/shared/rules/speed'
import type { WeaponBonusScope } from '~~/shared/rules/effectBonuses'
import type { Formula } from '~~/shared/utils/formula'
import type { RechargeType } from './features'

export type AbilityScoreKey = AbilityKey

// 'draconic_ancestry' : dynamique, résolu par le choix de lignée du personnage.
export type DamageTypeKey = DamageType | 'draconic_ancestry'

export type ConditionKey
  = | 'blinded' | 'charmed' | 'deafened' | 'exhaustion' | 'frightened' | 'grappled'
    | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned'
    | 'prone' | 'restrained' | 'stunned' | 'unconscious'

// Ni un type de dégâts ni un état : « la magie ne peut pas vous endormir » ≠ immunité à l'état inconscient.
export type ImmunityKey = 'sleep_magic'

// 'draconic_ancestry' : résolu à l'affichage (espèce 2014) ; valeur concrète : fixée par la lignée.
type BreathWeaponAction = {
  type: 'breathe_weapon'
  countPerRest: number
  damage: {
    damageType: DamageTypeKey
    areaOfEffect: 'line' | 'cone' | 'draconic_ancestry'
    damageAtCharacterLevel: Record<string, string>
    savingThrowAbility: AbilityScoreKey | 'draconic_ancestry'
    saveDcBase: number
    saveDcModifiers: string[]
    halfOnSave: boolean
  }
}

type RevivalAction = {
  trigger: '0_hit_points'
  heal: number
  countPerLongRest: number
}

/** `from` absent ⇒ `'all'` : les lignes seedées avant son introduction restent valides. */
export type ChoiceFrom<K extends string> = K[] | 'all'

export const choiceOptions = <K extends string>(
  from: ChoiceFrom<K> | undefined,
  all: readonly K[],
): K[] => (from === undefined || from === 'all' ? [...all] : from)

export type Effect
  // `max` : plafond propre à la source (Pierre de Ioun : « pour un total maximum de 20 ») ; absent → le
  // maximum du personnage (20 + `ability_max_increase`). Règle appliquée par `shared/rules/abilityScores`.
  = | { type: 'ability_increase', value: { ability: AbilityScoreKey, amount: number, max?: number } }
    | { type: 'ability_increase_choice', value: { count: number, amount: number, abilities?: AbilityScoreKey[] } }
    | { type: 'ability_max_increase', value: { ability: AbilityScoreKey, amount: number } }
    // Objet qui FIXE le score (Gantelets de puissance d'ogre : 19), sans effet sur un score déjà supérieur.
    | { type: 'ability_score_set', value: { ability: AbilityScoreKey, score: number } }
    | { type: 'asi_or_feat', value: Record<string, never> }
    | { type: 'action', value: BreathWeaponAction | RevivalAction }
    // Sans `condition` : joue à tout jet visé (Rage, Instinct sauvage). Avec : seulement quand le joueur désigne la
    // situation au jet (`shared/rules/rolls.ts`) — contre Effrayé, Poison, Magie…
    // `unless` : ne joue pas tant qu'un de ces états est actif (Sens du danger : ni aveuglé, ni assourdi, ni incapable
    // d'agir). `scope` : attaque de mêlée menée avec la Force (Attaque téméraire).
    | { type: 'advantage', value: { rollType: 'check' | 'saving_throw' | 'attack' | 'initiative', ability: AbilityScoreKey | 'all', condition: string, unless?: ConditionKey[], scope?: 'strength_melee' } }
    | { type: 'choice', value: string }
    | { type: 'damage_resistance', value: { damageType: DamageTypeKey } }
    | { type: 'darkvision', value: { range: number } }
    | { type: 'equipment_penalty', value: { penalty: string, armor_type: string, modifier: string, override: boolean } }
    | { type: 'extra_damage', value: { trigger: string, attackType: string, extraDie: number } }
    | { type: 'damage_immunity', value: { damageType: DamageTypeKey } }
    | { type: 'condition_immunity', value: { condition: ConditionKey } }
    | { type: 'immunity', value: ImmunityKey }
    | { type: 'language_proficiency', value: string }
    | { type: 'language_proficiency_choice', value: { count: number } }
    | { type: 'other', value: Record<string, unknown> }
    | { type: 'proficiency', value: string }
    | { type: 'reroll', value: { rollType: 'd20', trigger: number } }
    // Moitié du bonus de maîtrise aux jets de caractéristique qui n'y ajoutent pas déjà la maîtrise (Touche-à-tout :
    // arrondi inférieur ; Athlète accompli : arrondi supérieur, Force / Dextérité / Constitution).
    | { type: 'half_proficiency', value: { abilities: AbilityScoreKey[] | 'all', rounding: 'down' | 'up' } }
    // Un résultat de d20 inférieur compte pour `minimum` aux jets de compétence maîtrisée (Savoir-faire).
    | { type: 'proficient_check_minimum', value: { minimum: number } }
    // Les attaques d'arme sont des coups critiques dès `from` sur le d20 (Critique amélioré : 19, supérieur : 18).
    | { type: 'critical_range', value: { from: number } }
    // Dés de l'arme ajoutés aux dégâts supplémentaires d'un critique au corps à corps (Critique brutal).
    | { type: 'critical_extra_dice', value: { dice: Formula } }
    // Réaction qui réduit de moitié les dégâts d'une attaque qui vous touche (Esquive instinctive).
    | { type: 'halve_damage_reaction', value: Record<string, never> }
    // Accordée telle quelle (JS de classe) ou « au choix » tant que la caractéristique n'est pas décidée.
    | { type: 'saving_throw_proficiency', value: { ability: AbilityScoreKey } }
    | { type: 'saving_throw_proficiency_choice', value: { count: number, from?: ChoiceFrom<AbilityScoreKey> } }
    | { type: 'skill_bonus', value: { skill: string, bonusType: string, multiplier: number, condition: string } }
    | { type: 'skill_proficiency', value: { skill: SkillKey } }
    | { type: 'spell_grant', value: { level: number, spellcastingAbility: AbilityScoreKey, spellName: string, countPerLongRest: number, unlockLevel?: number } }
    // Sort de domaine / de serment / de cercle : toujours préparé, hors de la limite quotidienne ; `unlockLevel` =
    // niveau de classe ; `terrain` : seulement pour le personnage qui a choisi ce terrain (Cercle de la terre).
    | { type: 'always_prepared_spell', value: { spellName: string, unlockLevel: number, terrain?: string } }
    | { type: 'tool_proficiency', value: string }
    | { type: 'vulnerability', value: { damageType: DamageTypeKey } }
    | { type: 'walking_speed', value: number }
    | { type: 'flying_speed', value: number }
    | { type: 'weapon_proficiency', value: string }
    | { type: 'eldritch_blast_modifier', value: { kind: 'agonizing' | 'repelling' | 'range_extended' } }
    | { type: 'pact_weapon_modifier', value: { kind: 'extra_attack' | 'lifedrinker' } }
    // `great_weapon` / `protection` (relance de dés, réaction) ne sont pas des bonus statiques : rendus en texte.
    | { type: 'fighting_style_modifier', value: { kind: 'archery' | 'two_weapon' | 'defense' | 'dueling' | 'great_weapon' | 'protection' } }
    | { type: 'sight_modifier', value: { kind: 'magical_darkness_120' | 'invisible_in_dim_light' | 'true_sight_disguise' | 'read_all_writing' } }
    | { type: 'spell_save_dc_bonus', value: { amount: number } }
    | { type: 'spell_attack_bonus', value: { amount: number } }
    // Bonus fixe signé aux dégâts de chaque jet de dégâts d'un sort.
    | { type: 'spell_damage_bonus', value: { amount: number } }
    | { type: 'initiative_bonus', value: { amount: number } }
    | { type: 'hp_per_level', value: { amount: number } }
    // Bonus aux scores passifs (Observateur : +5 Perception passive + Investigation passive).
    | { type: 'passive_skill_bonus', value: { skill: 'perception' | 'investigation', amount: number } }
    // Bonus fixes signés (Anneau de protection : +1 CA et JS ; un malus s'écrit en négatif).
    | { type: 'armor_class_bonus', value: { amount: number } }
    | { type: 'saving_throw_bonus', value: { ability: AbilityScoreKey | 'all', amount: number } }
    // Bonus fixes signés aux jets d'attaque / de dégâts d'arme, hors `magicBonus` de l'arme (Bracelets d'archerie).
    | { type: 'weapon_attack_bonus', value: { amount: number, weapons: WeaponBonusScope } }
    | { type: 'weapon_damage_bonus', value: { amount: number, weapons: WeaponBonusScope } }
    // CA sans armure de corps : `base` + les modificateurs listés ; la meilleure source l'emporte (Défense sans
    // armure, Résistance draconique). `shield: false` : le bouclier la suspend (Moine).
    | { type: 'unarmored_defense', value: { base: number, abilities: AbilityScoreKey[], shield: boolean } }
    // Bonus de vitesse de marche (`walking_speed` est la vitesse de BASE, absolue). `while` le suspend selon l'armure portée.
    | { type: 'speed_bonus', value: { amount: Formula, while?: SpeedBonusCondition } }
    | { type: 'swimming_speed', value: number }
    | { type: 'climbing_speed', value: number }
    | { type: 'burrowing_speed', value: number }
    // Les `Formula` des effets ci-dessous s'évaluent au niveau de la classe qui porte la feature
    // (`shared/rules/classResources.ts`), jamais à celui de la classe principale.
    // Attaques par action Attaquer ; les sources ne se cumulent pas.
    | { type: 'extra_attack', value: { attacks: Formula } }
    // Dés de dégâts ajoutés à une attaque d'arme (Attaque sournoise, Châtiment divin amélioré).
    | { type: 'weapon_damage_dice', value: { name: string, dice: Formula, sides: number, damageType?: DamageType, weapons: 'melee' | 'finesse_or_ranged', limit: 'once_per_turn' | 'each_hit', condition?: string, needsAdvantage?: boolean } }
    // Bonus fixe aux dégâts d'une attaque d'arme de corps à corps menée avec la Force (Rage).
    | { type: 'melee_strength_damage_bonus', value: { amount: Formula } }
    // Taille du dé de la réserve (Inspiration bardique : d6 → d12).
    | { type: 'resource_die', value: { sides: Formula } }
    // À chaque repos du type indiqué, la réserve regagne `amount` points dépensés (ou tous).
    | { type: 'resource_regain', value: { resource: ResourceKey, amount: number | 'all', on: RechargeType } }
    // Dégâts bonus payés par un emplacement de sort (Châtiment divin) : `baseDice` pour un emplacement de
    // niveau 1, +1 dé par niveau au-delà, plafonné à `maxDice` ; `bonus` : dé supplémentaire contre une cible donnée.
    | { type: 'slot_damage_dice', value: { name: string, sides: number, damageType: DamageType, baseDice: number, maxDice: number, bonus?: { when: string, dice: number, maxDice: number } } }
    // Forme sauvage : paliers de FP / restrictions par niveau de la classe, durée = niveau ÷ `hoursDivisor`.
    | { type: 'beast_shape', value: { tiers: { fromClassLevel: number, maxChallenge: number, flying: boolean, swimming: boolean }[], hoursDivisor: number } }
    // Remplace la colonne FP du tableau des paliers (Cercle de la lune) ; les autres restrictions demeurent.
    | { type: 'beast_shape_challenge', value: { maxChallenge: Formula } }

export type EffectType = Effect['type']
export type EffectValue = Effect['value']

export type ExtractEffect<T extends EffectType> = Extract<Effect, { type: T }>

const effects = sqliteTable('effects', {
  id: integer().primaryKey(),
  type: text('type').$type<EffectType>().notNull(),
  value: text('value', { mode: 'json' }).$type<EffectValue>().notNull(),
})

export default effects
