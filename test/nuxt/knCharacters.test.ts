import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import {
  createKnCharacter,
  deleteKnCharacter,
  getKnCharacter,
  listKnCharacters,
  updateKnCharacter,
} from '../../server/utils/knCharacters'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { defaultKnResistances, defaultKnSkills } from '../../shared/ker-nethalas/character'
import { emptyKnDomain, emptyKnRun } from '../../shared/ker-nethalas/run'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { replayMigrations } from '../fixtures/migrations'

// Le CRUD est testé contre libsql, sans la barrière d'auth (DI du `db`). Les clés étrangères sont
// activées : la suppression d'un compte doit emporter ses survivants.

let client: Client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let alice: number
let bob: number

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client)
  await client.execute('PRAGMA foreign_keys = ON')
  db = drizzle(client, { schema })

  const users = await db
    .insert(schema.users)
    .values([
      { provider: 'discord', providerUserId: 'alice', name: 'Alice' },
      { provider: 'discord', providerUserId: 'bob', name: 'Bob' },
    ])
    .returning({ id: schema.users.id })
  alice = users[0].id
  bob = users[1].id
})

describe('createKnCharacter', () => {
  it('crée un survivant avec les valeurs de départ', async () => {
    const { id } = await createKnCharacter(db, alice, { name: 'Arathos' })
    const character = await getKnCharacter(db, id)

    expect(character).toMatchObject({
      ownerId: alice,
      name: 'Arathos',
      level: 1,
      xp: 0,
      exhaustion: 0,
      damageModifier: 0,
      healthCurrent: 0,
      extraSkills: [],
      masteries: '',
      perks: '',
      weapons: '',
      damageAffinities: '',
      equipment: '',
      notes: '',
    })
    expect(character!.status).toEqual(emptyKnStatus())
    expect(character!.skills).toEqual(defaultKnSkills())
    expect(character!.resistances).toEqual(defaultKnResistances())
    expect(character!.createdAt).toBeTruthy()
    expect(character!.updatedAt).toBeNull()
  })
})

describe('listKnCharacters', () => {
  it('ne renvoie que les survivants du propriétaire, dans l\'ordre de création', async () => {
    const first = await createKnCharacter(db, bob, { name: 'Bob 1' })
    const second = await createKnCharacter(db, bob, { name: 'Bob 2' })

    const list = await listKnCharacters(db, bob)

    expect(list.map(c => c.id)).toEqual([first.id, second.id])
    expect(list.every(c => c.ownerId === bob)).toBe(true)
  })
})

describe('updateKnCharacter', () => {
  it('ne modifie que les champs fournis et date la mise à jour', async () => {
    const { id } = await createKnCharacter(db, alice, { name: 'Erthos' })

    const updated = await updateKnCharacter(db, id, { healthCurrent: 14, healthMax: 15, notes: 'Piste de la salle 3' })

    expect(updated).toMatchObject({ name: 'Erthos', healthCurrent: 14, healthMax: 15, notes: 'Piste de la salle 3', level: 1 })
    expect(updated!.updatedAt).toBeTruthy()
  })

  it('relit à l\'identique les compétences et résistances modifiées', async () => {
    const { id } = await createKnCharacter(db, alice, { name: 'Jera' })
    const skills = defaultKnSkills()
    skills.dodge = { score: 55, marked: true }
    const resistances = { ...defaultKnResistances(), resolve: 40 }
    const extraSkills = [{ name: 'Chant', score: 30, marked: false }]

    await updateKnCharacter(db, id, { skills, resistances, extraSkills })
    const character = await getKnCharacter(db, id)

    expect(character!.skills.dodge).toEqual({ score: 55, marked: true })
    expect(character!.resistances.resolve).toBe(40)
    expect(character!.extraSkills).toEqual(extraSkills)
  })

  it('relit à l\'identique l\'état en cours', async () => {
    const { id } = await createKnCharacter(db, alice, { name: 'Xara' })
    const status = {
      ...emptyKnStatus(),
      conditions: [{ key: 'frightened' as const, value: 30 }],
      rotStage: 2,
      madness: { ...emptyKnStatus().madness, lostSkills: [{ skill: 'reason' as const }, {}] },
      custom: [{ id: 'c1', name: 'Bénédiction', active: true, entries: [{ kind: 'advantage' as const, target: 'dodge' as const }] }],
    }

    await updateKnCharacter(db, id, { status })

    expect((await getKnCharacter(db, id))!.status).toEqual(status)
  })

  it('donne un run vide à un nouveau survivant et le relit à l\'identique', async () => {
    const { id } = await createKnCharacter(db, alice, { name: 'Brisa' })
    expect((await getKnCharacter(db, id))!.run).toEqual(emptyKnRun())

    const run = {
      domains: [
        {
          ...emptyKnDomain(1),
          name: 'Les caves',
          rooms: 7,
          lairDie: 4 as const,
          lairFound: true,
          overseerInfluences: ['skilled' as const, 'piercing' as const, 'piercing' as const],
          growingDarkness: [{ key: 'gd_57_58' as const, skill: 'stealth' as const }],
          visits: [
            {
              kind: 'room' as const,
              usageKind: 'lair' as const,
              tension: { die: 4 as const, roll: 1, manual: true, next: 8 as const, triggered: true },
              usage: { die: 4 as const, roll: 2, manual: false, next: 4 as const, triggered: true },
              darkness: { roll: 90, entry: { key: 'gd_81_100' as const }, influence: { roll: 4, key: 'skilled' as const } },
            },
            { kind: 'revisit' as const, usageKind: null },
          ],
        },
        emptyKnDomain(2),
      ],
      current: 1,
      tensionDie: 6 as const,
      lightRemaining: 11,
    }

    await updateKnCharacter(db, id, { run })

    expect((await getKnCharacter(db, id))!.run).toEqual(run)
  })

  it('donne des provisions vides à un nouveau survivant et les relit à l\'identique', async () => {
    const { id } = await createKnCharacter(db, alice, { name: 'Kessa' })
    expect((await getKnCharacter(db, id))!.provisions).toEqual(emptyKnProvisions())

    const provisions = { ...emptyKnProvisions(), rations: 3, craftingSupplies: 12, attunementCrystals: 1 }
    await updateKnCharacter(db, id, { provisions })

    expect((await getKnCharacter(db, id))!.provisions).toEqual(provisions)
  })

  it('renvoie null pour un survivant inexistant', async () => {
    expect(await updateKnCharacter(db, 999999, { notes: 'x' })).toBeNull()
  })
})

describe('suppression', () => {
  it('supprime un survivant sans toucher aux autres', async () => {
    const keep = await createKnCharacter(db, alice, { name: 'Gardé' })
    const drop = await createKnCharacter(db, alice, { name: 'Supprimé' })

    await deleteKnCharacter(db, drop.id)

    expect(await getKnCharacter(db, drop.id)).toBeNull()
    expect(await getKnCharacter(db, keep.id)).not.toBeNull()
  })

  it('emporte les survivants avec leur compte', async () => {
    const [temp] = await db
      .insert(schema.users)
      .values({ provider: 'google', providerUserId: 'temp', name: 'Temp' })
      .returning({ id: schema.users.id })
    await createKnCharacter(db, temp.id, { name: 'Orphelin' })

    await db.delete(schema.users).where(eq(schema.users.id, temp.id))

    expect(await listKnCharacters(db, temp.id)).toEqual([])
  })
})
