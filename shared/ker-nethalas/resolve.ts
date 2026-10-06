import { KN_BOUNDS, type KnExtraSkill, type KnResistances, type KnSkills } from './character'
import { KN_CONDITIONS } from './catalog/conditions'
import { knExhaustionSource } from './catalog/exhaustion'
import { knGrowingDarknessDef } from './catalog/growingDarkness'
import { knNoLightSource } from './catalog/light'
import { knMadnessSources } from './catalog/madness'
import { KN_ROT_EXHAUSTION_IMMUNITY_STAGE, KN_ROT_NO_LIGHT_STAGE, knRotSource } from './catalog/rot'
import {
  KN_VITAL_KEYS,
  expandKnTargets,
  type KnActiveSource,
  type KnCheckKey,
  type KnEffect,
  type KnReminder,
  type KnSourceLabel,
  type KnTarget,
  type KnVitalKey,
} from './effects'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS, type KnResistanceKey, type KnSkillKey } from './skills'
import { knCurrentDomain, type KnRun } from './run'
import type { KnStatus } from './status'

export interface KnResolveInput {
  skills: KnSkills
  extraSkills: KnExtraSkill[]
  resistances: KnResistances
  exhaustion: number
  maxVitals: Record<KnVitalKey, number>
  status: KnStatus
  run: KnRun
}

export interface KnSourceRef {
  id: string
  label: KnSourceLabel
}

export type KnRollMode = 'normal' | 'advantage' | 'disadvantage' | 'both'

export interface KnResolvedCheck {
  base: number
  effective: number
  modifiers: { source: KnSourceRef, amount: number }[]
  advantages: KnSourceRef[]
  disadvantages: KnSourceRef[]
  rollMode: KnRollMode
}

export interface KnResolvedVital {
  base: number
  effective: number
  steps: { source: KnSourceRef, kind: 'half' | 'delta', amount: number, result: number }[]
}

export interface KnResolvedReminder extends KnReminder {
  source: KnSourceRef
}

export interface KnResolvedSheet {
  skills: Record<KnSkillKey, KnResolvedCheck>
  extraSkills: KnResolvedCheck[]
  resistances: Record<KnResistanceKey, KnResolvedCheck>
  maxVitals: Record<KnVitalKey, KnResolvedVital>
  reminders: KnResolvedReminder[]
}

const sourceRef = ({ id, label }: KnActiveSource): KnSourceRef => ({ id, label })

export function collectKnSources(input: KnResolveInput): KnActiveSource[] {
  const { status, exhaustion, run } = input
  const domain = knCurrentDomain(run)
  const sources: KnActiveSource[] = []

  // Rot stade 7 : immunité aux effets de l'Épuisement (p. 87).
  if (status.rotStage < KN_ROT_EXHAUSTION_IMMUNITY_STAGE) {
    const exhaustionSource = knExhaustionSource(exhaustion)
    if (exhaustionSource) sources.push(exhaustionSource)
  }

  for (const entry of status.conditions) {
    const def = KN_CONDITIONS[entry.key]
    const value = entry.value ?? def.value?.default ?? 0
    sources.push({
      id: `condition:${entry.key}`,
      label: { key: `ker_nethalas.conditions.${entry.key}.name`, params: { value } },
      effects: def.effects(value),
      reminders: [{ label: { key: `ker_nethalas.conditions.${entry.key}.reminder`, params: { value } }, severity: 'info' }],
    })
  }

  if (run.lightRemaining <= 0 && status.rotStage < KN_ROT_NO_LIGHT_STAGE) sources.push(knNoLightSource())

  const rot = knRotSource(status.rotStage)
  if (rot) sources.push(rot)

  sources.push(...knMadnessSources(status.madness))

  domain.growingDarkness.forEach((entry, index) => {
    const def = knGrowingDarknessDef(entry.key)
    const label: KnSourceLabel = {
      key: `ker_nethalas.growing_darkness.${entry.key}`,
      params: {
        value: entry.value ?? 0,
        skill: entry.skill ? `ker_nethalas.skills.${entry.skill}` : 'ker_nethalas.reminders.noSkillChosen',
      },
    }
    sources.push({
      id: `growingDarkness:${entry.key}:${index}`,
      label,
      effects: def.effects?.(entry) ?? [],
      reminders: [{ label, severity: def.kind === 'immediate' ? 'warning' : 'info' }],
    })
  })

  if (domain.overseerInfluences.length) {
    sources.push({
      id: 'overseer',
      label: { key: 'ker_nethalas.sources.overseer' },
      effects: [],
      reminders: domain.overseerInfluences.map(key => ({
        label: { key: `ker_nethalas.overseer.${key}` },
        severity: 'info' as const,
      })),
    })
  }

  for (const custom of status.custom) {
    if (!custom.active) continue
    sources.push({
      id: `custom:${custom.id}`,
      label: { text: custom.name },
      effects: custom.entries.map((entry): KnEffect => {
        if (entry.kind === 'modifier') return { type: 'modifier', targets: [entry.target], amount: entry.amount }
        if (entry.kind === 'maxVital') return { type: 'maxVitalDelta', vital: entry.vital, amount: entry.amount }
        return { type: entry.kind, targets: [entry.target] }
      }),
      reminders: custom.note ? [{ label: { text: custom.note }, severity: 'info' }] : [],
    })
  }

  return sources
}

const rollModeOf = (advantages: KnSourceRef[], disadvantages: KnSourceRef[]): KnRollMode => {
  if (advantages.length && disadvantages.length) return 'both'
  if (advantages.length) return 'advantage'
  if (disadvantages.length) return 'disadvantage'
  return 'normal'
}

// Une compétence supplémentaire n'a pas de clé canonique : seuls les effets visant toutes les compétences l'atteignent.
const reachesExtraSkill = (targets: readonly KnTarget[]) => targets.includes('allSkills') || targets.includes('allChecks')

function resolveCheck(
  base: number,
  sources: KnActiveSource[],
  applies: (targets: readonly KnTarget[]) => boolean,
  cap: number | null,
): KnResolvedCheck {
  const modifiers: KnResolvedCheck['modifiers'] = []
  const advantages: KnSourceRef[] = []
  const disadvantages: KnSourceRef[] = []

  for (const source of sources) {
    for (const effect of source.effects) {
      if (effect.type === 'modifier' && applies(effect.targets)) {
        modifiers.push({ source: sourceRef(source), amount: effect.amount })
      } else if (effect.type === 'advantage' && applies(effect.targets)) {
        advantages.push(sourceRef(source))
      } else if (effect.type === 'disadvantage' && applies(effect.targets)) {
        disadvantages.push(sourceRef(source))
      }
    }
  }

  const total = base + modifiers.reduce((sum, m) => sum + m.amount, 0)
  const floored = Math.max(0, total)

  return {
    base,
    effective: cap === null ? floored : Math.min(cap, floored),
    modifiers,
    advantages,
    disadvantages,
    rollMode: rollModeOf(advantages, disadvantages),
  }
}

function resolveVital(base: number, vital: KnVitalKey, sources: KnActiveSource[]): KnResolvedVital {
  const steps: KnResolvedVital['steps'] = []
  let value = base

  // Les moitiés s'appliquent avant les retraits fixes (le livre ne tranche pas l'ordre).
  for (const source of sources) {
    for (const effect of source.effects) {
      if (effect.type === 'maxVitalHalf' && effect.vital === vital) {
        const halved = Math.ceil(value / 2)
        steps.push({ source: sourceRef(source), kind: 'half', amount: halved - value, result: halved })
        value = halved
      }
    }
  }

  for (const source of sources) {
    for (const effect of source.effects) {
      if (effect.type === 'maxVitalDelta' && effect.vital === vital) {
        value += effect.amount
        steps.push({ source: sourceRef(source), kind: 'delta', amount: effect.amount, result: value })
      }
    }
  }

  return { base, effective: Math.max(0, value), steps }
}

export function resolveKnSheet(input: KnResolveInput): KnResolvedSheet {
  const sources = collectKnSources(input)
  const appliesTo = (key: KnCheckKey) => (targets: readonly KnTarget[]) => expandKnTargets(targets).has(key)

  const skills = Object.fromEntries(
    KN_SKILL_KEYS.map(key => [key, resolveCheck(input.skills[key].score, sources, appliesTo(key), null)]),
  ) as Record<KnSkillKey, KnResolvedCheck>

  const resistances = Object.fromEntries(
    KN_RESISTANCE_KEYS.map(key => [
      key,
      resolveCheck(input.resistances[key], sources, appliesTo(key), KN_BOUNDS.resistance.max),
    ]),
  ) as Record<KnResistanceKey, KnResolvedCheck>

  const maxVitals = Object.fromEntries(
    KN_VITAL_KEYS.map(vital => [vital, resolveVital(input.maxVitals[vital], vital, sources)]),
  ) as Record<KnVitalKey, KnResolvedVital>

  return {
    skills,
    extraSkills: input.extraSkills.map(extra => resolveCheck(extra.score, sources, reachesExtraSkill, null)),
    resistances,
    maxVitals,
    reminders: sources.flatMap(source => source.reminders.map(reminder => ({ ...reminder, source: sourceRef(source) }))),
  }
}
