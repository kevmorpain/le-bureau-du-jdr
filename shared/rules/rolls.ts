import type { ConditionKey, Effect } from '~~/server/db/schema/effects'
import { conditionMechanics } from '~~/shared/utils/condition-effects'
import { conditionLabels, rollSituationLabels } from '~~/shared/utils/labels'
import type { AbilityKey } from './abilities'
import type { EffectSource } from './effectBonuses'

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface RollSource {
  label: string
  mode: 'advantage' | 'disadvantage'
}

export interface ResolvedMode {
  mode: RollMode
  advantage: string[]
  disadvantage: string[]
}

// AideDD, Caractéristiques : un avantage et un désavantage s'annulent, quel qu'en soit le nombre ; ils ne se cumulent pas.
export const resolveRollMode = (sources: readonly RollSource[]): ResolvedMode => {
  const advantage = sources.filter(s => s.mode === 'advantage').map(s => s.label)
  const disadvantage = sources.filter(s => s.mode === 'disadvantage').map(s => s.label)
  const mode: RollMode = advantage.length && !disadvantage.length
    ? 'advantage'
    : disadvantage.length && !advantage.length ? 'disadvantage' : 'normal'
  return { mode, advantage, disadvantage }
}

// Choix du joueur pour le prochain jet : `normal` écarte toutes les sources (peur dont la source est hors de vue…),
// `advantage` / `disadvantage` s'y ajoutent et s'annulent selon la règle.
export type RollOverride = 'auto' | RollMode

export const PLAYER_CHOICE_LABEL = 'Choix du joueur'

export const applyRollOverride = (sources: readonly RollSource[], override: RollOverride): RollSource[] => {
  if (override === 'auto') return [...sources]
  if (override === 'normal') return []
  return [...sources, { label: PLAYER_CHOICE_LABEL, mode: override }]
}

export type D20Kind
  = | { type: 'attack', weapon: boolean, extra?: RollSource[] }
    | { type: 'check', ability: AbilityKey, skill?: string }
    | { type: 'save', ability: AbilityKey, situations?: string[] }
    | { type: 'initiative' }

export interface RollFacts {
  conditions: readonly ConditionKey[]
  exhaustion: number
  armorNonProficient: boolean
  stealthArmor: boolean
}

// AideDD, Armures : sans maîtrise, désavantage aux jets de caractéristique, de sauvegarde et d'attaque basés sur la
// Force ou la Dextérité.
const armorPenaltyApplies = (kind: D20Kind): boolean => {
  switch (kind.type) {
    case 'attack': return kind.weapon
    case 'initiative': return true
    default: return kind.ability === 'str' || kind.ability === 'dex'
  }
}

const isCheck = (kind: D20Kind) => kind.type === 'check' || kind.type === 'initiative'

// Sources fixes d'un jet : états, épuisement (AideDD, États), armure. Les sources propres à l'arme (`extra`) et
// aux effets de capacités s'y ajoutent ailleurs.
export const factRollSources = (kind: D20Kind, facts: RollFacts): RollSource[] => {
  const sources: RollSource[] = []
  const add = (label: string, mode: RollSource['mode'] = 'disadvantage') => sources.push({ label, mode })

  for (const condition of facts.conditions) {
    const m = conditionMechanics[condition]
    const label = conditionLabels[condition]
    if (kind.type === 'attack') {
      if (m?.attackDisadvantage) add(label)
      if (m?.attackAdvantage) add(label, 'advantage')
    }
    if (isCheck(kind) && m?.skillDisadvantage) add(label)
    if (kind.type === 'save' && m?.saveDisadvantage?.includes(kind.ability)) add(label)
  }

  if (isCheck(kind) && facts.exhaustion >= 1) add('Épuisement niv. 1+')
  if ((kind.type === 'attack' || kind.type === 'save') && facts.exhaustion >= 3) add('Épuisement niv. 3+')

  if (facts.armorNonProficient && armorPenaltyApplies(kind)) add('Armure non maîtrisée')
  if (facts.stealthArmor && kind.type === 'check' && kind.skill === 'stealth') add('Armure : désavantage en Discrétion')

  if (kind.type === 'attack') sources.push(...(kind.extra ?? []))
  return sources
}

// AideDD, États : Étourdi, Paralysé, Inconscient et Pétrifié ratent automatiquement les sauvegardes de Force et de Dextérité.
export const saveAutoFailSources = (kind: D20Kind, conditions: readonly ConditionKey[]): string[] =>
  kind.type === 'save'
    ? conditions.filter(c => conditionMechanics[c]?.saveAutoFail?.includes(kind.ability)).map(c => conditionLabels[c])
    : []

export const situationLabel = (situation: string): string =>
  rollSituationLabels[situation] ?? conditionLabels[situation as ConditionKey] ?? situation

type AdvantageValue = Extract<Effect, { type: 'advantage' }>['value']

// Un effet d'avantage sans `condition` joue tout le temps (Rage, Instinct sauvage) ; avec une `condition`, seulement
// quand le joueur indique la situation (contre Effrayé, Poison, Magie…) : l'application ne connaît pas la source du jet.
const advantageReaches = (value: AdvantageValue, kind: D20Kind): boolean => {
  if (kind.type === 'attack') return value.rollType === 'attack'
  if (kind.type === 'initiative') return value.rollType === 'initiative' || (value.rollType === 'check' && (value.ability === 'all' || value.ability === 'dex'))
  const rollType = kind.type === 'check' ? 'check' : 'saving_throw'
  return value.rollType === rollType && (value.ability === 'all' || value.ability === kind.ability)
}

export const advantageEffectSources = (
  sources: readonly EffectSource[],
  kind: D20Kind,
  situations: readonly string[],
): RollSource[] => {
  const active = new Set([...situations, ...(kind.type === 'save' ? kind.situations ?? [] : [])])
  return sources.flatMap(source => source.effects.flatMap((effect) => {
    if (effect.type !== 'advantage' || !advantageReaches(effect.value, kind)) return []
    if (!effect.value.condition) return [{ label: source.label, mode: 'advantage' as const }]
    return active.has(effect.value.condition)
      ? [{ label: `${source.label} — contre ${situationLabel(effect.value.condition).toLowerCase()}`, mode: 'advantage' as const }]
      : []
  }))
}

// Situations que le joueur peut désigner : celles que ses effets d'avantage conditionnent.
export const availableSituations = (sources: readonly EffectSource[]): string[] =>
  [...new Set(sources.flatMap(s => s.effects.flatMap(e => (e.type === 'advantage' && e.value.condition ? [e.value.condition] : []))))]

// ─── Effets de capacités qui modifient le jet ────────────────────────────────

export const rerollTrigger = (effects: readonly Effect[]): number | null => {
  const triggers = effects.flatMap(e => (e.type === 'reroll' && e.value.rollType === 'd20' ? [e.value.trigger] : []))
  return triggers.length ? Math.max(...triggers) : null
}

export const proficientCheckMinimum = (effects: readonly Effect[]): number | null => {
  const minimums = effects.flatMap(e => (e.type === 'proficient_check_minimum' ? [e.value.minimum] : []))
  return minimums.length ? Math.max(...minimums) : null
}

export const DEFAULT_CRITICAL_FROM = 20

export const criticalFrom = (effects: readonly Effect[]): number =>
  Math.min(DEFAULT_CRITICAL_FROM, ...effects.flatMap(e => (e.type === 'critical_range' ? [e.value.from] : [])))

// AideDD, Touche-à-tout (arrondi inférieur) et Athlète accompli (arrondi supérieur) ne se cumulent pas : le bonus de
// maîtrise « ne peut s'appliquer plus d'une fois à un même jet ».
export const halfProficiencyBonus = (effects: readonly Effect[], ability: AbilityKey, proficiencyBonus: number): number =>
  Math.max(0, ...effects.flatMap((e) => {
    if (e.type !== 'half_proficiency') return []
    if (e.value.abilities !== 'all' && !e.value.abilities.includes(ability)) return []
    return [e.value.rounding === 'up' ? Math.ceil(proficiencyBonus / 2) : Math.floor(proficiencyBonus / 2)]
  }))

// ─── Tirage du d20 ───────────────────────────────────────────────────────────

export interface D20Policy {
  sources: RollSource[]
  rerollOn: number | null
  minimum: number | null
  critFrom: number
}

export interface D20Result extends ResolvedMode {
  dice: number[]
  keptIndex: number
  kept: number
  used: number
  rerolled: { from: number, to: number } | null
  isCrit: boolean
  isFumble: boolean
}

const d20 = (rng: () => number) => Math.floor(rng() * 20) + 1

export const rollD20 = (policy: D20Policy, rng: () => number): D20Result => {
  const resolved = resolveRollMode(policy.sources)
  const dice = Array.from({ length: resolved.mode === 'normal' ? 1 : 2 }, () => d20(rng))

  // AideDD, Caractéristiques : avec avantage ou désavantage, la relance (Chanceux) ne vise qu'un seul des dés.
  let rerolled: D20Result['rerolled'] = null
  const index = policy.rerollOn === null ? -1 : dice.indexOf(policy.rerollOn)
  if (index !== -1) {
    rerolled = { from: dice[index]!, to: d20(rng) }
    dice[index] = rerolled.to
  }

  const counted = (die: number) => (policy.minimum === null ? die : Math.max(die, policy.minimum))
  const pick = resolved.mode === 'disadvantage' ? Math.min : Math.max
  const used = pick(...dice.map(counted))
  const keptIndex = dice.findIndex(die => counted(die) === used)
  const kept = dice[keptIndex]!

  return {
    ...resolved,
    dice,
    keptIndex,
    kept,
    used,
    rerolled,
    isCrit: kept >= policy.critFrom,
    isFumble: used === 1,
  }
}

// ─── Dégâts d'un coup critique ───────────────────────────────────────────────

// AideDD, Coups critiques : on lance deux fois tous les dés de dégâts (dés d'Attaque sournoise compris), jamais les
// modificateurs. Critique brutal ajoute des dés DE L'ARME aux dégâts supplémentaires du critique.
export const criticalDamageDiceCount = (count: number, options: { weaponDie?: boolean, extraWeaponDice?: number } = {}): number =>
  count * 2 + (options.weaponDie ? options.extraWeaponDice ?? 0 : 0)
