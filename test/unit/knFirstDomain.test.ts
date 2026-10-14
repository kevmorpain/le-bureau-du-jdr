import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import { knCreationSchema } from '../../shared/ker-nethalas/creation'
import {
  KN_HARD_BEGINNINGS,
  knApplyRoomItems,
  knAwaken,
  knFirstDomainContentSchema,
  knGrantLight,
  knIntroRun,
  knIntroState,
  knLeaveFirstDomain,
  knReturnableDomains,
  knRoomTaken,
  knTakeRoom,
  type KnFirstDomainRoom,
} from '../../shared/ker-nethalas/firstDomain'
import type { KnCatalogItem } from '../../shared/ker-nethalas/items'
import { emptyKnRun, knAddDoorObstacle, knCurrentDomain, knCurrentVisit, knRunSchema, knStartVisit, knVisitCanHaveEncounter, knVisitCanHaveEvent } from '../../shared/ker-nethalas/run'
import { validKnCreation } from '../fixtures/knCreation'

const rooms = (): KnFirstDomainRoom[] => Array.from({ length: 8 }, (_, index) => ({ number: index + 1, name: `Salle ${index + 1}`, text: 'Texte.' }))

describe('Domaine d\'introduction', () => {
  it('le run d\'introduction n\'a ni Repaire ni Sortie à suivre, et pas de lumière avant la torche', () => {
    const run = knIntroRun()
    const domain = knCurrentDomain(run)

    expect(domain.name).toBe('Domaine d\'introduction')
    expect(domain).toMatchObject({ lairFound: true, exitFound: true, intro: { awakened: false, taken: [] } })
    expect(run.lightRemaining).toBe(0)
    expect(knRunSchema.safeParse(run).success).toBe(true)
    expect(knCurrentVisit(knStartVisit(run, 'room'))?.usageKind).toBeNull()
  })

  it('on prend le contenu d\'une salle une seule fois, et on se réveille une seule fois', () => {
    const taken = knTakeRoom(knTakeRoom(knIntroRun(), 2), 2)

    expect(knIntroState(taken)?.taken).toEqual([2])
    expect(knRoomTaken(taken, 2)).toBe(true)
    expect(knRoomTaken(taken, 3)).toBe(false)
    expect(knIntroState(knAwaken(taken))).toMatchObject({ awakened: true, taken: [2] })
    const ordinary = emptyKnRun()
    expect(knTakeRoom(ordinary, 1)).toBe(ordinary)
    expect(knAwaken(ordinary)).toBe(ordinary)
  })

  it('la torche éclaire pour dix salles sans retirer de la lumière déjà là', () => {
    expect(knGrantLight(knIntroRun(), 10).lightRemaining).toBe(10)
    expect(knGrantLight({ ...knIntroRun(), lightRemaining: 15 }, 10).lightRemaining).toBe(15)
  })

  it('la sortie ouvre le Domaine suivant et ferme celui-ci pour de bon', () => {
    const left = knLeaveFirstDomain(knIntroRun())

    expect(left.domains).toHaveLength(2)
    expect(left.current).toBe(1)
    expect(left.domains[0]!.intro?.left).toBe(true)
    expect(left.domains[1]!.intro).toBeUndefined()
    expect(knReturnableDomains(left)).toEqual([1])
    expect(knReturnableDomains(knIntroRun())).toEqual([0])
    expect(knRunSchema.safeParse(left).success).toBe(true)
    const ordinary = emptyKnRun()
    expect(knLeaveFirstDomain(ordinary)).toBe(ordinary)
  })

  it('toutes les portes sont sur la carte : on les vérifie sans tirer le D10', () => {
    const intro = knStartVisit(knIntroRun(), 'room')
    const ordinary = knStartVisit(emptyKnRun(), 'room')

    expect(knCurrentVisit(knAddDoorObstacle(intro))?.obstacles).toEqual([{ kind: 'door' }])
    expect(knCurrentVisit(knAddDoorObstacle(ordinary))?.obstacles).toBeUndefined()
    expect(knCurrentVisit(knAddDoorObstacle(knStartVisit(knIntroRun(), 'revisit')))?.obstacles).toBeUndefined()
  })
})

describe('Débuts difficiles', () => {
  it('D6 dégâts, D4 Santé mentale perdue et +1 Épuisement', () => {
    expect(KN_HARD_BEGINNINGS.map(effect => effect.kind)).toEqual(['damage', 'vital', 'exhaustion'])
    expect(KN_HARD_BEGINNINGS[0]).toMatchObject({ dice: { count: 1, sides: 6 } })
    expect(KN_HARD_BEGINNINGS[1]).toMatchObject({ vital: 'sanity', sign: 'loss', dice: { count: 1, sides: 4 } })
    expect(KN_HARD_BEGINNINGS[2]).toMatchObject({ sign: 'gain', dice: { bonus: 1 } })
  })
})

describe('contenu des salles', () => {
  const catalog: KnCatalogItem[] = [
    { key: 'dagger', name: 'Dague', kind: 'weapon', weight: 'normal', value: 5, weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'piercing', traits: [] } },
    { key: 'candle', name: 'Bougie', kind: 'gear', weight: 'light', value: 1 },
    { key: 'crystal', name: 'Cristal', kind: 'gear', weight: 'light', value: 10, provision: 'attunementCrystals' },
  ]
  const state = () => ({ inventory: [], provisions: emptyKnProvisions() })
  const die = (result: number, sides: number) => () => (result - 0.5) / sides

  it('un objet du catalogue entre dans l\'inventaire, le nombre tiré compte', () => {
    const { state: next, lines } = knApplyRoomItems(state(), [{ ref: 'dagger' }, { ref: 'candle', count: { count: 1, sides: 4, bonus: 0 } }], catalog, die(3, 4))

    expect(next.inventory.map(item => item.name)).toEqual(['Dague', 'Bougie', 'Bougie', 'Bougie'])
    expect(lines).toHaveLength(4)
  })

  it('une provision du catalogue va aux provisions', () => {
    const { state: next } = knApplyRoomItems(state(), [{ ref: 'crystal', count: { count: 0, sides: 0, bonus: 3 } }], catalog)

    expect(next.provisions.attunementCrystals).toBe(3)
    expect(next.inventory).toEqual([])
  })

  it('un objet absent du catalogue est signalé, pas ajouté', () => {
    const { state: next, lines } = knApplyRoomItems(state(), [{ ref: 'inconnu' }], catalog)

    expect(next.inventory).toEqual([])
    expect(lines[0]).toContain('absent du catalogue')
  })

  it('huit salles numérotées de 1 à 8, une fois chacune', () => {
    expect(knFirstDomainContentSchema.safeParse(rooms()).success).toBe(true)
    expect(knFirstDomainContentSchema.safeParse(rooms().slice(1)).success).toBe(false)
    expect(knFirstDomainContentSchema.safeParse(rooms().map(room => ({ ...room, number: 1 }))).success).toBe(false)
    const withGrants = rooms().map(room => room.number === 6
      ? { ...room, choir: { damage: { count: 1, sides: 4, bonus: 0 }, loot: 'spoils' }, grants: { light: 10, items: [{ ref: 'candle' }], effects: [], loot: ['armor'] } }
      : room)
    expect(knFirstDomainContentSchema.safeParse(withGrants).success).toBe(true)
  })
})

describe('création et contenu', () => {
  it('le Domaine d\'introduction se choisit à la création, désactivé par défaut', () => {
    const { intro: _intro, ...withoutIntro } = validKnCreation('X')

    expect(knCreationSchema.parse(withoutIntro).intro).toBe(false)
    expect(knCreationSchema.parse({ ...withoutIntro, intro: true }).intro).toBe(true)
  })

  it('les deux jeux de données du premier Domaine sont connus du registre', () => {
    expect(Object.keys(KN_CONTENT_SCHEMAS)).toEqual(expect.arrayContaining(['firstDomain', 'encountersFirstDomain']))
  })
})

describe('règles de rencontre et d\'événement par salle', () => {
  const entered = (intro?: { room: number, noEncounter?: boolean, noEvent?: boolean }) => knCurrentVisit(knStartVisit(knIntroRun(), 'room', undefined, intro))!

  it('une salle sans mention ordinaire : rencontre de combat, puis événement s\'il n\'y en a pas', () => {
    const visit = entered({ room: 5 })

    expect(visit.introRoom).toBe(5)
    expect(visit.noEncounter).toBeUndefined()
    expect(knVisitCanHaveEncounter(visit)).toBe(true)
    expect(knVisitCanHaveEvent({ ...visit, encounter: { roll: 3, triggered: false } })).toBe(true)
  })

  it('« ni rencontre de combat ni événement » : ni l\'un ni l\'autre', () => {
    const visit = entered({ room: 1, noEncounter: true })

    expect(visit).toMatchObject({ noEncounter: true, noEvent: true })
    expect(knVisitCanHaveEncounter(visit)).toBe(false)
    expect(knVisitCanHaveEvent({ ...visit, encounter: { roll: 3, triggered: false } })).toBe(false)
  })

  it('« pas d\'événement, même sans adversaire » : la rencontre se teste, pas d\'événement', () => {
    const visit = entered({ room: 3, noEvent: true })

    expect(visit.noEncounter).toBeUndefined()
    expect(knVisitCanHaveEncounter(visit)).toBe(true)
    expect(knVisitCanHaveEvent({ ...visit, encounter: { roll: 3, triggered: false } })).toBe(false)
  })

  it('une entrée de retour ou sans salle liée ne change rien à la règle ordinaire', () => {
    const ordinary = knCurrentVisit(knStartVisit(emptyKnRun(), 'room'))!

    expect(ordinary.introRoom).toBeUndefined()
    expect(knVisitCanHaveEncounter(ordinary)).toBe(true)
    expect(knRunSchema.safeParse(knStartVisit(knIntroRun(), 'room', undefined, { room: 2, noEncounter: true })).success).toBe(true)
  })

  it('le jeu de données peut exclure la rencontre ou l\'événement d\'une salle', () => {
    const content = rooms().map(room => room.number === 1 ? { ...room, noEncounter: true } : room.number === 3 ? { ...room, noEvent: true } : room)

    expect(knFirstDomainContentSchema.safeParse(content).success).toBe(true)
  })
})
