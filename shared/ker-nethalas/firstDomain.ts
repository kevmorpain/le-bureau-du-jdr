import { z } from 'zod'
import { knRollDice } from './dice'
import { knDiceSchema } from './diceSchema'
import { emptyKnIntro, KN_FIRST_DOMAIN_ROOMS, type KnIntro } from './introState'
import type { KnCatalogItem } from './items'
import { KN_LOOT_TABLE_KEYS, knApplyLoot, type KnLootResult, type KnLootState } from './loot'
import {
  emptyKnDomain,
  emptyKnRun,
  knCurrentDomain,
  knNewDomain,
  type KnRng,
  type KnRun,
} from './run'
import { knTableEffectSchema, type KnTableEffect } from './tables'
import { boundedInt } from './zodHelpers'

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

export const KN_INTRO_DOMAIN_NAME = 'Domaine d\'introduction'

// Ce qu'une salle donne, une seule fois : de la lumière (la torche à demi usée), des objets du catalogue, des gains simples
// (provisions), et des tables de butin à tirer (l'armure aléatoire).
const knRoomGrantsSchema = z.object({
  light: boundedInt({ min: 1, max: 99 }).optional(),
  items: z.array(z.object({ ref: slug, count: knDiceSchema.optional() })).max(6).optional(),
  effects: z.array(knTableEffectSchema).max(6).optional(),
  loot: z.array(z.enum(KN_LOOT_TABLE_KEYS)).max(3).optional(),
})

export type KnRoomGrants = z.infer<typeof knRoomGrantsSchema>

export const knFirstDomainRoomSchema = z.object({
  number: boundedInt({ min: 1, max: KN_FIRST_DOMAIN_ROOMS }),
  name: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(1500),
  grants: knRoomGrantsSchema.optional(),
  // Une salle qui agresse à chaque entrée : un test de Résolution (échec : ces dégâts), puis un test de Raison pour la calmer,
  // qui ouvre un tirage sur cette table de butin.
  choir: z.object({ damage: knDiceSchema, loot: z.enum(KN_LOOT_TABLE_KEYS) }).optional(),
  // Ce que le livre exclut de la salle : pas de rencontre de combat (et donc pas d'événement), ou seulement pas d'événement.
  noEncounter: z.literal(true).optional(),
  noEvent: z.literal(true).optional(),
  overseer: z.literal(true).optional(),
  exit: z.literal(true).optional(),
})

export type KnFirstDomainRoom = z.infer<typeof knFirstDomainRoomSchema>

export const knFirstDomainContentSchema = z.array(knFirstDomainRoomSchema).length(KN_FIRST_DOMAIN_ROOMS).superRefine((rooms, ctx) => {
  const numbers = rooms.map(room => room.number).sort((a, b) => a - b)
  if (numbers.some((number, index) => number !== index + 1)) ctx.addIssue({ code: 'custom', message: 'les salles se numérotent de 1 à 8, une fois chacune' })
})

// Le survivant qui se réveille parmi les cadavres : D6 dégâts, D4 Santé mentale en moins, +1 Épuisement.
export const KN_HARD_BEGINNINGS: readonly KnTableEffect[] = [
  { kind: 'damage', dice: { count: 1, sides: 6, bonus: 0 } },
  { kind: 'vital', vital: 'sanity', dice: { count: 1, sides: 4, bonus: 0 }, sign: 'loss' },
  { kind: 'exhaustion', dice: { count: 0, sides: 0, bonus: 1 }, sign: 'gain' },
]

// Le Domaine d'introduction : la carte est fixe, il n'y a ni Repaire à trouver ni Sortie à suivre (elle est sur la carte).
export const knIntroDomain = () => ({ ...emptyKnDomain(1), name: KN_INTRO_DOMAIN_NAME, lairFound: true, exitFound: true, intro: emptyKnIntro() })

// Un run qui commence dans le Domaine d'introduction, sans autre lumière que la torche de la première salle.
export function knIntroRun(): KnRun {
  const run = emptyKnRun()
  return { ...run, domains: [knIntroDomain()], lightRemaining: 0 }
}

export const knIntroState = (run: KnRun) => knCurrentDomain(run).intro

const withIntro = (run: KnRun, update: (intro: KnIntro) => KnIntro): KnRun => {
  const intro = knIntroState(run)
  if (!intro) return run
  return { ...run, domains: run.domains.map((domain, index) => index === run.current ? { ...domain, intro: update(intro) } : domain) }
}

export const knRoomTaken = (run: KnRun, number: number): boolean => knIntroState(run)?.taken.includes(number) ?? false

export const knTakeRoom = (run: KnRun, number: number): KnRun =>
  withIntro(run, intro => intro.taken.includes(number) ? intro : { ...intro, taken: [...intro.taken, number] })

export const knAwaken = (run: KnRun): KnRun => withIntro(run, intro => ({ ...intro, awakened: true }))

// La torche de la première salle éclaire pour ce nombre de salles, sans jamais retirer de la lumière déjà là.
export const knGrantLight = (run: KnRun, rooms: number): KnRun => ({ ...run, lightRemaining: Math.max(run.lightRemaining, rooms) })

// La sortie du Domaine d'introduction : on passe au Domaine suivant, et on ne peut plus revenir dans celui-ci.
export function knLeaveFirstDomain(run: KnRun): KnRun {
  if (!knIntroState(run)) return run
  const left = withIntro(run, intro => ({ ...intro, left: true }))
  return knNewDomain(left)
}

// Les Domaines où l'on peut retourner : tous, sauf le Domaine d'introduction une fois quitté.
export const knReturnableDomains = (run: KnRun): number[] =>
  run.domains.flatMap((domain, index) => domain.intro?.left && index !== run.current ? [] : [index])

// Des objets du catalogue, avec leur nombre : ils entrent dans l'inventaire, ou dans les provisions pour ceux qui en sont.
export function knApplyRoomItems(
  state: KnLootState,
  items: readonly { ref: string, count?: z.infer<typeof knDiceSchema> }[],
  catalog: readonly KnCatalogItem[],
  rng: KnRng = Math.random,
): { state: KnLootState, lines: string[] } {
  let next = state
  const lines: string[] = []
  for (const { ref, count } of items) {
    const result: KnLootResult = {
      steps: [{ table: 'spoils', die: 1, roll: 1, text: ref }],
      drop: { kind: 'item', ref },
      count: count ? Math.max(1, knRollDice(count, rng).total) : 1,
      value: 0,
    }
    const applied = knApplyLoot(next, result, catalog)
    next = applied.state
    lines.push(...applied.lines)
  }
  return { state: next, lines }
}
