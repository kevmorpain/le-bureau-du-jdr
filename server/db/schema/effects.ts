import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { SkillKey } from '~~/shared/rules/skills'

// ─── Shared primitive types ────────────────────────────────────────────────

// Alias vers la source canonique (cf. shared/rules/abilities.ts, decisions.md D6) —
// plus d'union de caractéristiques recopiée à la main (architecture-audit.md §6).
export type AbilityScoreKey = AbilityKey

export type DamageTypeKey
  = | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning'
    | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant' | 'slashing' | 'thunder'
    | 'draconic_ancestry' // dynamic — resolved by the character's ancestry choice

export type ConditionKey
  = | 'blinded' | 'charmed' | 'deafened' | 'exhaustion' | 'frightened' | 'grappled'
    | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned'
    | 'prone' | 'restrained' | 'stunned' | 'unconscious'

// ─── Action sub-types ──────────────────────────────────────────────────────

type BreathWeaponAction = {
  type: 'breathe_weapon'
  countPerRest: number
  damage: {
    damageType: 'draconic_ancestry'
    areaOfEffect: 'draconic_ancestry'
    damageAtCharacterLevel: Record<string, string>
    savingThrowAbility: 'draconic_ancestry'
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

// ─── Choix ─────────────────────────────────────────────────────────────────

/**
 * Ensemble dans lequel un effet « au choix » puise ses options : une liste
 * explicite, ou `'all'` pour tout l'ensemble canonique (`SKILL_KEYS`,
 * `ABILITY_KEYS`…). Même vocabulaire que `OptionSource` de `progression`
 * (cf. rules-engine.md §4), qui prendra le relais à terme.
 *
 * `from` est **optionnel** sur les effets : les lignes seedées avant son
 * introduction (ex. Humain « Polyvalence » : `{ count: 2 }`) restent valides et
 * s'entendent comme `'all'` — cf. `choiceOptions()` et decisions.md D9/D13.
 */
export type ChoiceFrom<K extends string> = K[] | 'all'

/** Résout un `from` d'effet en liste d'options ; absent ⇒ tout l'ensemble. */
export const choiceOptions = <K extends string>(
  from: ChoiceFrom<K> | undefined,
  all: readonly K[],
): K[] => (from === undefined || from === 'all' ? [...all] : from)

// ─── Discriminated union ───────────────────────────────────────────────────

export type Effect
  = | { type: 'ability_increase', value: { ability: AbilityScoreKey, amount: number } }
    | { type: 'ability_increase_choice', value: { count: number, amount: number, abilities?: AbilityScoreKey[] } }
    | { type: 'asi_or_feat', value: Record<string, never> }
    | { type: 'action', value: BreathWeaponAction | RevivalAction }
    | { type: 'advantage', value: { rollType: 'check' | 'saving_throw', ability: AbilityScoreKey | 'all', condition: string } }
    | { type: 'choice', value: string }
    | { type: 'damage_resistance', value: { damageType: DamageTypeKey } }
    | { type: 'darkvision', value: { range: number } }
    | { type: 'equipment_penalty', value: { penalty: string, armor_type: string, modifier: string, override: boolean } }
    | { type: 'extra_damage', value: { trigger: string, attackType: string, extraDie: number } }
    | { type: 'damage_immunity', value: { damageType: DamageTypeKey } }
    | { type: 'condition_immunity', value: { condition: ConditionKey } }
    | { type: 'language_proficiency', value: string }
    | { type: 'language_proficiency_choice', value: { count: number } }
    | { type: 'other', value: Record<string, unknown> }
    | { type: 'proficiency', value: string }
    | { type: 'reroll', value: { rollType: 'd20', trigger: number } }
    // Maîtrise de jets de sauvegarde. Accordée telle quelle (JS de classe, don
    // Résilient une fois la caractéristique choisie) ou laissée « au choix » tant
    // que la décision n'est pas prise. Consommée par useCharacterAbilities, qui la
    // projette sur la convention de maîtrise `<carac>_save` (cf. `savingThrows`).
    | { type: 'saving_throw_proficiency', value: { ability: AbilityScoreKey } }
    | { type: 'saving_throw_proficiency_choice', value: { count: number, from?: ChoiceFrom<AbilityScoreKey> } }
    | { type: 'skill_bonus', value: { skill: string, bonusType: string, multiplier: number, condition: string } }
    | { type: 'skill_proficiency', value: { skill: SkillKey } }
    | { type: 'skill_proficiency_choice', value: { count: number, from?: ChoiceFrom<SkillKey> } }
    | { type: 'spell_choice', value: { class: string, level: number, spellcastingAbility: AbilityScoreKey, count: number } }
    | { type: 'spell_grant', value: { level: number, spellcastingAbility: AbilityScoreKey, spellName: string, countPerLongRest: number, unlockLevel?: number } }
    | { type: 'tool_proficiency', value: string }
    | { type: 'tool_proficiency_choice', value: string[] }
    | { type: 'vulnerability', value: { damageType: DamageTypeKey } }
    | { type: 'walking_speed', value: number }
    | { type: 'weapon_proficiency', value: string }
    | { type: 'eldritch_blast_modifier', value: { kind: 'agonizing' | 'repelling' | 'range_extended' } }
    | { type: 'pact_weapon_modifier', value: { kind: 'extra_attack' | 'lifedrinker' } }
    | { type: 'sight_modifier', value: { kind: 'magical_darkness_120' | 'invisible_in_dim_light' | 'true_sight_disguise' | 'read_all_writing' } }
    | { type: 'spell_save_dc_bonus', value: { amount: number } }
    | { type: 'spell_attack_bonus', value: { amount: number } }
    // Dons — bonus fixes appliqués automatiquement par useCharacterSheet.
    | { type: 'initiative_bonus', value: { amount: number } }
    | { type: 'hp_per_level', value: { amount: number } }
    // Bonus aux scores passifs (Observateur : +5 Perception passive + Investigation passive).
    | { type: 'passive_skill_bonus', value: { skill: 'perception' | 'investigation', amount: number } }

export type EffectType = Effect['type']
export type EffectValue = Effect['value']

// ─── Helper to narrow an effect by type ───────────────────────────────────

export type ExtractEffect<T extends EffectType> = Extract<Effect, { type: T }>

// ─── Drizzle table ─────────────────────────────────────────────────────────

const effects = sqliteTable('effects', {
  id: integer().primaryKey(),
  type: text('type').$type<EffectType>().notNull(),
  value: text('value', { mode: 'json' }).$type<EffectValue>().notNull(),
})

export default effects
