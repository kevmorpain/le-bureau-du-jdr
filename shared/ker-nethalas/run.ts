import { z } from 'zod'
import {
  KN_GROWING_DARKNESS,
  KN_GROWING_DARKNESS_KEYS,
  knGrowingDarknessDef,
  type KnGrowingDarknessKey,
} from './catalog/growingDarkness'
import { KN_OVERSEER_INFLUENCE_KEYS } from './catalog/overseerInfluence'
import { KN_COMBAT_BOUNDS, knCombatCreatureSchema, knCombatSchema, type KnCombatCreature, type KnCreatureBuff } from './combatState'
import { KN_DIFFICULTY_KEYS, type KnDifficultyKey } from './difficulty'
import { KN_OBSTACLE_KINDS, knEncounterTriggered, knHasDoor, knIsLocked, knIsTrapped, type KnObstacleKind } from './exploration'
import { knIntroSchema } from './introState'
import { KN_SKILL_KEYS, type KnWeaponSkillKey } from './skills'
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
  obstacles: 8,
  extraTension: 10,
  creatures: 4,
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

// Un tirage dans une table du livre : on garde le numéro, jamais le texte, qui se relit dans le contenu chargé.
const knTableRollSchema = z.object({ roll: boundedInt({ min: 1, max: 100 }) })

// Résultats d'une table déjà pris (indices dans les `outcomes` de l'entrée) : chacun ne s'applique qu'une fois.
const knTakenSchema = z.array(boundedInt({ min: 0, max: 7 })).max(8).optional()

export const KN_TRAP_STATES = ['disarmed', 'bypassed', 'triggering', 'avoided', 'suffered'] as const

export type KnTrapState = (typeof KN_TRAP_STATES)[number]

// Une porte, un contenant ou une pièce piégée : test de Perception, jets de piège, de type de piège et de verrou, puis
// ce qui a été fait (piège désamorcé, déclenché, verrou crocheté ou forcé).
export const knObstacleSchema = z.object({
  kind: z.enum(KN_OBSTACLE_KINDS),
  perception: z.enum(['passed', 'failed']).optional(),
  trap: z.object({ roll: boundedInt({ min: 1, max: 10 }) }).optional(),
  trapType: z.object({ roll: boundedInt({ min: 1, max: 10 }) }).optional(),
  trapState: z.enum(KN_TRAP_STATES).optional(),
  trapTaken: knTakenSchema,
  lock: z.object({ roll: boundedInt({ min: 1, max: 20 }) }).optional(),
  lockOpen: z.boolean().optional(),
  pick: z.object({ difficulty: z.enum(KN_DIFFICULTY_KEYS), failures: boundedInt({ min: 0, max: 99 }) }).optional(),
  forced: boundedInt({ min: 0, max: 99 }).optional(),
})

// Test de Dé de Tension en plus de celui de l'entrée : fouille approfondie, vacarme d'un verrou forcé.
const knExtraTensionSchema = knDieResultSchema.extend({
  source: z.enum(['search', 'noise']),
  darkness: knGrowingDarknessDrawSchema.optional(),
})

export const knVisitSchema = z.object({
  kind: z.enum(KN_VISIT_KINDS),
  usageKind: z.enum(['lair', 'exit']).nullable(),
  // Domaine d'introduction : la salle de la carte que cette entrée parcourt, et ce que le livre y exclut.
  introRoom: boundedInt({ min: 1, max: 8 }).optional(),
  noEncounter: z.boolean().optional(),
  noEvent: z.boolean().optional(),
  // Le marchand est dans cette entrée du chemin (trouvé ici, ou revu en y retournant).
  trader: z.boolean().optional(),
  tension: knDieResultSchema.optional(),
  usage: knDieResultSchema.optional(),
  darkness: knGrowingDarknessDrawSchema.optional(),
  // D100 de forme, qui a décidé du type d'entrée ; absent quand le type a été choisi à la main.
  shape: knTableRollSchema.optional(),
  description: knTableRollSchema.optional(),
  encounter: z.object({ roll: boundedInt({ min: 1, max: 20 }), triggered: z.boolean() }).optional(),
  event: knTableRollSchema.extend({ taken: knTakenSchema }).optional(),
  door: z.object({ roll: boundedInt({ min: 1, max: 10 }), present: z.boolean() }).optional(),
  scavenge: knTableRollSchema.extend({ applied: z.boolean(), taken: knTakenSchema, adjusted: z.boolean().optional() }).optional(),
  obstacles: z.array(knObstacleSchema).max(KN_RUN_BOUNDS.obstacles).optional(),
  deepSearch: z.object({ content: knTableRollSchema.optional() }).optional(),
  extraTension: z.array(knExtraTensionSchema).max(KN_RUN_BOUNDS.extraTension).optional(),
  // Les créatures tirées dans cette entrée (combat, événement, alarme) : un D6 pour la table, un D20 pour la créature.
  creatures: z.array(z.object({ d6: boundedInt({ min: 1, max: 6 }), d20: boundedInt({ min: 1, max: 20 }) })).max(KN_RUN_BOUNDS.creatures).optional(),
})

export const knDomainSchema = z.object({
  name: z.string().trim().min(1).max(100),
  rooms: boundedInt(KN_RUN_BOUNDS.rooms),
  lairDie: knUsageDieSchema,
  lairFound: z.boolean(),
  exitDie: knUsageDieSchema,
  exitFound: z.boolean(),
  overseerInfluences: z.array(z.enum(KN_OVERSEER_INFLUENCE_KEYS)).max(KN_RUN_BOUNDS.overseerInfluences),
  // Vaincu, l'Overseer ne donne plus d'influence aux adversaires du Domaine ; la liste reste pour mémoire.
  overseerDefeated: z.boolean().optional(),
  // Un marchand a été trouvé dans ce Domaine : il y reste, on peut le revoir depuis une entrée de retour.
  traderFound: z.boolean().optional(),
  // Le Domaine d'introduction : sa carte est fixe, avec son contenu et sa table de rencontres propres.
  intro: knIntroSchema.optional(),
  // L'Overseer du Domaine : le D10 tiré en y entrant pour la première fois.
  overseer: z.object({ roll: boundedInt({ min: 1, max: 10 }) }).optional(),
  growingDarkness: z.array(knGrowingDarknessEntrySchema).max(KN_RUN_BOUNDS.growingDarkness),
  visits: z.array(knVisitSchema).max(KN_RUN_BOUNDS.visits),
})

export const knRunSchema = z.object({
  domains: z.array(knDomainSchema).min(1).max(KN_RUN_BOUNDS.domains),
  current: boundedInt({ min: 0, max: KN_RUN_BOUNDS.domains - 1 }),
  tensionDie: knUsageDieSchema,
  lightRemaining: boundedInt(KN_RUN_BOUNDS.light),
  // Le combat en cours : il traverse les entrées du chemin du Domaine, d'où sa place dans le run.
  combat: knCombatSchema.optional(),
  // Les sbires de Maîtrise : ils suivent le survivant de pièce en pièce, jusqu'à leur destruction.
  minions: z.array(knCombatCreatureSchema).max(KN_COMBAT_BOUNDS.minions).optional(),
}).refine(run => run.current < run.domains.length, { message: 'Domaine courant inexistant' })

export type KnGrowingDarknessEntry = z.infer<typeof knGrowingDarknessEntrySchema>
export type KnGrowingDarknessDraw = z.infer<typeof knGrowingDarknessDrawSchema>
export type KnDieResult = z.infer<typeof knDieResultSchema>
export type KnObstacle = z.infer<typeof knObstacleSchema>
export type KnExtraTension = z.infer<typeof knExtraTensionSchema>
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
// `shapeRoll` : le D100 de forme qui a décidé du type d'entrée.
export interface KnIntroEntry {
  room: number
  noEncounter?: boolean
  noEvent?: boolean
}

export function knStartVisit(run: KnRun, kind: KnVisitKind, shapeRoll?: number, intro?: KnIntroEntry): KnRun {
  const domain = knCurrentDomain(run)
  const usageKind: KnVisit['usageKind'] = kind === 'revisit' || domain.exitFound ? null : domain.lairFound ? 'exit' : 'lair'
  const entered = knEnterRoom(run, { isNew: kind !== 'revisit' })
  const visit: KnVisit = {
    kind,
    usageKind,
    ...(shapeRoll === undefined ? {} : { shape: { roll: shapeRoll } }),
    ...(intro ? { introRoom: intro.room, ...(intro.noEncounter ? { noEncounter: true } : {}), ...(intro.noEvent || intro.noEncounter ? { noEvent: true } : {}) } : {}),
  }
  const visits = [...knCurrentDomain(entered).visits, visit].slice(-KN_RUN_BOUNDS.visits)
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

// Pas de rencontre de combat dans une zone déjà explorée ni dans le Lair de l'Overseer.
export const knVisitCanHaveEncounter = (visit: KnVisit) => visit.kind !== 'revisit' && !knVisitFoundLair(visit) && !visit.noEncounter

// Pas d'événement dans un couloir ni dans une zone déjà explorée, ni dans le Lair, ni après une rencontre de combat, ni dans une salle
// du Domaine d'introduction qui n'en a pas.
export const knVisitCanHaveEvent = (visit: KnVisit) =>
  visit.kind === 'room' && !knVisitFoundLair(visit) && !visit.noEvent && visit.encounter?.triggered === false

export function knRecordDescription(run: KnRun, roll: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit && visit.kind !== 'revisit' ? withLastVisit(run, v => ({ ...v, description: { roll } })) : run
}

export function knRecordEncounter(run: KnRun, roll: number): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit || visit.encounter || !knVisitCanHaveEncounter(visit)) return run
  const { kind } = visit
  if (kind === 'revisit') return run
  return withLastVisit(run, v => ({ ...v, encounter: { roll, triggered: knEncounterTriggered(kind, roll) } }))
}

export function knRecordEvent(run: KnRun, roll: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit && !visit.event && knVisitCanHaveEvent(visit) ? withLastVisit(run, v => ({ ...v, event: { roll } })) : run
}

export function knRecordDoor(run: KnRun, roll: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit && !visit.door ? withLastVisit(run, v => ({ ...v, door: { roll, present: knHasDoor(roll) } })) : run
}

// Une fouille par salle, hors zone explorée : le test de Fouille se fait à part, le tirage vient après sa réussite.
export function knRecordScavenge(run: KnRun, roll: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit && visit.kind !== 'revisit' && !visit.scavenge ? withLastVisit(run, v => ({ ...v, scavenge: { roll, applied: false } })) : run
}

// Atout de Fouille ajustable : le tirage de Fouille bouge une seule fois, du résultat d'un D4, tant que rien n'en a été pris ni appliqué.
export function knAdjustScavenge(run: KnRun, delta: number, die: number): KnRun {
  const scavenge = knCurrentVisit(run)?.scavenge
  if (!scavenge || scavenge.adjusted || scavenge.applied || scavenge.taken?.length) return run
  const roll = Math.min(die, Math.max(1, scavenge.roll + delta))
  return withLastVisit(run, v => ({ ...v, scavenge: { ...v.scavenge!, roll, adjusted: true } }))
}

export function knMarkScavengeApplied(run: KnRun): KnRun {
  const visit = knCurrentVisit(run)
  return visit?.scavenge ? withLastVisit(run, v => ({ ...v, scavenge: { ...v.scavenge!, applied: true } })) : run
}

const withTaken = (taken: number[] | undefined, outcome: number) => taken?.includes(outcome) ? taken : [...(taken ?? []), outcome]

// Une rencontre peut venir du test de combat, d'un événement ou d'une alarme : on garde chaque tirage, dans l'ordre.
export function knRecordCreature(run: KnRun, d6: number, d20: number): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit || visit.kind === 'revisit' || (visit.creatures?.length ?? 0) >= KN_RUN_BOUNDS.creatures) return run
  return withLastVisit(run, v => ({ ...v, creatures: [...(v.creatures ?? []), { d6, d20 }] }))
}

export const knTraderHere = (run: KnRun): boolean => !!knCurrentVisit(run)?.trader

// Marquer, ou démarquer, l'entrée courante comme celle où se trouve le marchand ; le Domaine retient qu'il en a un.
export function knSetTrader(run: KnRun, here: boolean): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit) return run
  const marked = withLastVisit(run, ({ trader: _previous, ...rest }) => here ? { ...rest, trader: true } : rest)
  return withCurrentDomain(marked, { traderFound: knCurrentDomain(marked).visits.some(entry => entry.trader) })
}

export const knDefeatOverseer = (run: KnRun): KnRun => withCurrentDomain(run, { overseerDefeated: true })

export function knRecordOverseer(run: KnRun, roll: number): KnRun {
  return knCurrentDomain(run).overseer ? run : withCurrentDomain(run, { overseer: { roll } })
}

export function knMarkEventOutcome(run: KnRun, outcome: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit?.event ? withLastVisit(run, v => ({ ...v, event: { ...v.event!, taken: withTaken(v.event!.taken, outcome) } })) : run
}

export function knMarkScavengeOutcome(run: KnRun, outcome: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit?.scavenge ? withLastVisit(run, v => ({ ...v, scavenge: { ...v.scavenge!, taken: withTaken(v.scavenge!.taken, outcome) } })) : run
}

export function knRecordExtraTension(run: KnRun, roll: number, manual: boolean, source: KnExtraTension['source']): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit || (visit.extraTension?.length ?? 0) >= KN_RUN_BOUNDS.extraTension) return run
  const die = run.tensionDie
  const { run: checked, triggered } = knTensionCheck(run, roll)
  const check: KnExtraTension = { die, roll, manual, next: checked.tensionDie, triggered, source }
  return withLastVisit(checked, v => ({ ...v, extraTension: [...(v.extraTension ?? []), check] }))
}

export function knRecordExtraDarkness(run: KnRun, index: number, draw: KnGrowingDarknessDraw): KnRun {
  const check = knCurrentVisit(run)?.extraTension?.[index]
  if (!check?.triggered || check.darkness) return run
  const extraTension = (visit: KnVisit) => (visit.extraTension ?? []).map((entry, i) => i === index ? { ...entry, darkness: draw } : entry)
  return withLastVisit(knAddGrowingDarkness(run, draw), v => ({ ...v, extraTension: extraTension(v) }))
}

export const knObstacleState = (obstacle: KnObstacle) => {
  const trapped = obstacle.kind === 'room' ? true : obstacle.trap ? knIsTrapped(obstacle.trap.roll) : undefined
  const locked = obstacle.lock ? knIsLocked(obstacle.kind, obstacle.lock.roll) : undefined
  const trapPending = trapped === true && (obstacle.trapState === undefined || obstacle.trapState === 'triggering')
  return {
    trapped,
    spotted: trapped === true && obstacle.perception === 'passed',
    locked,
    trapPending,
    lockPending: locked === true && !obstacle.lockOpen,
    // Rien ne se crochète ni ne se force tant qu'un piège attend d'être réglé.
    canWorkLock: locked === true && !obstacle.lockOpen && !trapPending,
  }
}

function withObstacle(run: KnRun, index: number, update: (obstacle: KnObstacle) => KnObstacle): KnRun {
  return withLastVisit(run, v => v.obstacles?.[index]
    ? { ...v, obstacles: v.obstacles.map((obstacle, i) => i === index ? update(obstacle) : obstacle) }
    : v)
}

const addObstacle = (run: KnRun, kind: KnObstacleKind): KnRun =>
  withLastVisit(run, v => ({ ...v, obstacles: [...(v.obstacles ?? []), { kind }] }))

// Une porte à vérifier : seulement si le D10 en a trouvé une.
export function knAddDoorObstacle(run: KnRun): KnRun {
  const visit = knCurrentVisit(run)
  // Dans le Domaine d'introduction, toutes les portes sont déjà sur la carte : il n'y a pas de D10 pour en trouver une.
  const marked = !!knCurrentDomain(run).intro && visit?.kind !== 'revisit'
  if (!visit || (!visit.door?.present && !marked) || (visit.obstacles?.length ?? 0) >= KN_RUN_BOUNDS.obstacles) return run
  return addObstacle(run, 'door')
}

// Le piège de la pièce que l'événement vient d'annoncer : un seul par entrée.
export function knAddRoomTrap(run: KnRun): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit?.event || visit.obstacles?.some(obstacle => obstacle.kind === 'room') || (visit.obstacles?.length ?? 0) >= KN_RUN_BOUNDS.obstacles) return run
  return addObstacle(run, 'room')
}

// Un piège de la pièce que l'on n'a pas repéré se déclenche aussitôt.
export function knSetPerception(run: KnRun, index: number, perception: 'passed' | 'failed'): KnRun {
  return withObstacle(run, index, obstacle => obstacle.perception
    ? obstacle
    : { ...obstacle, perception, ...(obstacle.kind === 'room' && perception === 'failed' ? { trapState: 'triggering' as const } : {}) })
}

// Le jet de piège suit le test de Perception : réussi, un piège est repéré ; raté, il se déclenche si l'on interagit.
export function knRecordTrap(run: KnRun, index: number, roll: number): KnRun {
  return withObstacle(run, index, obstacle => obstacle.kind === 'room' || !obstacle.perception || obstacle.trap
    ? obstacle
    : { ...obstacle, trap: { roll }, ...(obstacle.perception === 'failed' && knIsTrapped(roll) ? { trapState: 'triggering' as const } : {}) })
}

export function knRecordTrapType(run: KnRun, index: number, roll: number): KnRun {
  return withObstacle(run, index, obstacle =>
    knObstacleState(obstacle).trapped && obstacle.perception && !obstacle.trapType ? { ...obstacle, trapType: { roll } } : obstacle)
}

export function knRecordLock(run: KnRun, index: number, roll: number): KnRun {
  return withObstacle(run, index, obstacle => obstacle.kind === 'room' || !obstacle.perception || obstacle.lock ? obstacle : { ...obstacle, lock: { roll } })
}

const trapReady = (obstacle: KnObstacle) => knObstacleState(obstacle).spotted && obstacle.trapState === undefined

// Désamorcer, ou contourner un piège de la pièce : une réussite le neutralise, un échec le déclenche.
export function knResolveTrapAction(run: KnRun, index: number, action: 'disarm' | 'bypass', success: boolean): KnRun {
  return withObstacle(run, index, (obstacle) => {
    if (!trapReady(obstacle) || (action === 'bypass' && obstacle.kind !== 'room')) return obstacle
    return { ...obstacle, trapState: success ? (action === 'disarm' ? 'disarmed' : 'bypassed') : 'triggering' }
  })
}

// Déclencher exprès un piège repéré.
export function knTriggerTrap(run: KnRun, index: number): KnRun {
  return withObstacle(run, index, obstacle => trapReady(obstacle) ? { ...obstacle, trapState: 'triggering' } : obstacle)
}

// Test d'évitement d'un piège déclenché : évité, ou subi avec les résultats pris (indices des `outcomes` du type de piège).
export function knFinishTrap(run: KnRun, index: number, avoided: boolean, taken: number[] = []): KnRun {
  return withObstacle(run, index, obstacle => obstacle.trapState === 'triggering' && obstacle.trapType
    ? { ...obstacle, trapState: avoided ? 'avoided' : 'suffered', ...(taken.length ? { trapTaken: taken } : {}) }
    : obstacle)
}

export const KN_FORCE_BONUS_STEP = 20

// Chaque tentative ratée de forcer ajoute +20 aux suivantes.
export const knForceBonus = (obstacle: KnObstacle) => (obstacle.forced ?? 0) * KN_FORCE_BONUS_STEP

export function knStartPick(run: KnRun, index: number, difficulty: KnDifficultyKey): KnRun {
  return withObstacle(run, index, obstacle => knObstacleState(obstacle).canWorkLock && !obstacle.pick ? { ...obstacle, pick: { difficulty, failures: 0 } } : obstacle)
}

// Un échec brise le Crochet : la tentative suivante se fait une difficulté plus bas.
export function knResolvePick(run: KnRun, index: number, success: boolean): KnRun {
  return withObstacle(run, index, (obstacle) => {
    if (!knObstacleState(obstacle).canWorkLock || !obstacle.pick) return obstacle
    return success ? { ...obstacle, lockOpen: true } : { ...obstacle, pick: { ...obstacle.pick, failures: obstacle.pick.failures + 1 } }
  })
}

export function knResolveForce(run: KnRun, index: number, success: boolean): KnRun {
  return withObstacle(run, index, (obstacle) => {
    if (!knObstacleState(obstacle).canWorkLock) return obstacle
    return success ? { ...obstacle, lockOpen: true } : { ...obstacle, forced: (obstacle.forced ?? 0) + 1 }
  })
}

// Une fouille approfondie par salle ou couloir : un Dé de Tension tout de suite, puis un contenant à vérifier.
export const knVisitCanSearch = (visit: KnVisit) => visit.kind !== 'revisit' && !visit.deepSearch

export function knStartDeepSearch(run: KnRun, roll: number, manual: boolean): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit || !knVisitCanSearch(visit) || (visit.obstacles?.length ?? 0) >= KN_RUN_BOUNDS.obstacles) return run
  const checked = knRecordExtraTension(run, roll, manual, 'search')
  if (checked === run) return run
  return addObstacle(withLastVisit(checked, v => ({ ...v, deepSearch: {} })), 'container')
}

export function knRecordDeepSearchContent(run: KnRun, roll: number): KnRun {
  const visit = knCurrentVisit(run)
  return visit?.deepSearch && !visit.deepSearch.content ? withLastVisit(run, v => ({ ...v, deepSearch: { content: { roll } } })) : run
}

// Le dé en cours de recherche : celui de Lair tant que le Lair n'est pas trouvé, puis celui de Sortie.
// Augmenter d'un cran, c'est passer au dé plus grand (D8 → D10) : il faudra plus de salles pour trouver.
export function knUsageDieRaise(run: KnRun): { which: 'lair' | 'exit', from: KnUsageDie, to: KnUsageDie } | null {
  const domain = knCurrentDomain(run)
  const which = !domain.lairFound ? 'lair' : !domain.exitFound ? 'exit' : null
  if (!which) return null
  const from = which === 'lair' ? domain.lairDie : domain.exitDie
  const to = KN_USAGE_DICE[KN_USAGE_DICE.indexOf(from) - 1]
  return to === undefined ? null : { which, from, to }
}

export function knRaiseUsageDie(run: KnRun): KnRun {
  const raise = knUsageDieRaise(run)
  if (!raise) return run
  return withCurrentDomain(run, raise.which === 'lair' ? { lairDie: raise.to } : { exitDie: raise.to })
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

// Engager un combat : chaque créature garde sa Santé, fixée ici à son niveau. Un combat déjà engagé ne se remplace pas.
export function knStartCombat(run: KnRun, creatures: KnCombatCreature[], overseer = false, fearLoss = 0): KnRun {
  if (run.combat || !creatures.length) return run
  return {
    ...run,
    combat: {
      creatures: creatures.slice(0, KN_COMBAT_BOUNDS.creatures),
      round: 1,
      reactions: 0,
      log: [],
      ...(overseer ? { overseer } : {}),
      ...(fearLoss > 0 ? { fear: { loss: fearLoss, resolved: false } } : {}),
    },
  }
}

export function knSetCombatLamp(run: KnRun, down: boolean): KnRun {
  if (!run.combat) return run
  const { lampDown: _previous, ...rest } = run.combat
  return { ...run, combat: down ? { ...rest, lampDown: true } : rest }
}

// Une maladresse renverse la lampe posée : toute son huile se répand, la lumière restante tombe à 0.
export function knSpillLamp(run: KnRun): KnRun {
  return { ...knSetCombatLamp(run, false), lightRemaining: 0 }
}

export function knResolveCombatFear(run: KnRun): KnRun {
  return run.combat?.fear ? { ...run, combat: { ...run.combat, fear: { ...run.combat.fear, resolved: true } } } : run
}

export function knEndCombat(run: KnRun): KnRun {
  const { combat: _ended, ...rest } = run
  return rest
}

// Une ligne de plus dans le journal du combat, les plus récentes en tête.
export function knCombatLog(run: KnRun, line: string): KnRun {
  return run.combat ? { ...run, combat: { ...run.combat, log: [line, ...run.combat.log].slice(0, KN_COMBAT_BOUNDS.log) } } : run
}

const withCreature = (run: KnRun, index: number, patch: (creature: KnCombatCreature) => KnCombatCreature): KnRun =>
  run.combat ? { ...run, combat: { ...run.combat, creatures: run.combat.creatures.map((c, i) => i === index ? patch(c) : c) } } : run

// Dégâts (positifs) ou soins (négatifs) sur une créature : la Santé temporaire part d'abord, la Santé reste entre 0 et son maximum.
function damaged(creature: KnCombatCreature, amount: number): KnCombatCreature {
  const hit = Math.trunc(amount)
  const absorbed = hit > 0 ? Math.min(creature.temporary ?? 0, hit) : 0
  const health = Math.min(creature.maxHealth, Math.max(0, creature.health - (hit - absorbed)))
  const left = (creature.temporary ?? 0) - absorbed
  return { ...(left > 0 ? { ...creature, temporary: left } : withoutTemporary(creature)), health }
}

const withoutTemporary = ({ temporary: _temporary, temporaryUntil: _until, ...rest }: KnCombatCreature): KnCombatCreature => rest

// Dégâts (positifs) ou soins (négatifs) sur une créature engagée, entre 0 et sa Santé maximale. Les dégâts retirent d'abord
// sa Santé temporaire.
export function knDamageCombatCreature(run: KnRun, index: number, amount: number): KnRun {
  if (!run.combat?.creatures[index]) return run
  return withCreature(run, index, c => damaged(c, amount))
}

export function knMarkCreatureSlain(run: KnRun, index: number, skill: KnWeaponSkillKey): KnRun {
  return run.combat?.creatures[index] ? withCreature(run, index, creature => ({ ...creature, slainBy: skill })) : run
}

// Des adversaires de plus en combat ; `max` borne le nombre de ceux de la même fiche encore en vie.
export function knAddCombatCreatures(run: KnRun, creatures: KnCombatCreature[], max?: number): KnRun {
  if (!run.combat) return run
  const ref = creatures[0]?.ref
  const alive = ref ? run.combat.creatures.filter(c => c.ref === ref && c.health > 0).length : 0
  const room = max === undefined ? creatures.length : Math.max(0, max - alive)
  const added = creatures.slice(0, Math.min(room, KN_COMBAT_BOUNDS.creatures - run.combat.creatures.length))
  return added.length ? { ...run, combat: { ...run.combat, creatures: [...run.combat.creatures, ...added] } } : run
}

export function knAddMinion(run: KnRun, minion: KnCombatCreature): KnRun {
  const minions = run.minions ?? []
  return minions.length >= KN_COMBAT_BOUNDS.minions ? run : { ...run, minions: [...minions, minion] }
}

export function knRemoveMinion(run: KnRun, index: number): KnRun {
  const rest = (run.minions ?? []).filter((_, i) => i !== index)
  const { minions: _previous, ...others } = run
  return rest.length ? { ...others, minions: rest } : others
}

// Un sbire qui tombe à 0 Santé est détruit : il quitte l'équipe.
export function knDamageMinion(run: KnRun, index: number, amount: number): { run: KnRun, destroyed: boolean } {
  const target = run.minions?.[index]
  if (!target) return { run, destroyed: false }
  const next = damaged(target, amount)
  if (next.health <= 0) return { run: knRemoveMinion(run, index), destroyed: true }
  return { run: { ...run, minions: run.minions!.map((m, i) => i === index ? next : m) }, destroyed: false }
}

// Une pièce nettoyée : les sbires récupèrent toute leur Santé.
export function knHealMinions(run: KnRun): KnRun {
  return run.minions ? { ...run, minions: run.minions.map(m => ({ ...withoutTemporary(m), health: m.maxHealth })) } : run
}

// Santé temporaire gagnée : `cap` est le multiple de sa Santé que la créature ne peut pas dépasser avec elle.
export function knGainCombatTemporary(run: KnRun, index: number, amount: number, options: { cap?: number, until?: 'turn' | 'round' } = {}): KnRun {
  const target = run.combat?.creatures[index]
  if (!target || amount <= 0) return run
  const room = options.cap === undefined ? KN_COMBAT_BOUNDS.health.max : Math.max(0, Math.floor(target.health * (options.cap - 1)))
  const temporary = Math.min(room, (target.temporary ?? 0) + Math.trunc(amount), KN_COMBAT_BOUNDS.health.max)
  if (temporary <= 0) return run
  return withCreature(run, index, c => ({ ...c, temporary, ...(options.until ? { temporaryUntil: options.until } : {}) }))
}

// Une créature éphémère vient de jouer son action.
export function knSpendCombatCreature(run: KnRun, index: number): KnRun {
  return withCreature(run, index, c => ({ ...c, spent: true }))
}

// Les créatures éphémères qui ont joué disparaissent.
export function knVanishSpentCreatures(run: KnRun): KnRun {
  if (!run.combat?.creatures.some(c => c.spent)) return run
  return { ...run, combat: { ...run.combat, creatures: run.combat.creatures.map(({ spent, ...c }) => spent ? { ...c, health: 0 } : c) } }
}

// Un effet en cours sur une créature, ou sur toutes les vivantes de sa fiche. Le même effet reposé en remplace la durée.
export function knAddCreatureBuff(run: KnRun, index: number, buff: KnCreatureBuff, scope: 'self' | 'sameSheet' = 'self'): KnRun {
  const target = run.combat?.creatures[index]
  if (!run.combat || !target) return run
  const concerned = (c: KnCombatCreature, i: number) => i === index || (scope === 'sameSheet' && !!target.ref && c.ref === target.ref && c.health > 0)
  return {
    ...run,
    combat: {
      ...run.combat,
      creatures: run.combat.creatures.map((c, i) => concerned(c, i)
        ? { ...c, effects: [...(c.effects ?? []).filter(effect => effect.label !== buff.label), buff].slice(-8) }
        : c),
    },
  }
}

const withEffects = (creature: KnCombatCreature, effects: KnCreatureBuff[]): KnCombatCreature => {
  const { effects: _previous, ...rest } = creature
  return effects.length ? { ...rest, effects } : rest
}

// Un round qui passe : chaque effet à durée perd un round, et tombe à zéro.
export function knAdvanceCreatureEffects(run: KnRun): KnRun {
  if (!run.combat) return run
  return {
    ...run,
    combat: {
      ...run.combat,
      creatures: run.combat.creatures.map(c => c.effects
        ? withEffects(c, c.effects.flatMap(effect => effect.rounds === undefined ? [effect] : effect.rounds <= 1 ? [] : [{ ...effect, rounds: effect.rounds - 1 }]))
        : c),
    },
  }
}

// La créature joue : ses effets « jusqu'à son prochain tour » tombent.
export function knExpireCreatureTurnEffects(run: KnRun, index: number): KnRun {
  return withCreature(run, index, c => c.effects?.some(effect => effect.untilTurn) ? withEffects(c, c.effects.filter(effect => !effect.untilTurn)) : c)
}

// Les effets à usage unique tombent une fois la créature servie d'eux.
export function knConsumeCreatureEffects(run: KnRun, index: number): KnRun {
  return withCreature(run, index, c => c.effects?.some(effect => effect.once) ? withEffects(c, c.effects.filter(effect => !effect.once)) : c)
}

// Sa Santé temporaire disparaît quand son terme arrive : au prochain tour de la créature, ou à la fin du round.
export function knExpireCombatTemporary(run: KnRun, term: 'turn' | 'round', index?: number): KnRun {
  if (!run.combat) return run
  const expires = (c: KnCombatCreature, i: number) =>
    c.temporaryUntil === term && (term === 'round' || i === index)
  return { ...run, combat: { ...run.combat, creatures: run.combat.creatures.map((c, i) => expires(c, i) ? withoutTemporary(c) : c) } }
}

export function knSetCombatFirst(run: KnRun, first: 'survivor' | 'creatures'): KnRun {
  return run.combat ? { ...run, combat: { ...run.combat, first } } : run
}

// Des pièces d'équipement ont servi (une armure qui a encaissé, un bouclier qui a paré) : leur Intégrité se jouera après le combat.
export function knMarkGearUsed(run: KnRun, ids: readonly string[]): KnRun {
  if (!run.combat || !ids.length) return run
  const used = [...new Set([...(run.combat.gearUsed ?? []), ...ids])]
  return { ...run, combat: { ...run.combat, gearUsed: used } }
}

// Le survivant vient de se défendre : la défense suivante du round coûtera plus cher.
export function knRegisterReaction(run: KnRun): KnRun {
  return run.combat ? { ...run, combat: { ...run.combat, reactions: Math.min(KN_COMBAT_BOUNDS.reactions.max, run.combat.reactions + 1) } } : run
}

export function knNextCombatRound(run: KnRun): KnRun {
  if (!run.combat) return run
  const { freeParryUsed: _used, ...combat } = run.combat
  return knVanishSpentCreatures(knAdvanceCreatureEffects(knExpireCombatTemporary({ ...run, combat: { ...combat, round: Math.min(KN_COMBAT_BOUNDS.round.max, run.combat.round + 1), reactions: 0 } }, 'round')))
}

// La Parade gratuite du combat à deux armes ne compte pas parmi les Réactions du round, une fois par round.
export const knUseFreeParry = (run: KnRun): KnRun => run.combat ? { ...run, combat: { ...run.combat, freeParryUsed: true } } : run

export function knSetCombatDual(run: KnRun, dominant: string | null): KnRun {
  if (!run.combat) return run
  const { dual: _previous, ...rest } = run.combat
  return { ...run, combat: dominant ? { ...rest, dual: dominant } : rest }
}

export function knSetCombatSurprise(run: KnRun, surprise: boolean): KnRun {
  if (!run.combat) return run
  const { surprise: _previous, ...rest } = run.combat
  return { ...run, combat: surprise ? { ...rest, surprise } : rest }
}
