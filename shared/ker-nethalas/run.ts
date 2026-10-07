import { z } from 'zod'
import {
  KN_GROWING_DARKNESS,
  KN_GROWING_DARKNESS_KEYS,
  knGrowingDarknessDef,
  type KnGrowingDarknessKey,
} from './catalog/growingDarkness'
import { KN_OVERSEER_INFLUENCE_KEYS } from './catalog/overseerInfluence'
import { KN_SKILL_KEYS } from './skills'
import { boundedInt } from './zodHelpers'

// Dés d'usage : un jet de 1 ou 2 fait descendre d'un cran ; un 1-2 au D4 déclenche la procédure.
export const KN_USAGE_DICE = [20, 12, 10, 8, 6, 4] as const

export type KnUsageDie = (typeof KN_USAGE_DICE)[number]

export const KN_TENSION_START_DIE: KnUsageDie = 8
export const KN_LAIR_START_DIE: KnUsageDie = 10
export const KN_EXIT_START_DIE: KnUsageDie = 8
export const KN_LIGHT_ROOMS = 20
export const KN_OPTIONAL_LAIR_ROOMS = 15

export const KN_RUN_BOUNDS = {
  growingDarknessValue: { min: 0, max: 99 },
  rooms: { min: 0, max: 9999 },
  light: { min: 0, max: 99 },
  growingDarkness: 40,
  overseerInfluences: 40,
  domains: 30,
  visits: 200,
} as const

export const KN_VISIT_KINDS = ['room', 'corridor', 'revisit'] as const

const knSkill = z.enum(KN_SKILL_KEYS)

export const knUsageDieSchema = z.union([
  z.literal(20),
  z.literal(12),
  z.literal(10),
  z.literal(8),
  z.literal(6),
  z.literal(4),
])

export const knGrowingDarknessEntrySchema = z.object({
  key: z.enum(KN_GROWING_DARKNESS_KEYS as [KnGrowingDarknessKey, ...KnGrowingDarknessKey[]]),
  value: boundedInt(KN_RUN_BOUNDS.growingDarknessValue).optional(),
  skill: knSkill.optional(),
})

export const knGrowingDarknessDrawSchema = z.object({
  roll: boundedInt({ min: 1, max: 100 }),
  entry: knGrowingDarknessEntrySchema,
  // Un événement 81-100 fait aussi tirer une influence d'Overseer : D10, dans l'ordre de sa table.
  influence: z.object({
    roll: boundedInt({ min: 1, max: KN_OVERSEER_INFLUENCE_KEYS.length }),
    key: z.enum(KN_OVERSEER_INFLUENCE_KEYS),
  }).optional(),
})

// `die` est le dé avant le jet, `next` celui d'après ; `manual` : le résultat a été saisi (1 ou 3), pas tiré.
const knDieResultSchema = z.object({
  die: knUsageDieSchema,
  roll: boundedInt({ min: 1, max: 20 }),
  manual: z.boolean(),
  next: knUsageDieSchema,
  triggered: z.boolean(),
})

export const knVisitSchema = z.object({
  kind: z.enum(KN_VISIT_KINDS),
  usageKind: z.enum(['lair', 'exit']).nullable(),
  tension: knDieResultSchema.optional(),
  usage: knDieResultSchema.optional(),
  darkness: knGrowingDarknessDrawSchema.optional(),
})

export const knDomainSchema = z.object({
  name: z.string().trim().min(1).max(100),
  rooms: boundedInt(KN_RUN_BOUNDS.rooms),
  lairDie: knUsageDieSchema,
  lairFound: z.boolean(),
  exitDie: knUsageDieSchema,
  exitFound: z.boolean(),
  overseerInfluences: z.array(z.enum(KN_OVERSEER_INFLUENCE_KEYS)).max(KN_RUN_BOUNDS.overseerInfluences),
  growingDarkness: z.array(knGrowingDarknessEntrySchema).max(KN_RUN_BOUNDS.growingDarkness),
  visits: z.array(knVisitSchema).max(KN_RUN_BOUNDS.visits),
})

export const knRunSchema = z.object({
  domains: z.array(knDomainSchema).min(1).max(KN_RUN_BOUNDS.domains),
  current: boundedInt({ min: 0, max: KN_RUN_BOUNDS.domains - 1 }),
  tensionDie: knUsageDieSchema,
  lightRemaining: boundedInt(KN_RUN_BOUNDS.light),
}).refine(run => run.current < run.domains.length, { message: 'Domaine courant inexistant' })

export type KnGrowingDarknessEntry = z.infer<typeof knGrowingDarknessEntrySchema>
export type KnGrowingDarknessDraw = z.infer<typeof knGrowingDarknessDrawSchema>
export type KnDieResult = z.infer<typeof knDieResultSchema>
export type KnVisit = z.infer<typeof knVisitSchema>
export type KnVisitKind = KnVisit['kind']
export type KnDomain = z.infer<typeof knDomainSchema>
export type KnRun = z.infer<typeof knRunSchema>

export const emptyKnDomain = (number: number): KnDomain => ({
  name: `Domaine ${number}`,
  rooms: 0,
  lairDie: KN_LAIR_START_DIE,
  lairFound: false,
  exitDie: KN_EXIT_START_DIE,
  exitFound: false,
  overseerInfluences: [],
  growingDarkness: [],
  visits: [],
})

export const emptyKnRun = (): KnRun => ({
  domains: [emptyKnDomain(1)],
  current: 0,
  tensionDie: KN_TENSION_START_DIE,
  lightRemaining: KN_LIGHT_ROOMS,
})

export const knCurrentDomain = (run: KnRun): KnDomain => run.domains[run.current]!

const withCurrentDomain = (run: KnRun, patch: Partial<KnDomain>): KnRun => ({
  ...run,
  domains: run.domains.map((domain, index) => index === run.current ? { ...domain, ...patch } : domain),
})

export type KnRng = () => number

export const knRollDie = (sides: number, rng: KnRng = Math.random): number => Math.floor(rng() * sides) + 1

export interface KnDieCheck {
  die: KnUsageDie
  triggered: boolean
}

export function knUsageCheck(die: KnUsageDie, roll: number): KnDieCheck {
  if (roll > 2) return { die, triggered: false }
  const next = KN_USAGE_DICE[KN_USAGE_DICE.indexOf(die) + 1]
  return next === undefined ? { die, triggered: true } : { die: next, triggered: false }
}

// Événement 69-70 : 2 au lieu de 1 par salle. Pas de cumul : le livre ne dit rien d'un double tirage.
export const knLightCost = (domain: KnDomain): number =>
  domain.growingDarkness.some(event => event.key === 'gd_69_70') ? 2 : 1

// Retourner dans une salle déjà explorée ne compte pas dans les salles du Domaine, mais consomme la lumière.
export function knEnterRoom(run: KnRun, { isNew }: { isNew: boolean }): KnRun {
  const domain = knCurrentDomain(run)
  return {
    ...withCurrentDomain(run, isNew ? { rooms: domain.rooms + 1 } : {}),
    lightRemaining: Math.max(0, run.lightRemaining - knLightCost(domain)),
  }
}

export function knTensionCheck(run: KnRun, roll: number): { run: KnRun, triggered: boolean } {
  const { die, triggered } = knUsageCheck(run.tensionDie, roll)
  return { run: { ...run, tensionDie: triggered ? KN_TENSION_START_DIE : die }, triggered }
}

export function knLairCheck(run: KnRun, roll: number): { run: KnRun, found: boolean } {
  const domain = knCurrentDomain(run)
  if (domain.lairFound) return { run, found: false }
  const { die, triggered } = knUsageCheck(domain.lairDie, roll)
  return { run: withCurrentDomain(run, { lairDie: die, lairFound: triggered }), found: triggered }
}

// Le dé de Sortie ne se lance qu'une fois le Lair trouvé.
export function knExitCheck(run: KnRun, roll: number): { run: KnRun, found: boolean } {
  const domain = knCurrentDomain(run)
  if (!domain.lairFound || domain.exitFound) return { run, found: false }
  const { die, triggered } = knUsageCheck(domain.exitDie, roll)
  return { run: withCurrentDomain(run, { exitDie: die, exitFound: triggered }), found: triggered }
}

// Entrer pour la première fois dans un Domaine remet le Dé de Tension à D8.
export function knNewDomain(run: KnRun): KnRun {
  if (run.domains.length >= KN_RUN_BOUNDS.domains) return run
  return {
    ...run,
    domains: [...run.domains, emptyKnDomain(run.domains.length + 1)],
    current: run.domains.length,
    tensionDie: KN_TENSION_START_DIE,
  }
}

export function knSwitchDomain(run: KnRun, index: number): KnRun {
  return Number.isInteger(index) && index >= 0 && index < run.domains.length ? { ...run, current: index } : run
}

export function knGrowingDarknessKeyForRoll(roll: number): KnGrowingDarknessKey {
  const key = KN_GROWING_DARKNESS_KEYS.find((candidate) => {
    const [from, to] = KN_GROWING_DARKNESS[candidate].range
    return roll >= from && roll <= to
  })
  if (!key) throw new RangeError(`Résultat hors de la table : ${roll}`)
  return key
}

export function knDrawGrowingDarkness(rng: KnRng = Math.random): KnGrowingDarknessDraw {
  const roll = knRollDie(100, rng)
  const key = knGrowingDarknessKeyForRoll(roll)
  const { paramDie } = knGrowingDarknessDef(key)
  const entry: KnGrowingDarknessEntry = paramDie ? { key, value: knRollDie(paramDie, rng) } : { key }

  if (key !== 'gd_81_100') return { roll, entry }
  const influenceRoll = knRollDie(KN_OVERSEER_INFLUENCE_KEYS.length, rng)
  return { roll, entry, influence: { roll: influenceRoll, key: KN_OVERSEER_INFLUENCE_KEYS[influenceRoll - 1]! } }
}

export function knAddGrowingDarkness(run: KnRun, draw: KnGrowingDarknessDraw): KnRun {
  const domain = knCurrentDomain(run)
  return withCurrentDomain(run, {
    growingDarkness: [...domain.growingDarkness, draw.entry],
    overseerInfluences: draw.influence ? [...domain.overseerInfluences, draw.influence.key] : domain.overseerInfluences,
  })
}

export const knCurrentVisit = (run: KnRun): KnVisit | undefined => knCurrentDomain(run).visits.at(-1)

export const knVisitFoundLair = (visit: KnVisit): boolean => visit.usageKind === 'lair' && !!visit.usage?.triggered

export const knVisitPending = (visit: KnVisit) => ({
  tension: !visit.tension,
  usage: visit.usageKind !== null && !visit.usage,
  darkness: !!visit.tension?.triggered && !visit.darkness,
})

function withLastVisit(run: KnRun, update: (visit: KnVisit) => KnVisit): KnRun {
  const { visits } = knCurrentDomain(run)
  const last = visits.at(-1)
  return last ? withCurrentDomain(run, { visits: [...visits.slice(0, -1), update(last)] }) : run
}

// Le dé de Lair, puis celui de Sortie une fois le Lair trouvé, se lancent à chaque nouvelle salle ou couloir.
export function knStartVisit(run: KnRun, kind: KnVisitKind): KnRun {
  const domain = knCurrentDomain(run)
  const usageKind: KnVisit['usageKind'] = kind === 'revisit' || domain.exitFound ? null : domain.lairFound ? 'exit' : 'lair'
  const entered = knEnterRoom(run, { isNew: kind !== 'revisit' })
  const visits = [...knCurrentDomain(entered).visits, { kind, usageKind }].slice(-KN_RUN_BOUNDS.visits)
  return withCurrentDomain(entered, { visits })
}

export function knRecordTension(run: KnRun, roll: number, manual: boolean): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit || visit.tension) return run
  const die = run.tensionDie
  const { run: checked, triggered } = knTensionCheck(run, roll)
  return withLastVisit(checked, v => ({ ...v, tension: { die, roll, manual, next: checked.tensionDie, triggered } }))
}

export function knRecordUsage(run: KnRun, roll: number, manual: boolean): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit?.usageKind || visit.usage) return run
  const isLair = visit.usageKind === 'lair'
  const domain = knCurrentDomain(run)
  const die = isLair ? domain.lairDie : domain.exitDie
  const { run: checked, found } = isLair ? knLairCheck(run, roll) : knExitCheck(run, roll)
  const after = knCurrentDomain(checked)
  return withLastVisit(checked, v => ({
    ...v,
    usage: { die, roll, manual, next: isLair ? after.lairDie : after.exitDie, triggered: found },
  }))
}

export function knRecordDarkness(run: KnRun, draw: KnGrowingDarknessDraw): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit?.tension?.triggered || visit.darkness) return run
  return withLastVisit(knAddGrowingDarkness(run, draw), v => ({ ...v, darkness: draw }))
}

// Rend le compte de salles, pas la lumière, l'Éther, l'état des dés ni l'événement tiré : ceux-là se corrigent à la main.
export function knUndoLastVisit(run: KnRun): KnRun {
  const domain = knCurrentDomain(run)
  const last = domain.visits.at(-1)
  if (!last) return run
  return withCurrentDomain(run, {
    visits: domain.visits.slice(0, -1),
    rooms: last.kind === 'revisit' ? domain.rooms : Math.max(0, domain.rooms - 1),
  })
}
