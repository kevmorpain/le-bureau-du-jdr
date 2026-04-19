import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── Shared primitive types ────────────────────────────────────────────────

export type AbilityScoreKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

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

// ─── Discriminated union ───────────────────────────────────────────────────

export type Effect
  = | { type: 'ability_increase', value: { ability: AbilityScoreKey, amount: number } }
    | { type: 'ability_increase_choice', value: { count: number, amount: number } }
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
    | { type: 'skill_bonus', value: { skill: string, bonusType: string, multiplier: number, condition: string } }
    | { type: 'skill_proficiency', value: { skill: string } }
    | { type: 'skill_proficiency_choice', value: { count: number } }
    | { type: 'spell_choice', value: { class: string, level: number, spellcastingAbility: AbilityScoreKey, count: number } }
    | { type: 'spell_grant', value: { level: number, spellcastingAbility: AbilityScoreKey, spellName: string, countPerLongRest: number, unlockLevel?: number } }
    | { type: 'tool_proficiency', value: string }
    | { type: 'tool_proficiency_choice', value: string[] }
    | { type: 'vulnerability', value: { damageType: DamageTypeKey } }
    | { type: 'walking_speed', value: number }
    | { type: 'weapon_proficiency', value: string }

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
