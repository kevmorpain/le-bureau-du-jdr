import { describe, it, expect } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { emptyKnDomain, emptyKnRun, knRunSchema } from '../../shared/ker-nethalas/run'
import { emptyKnStatus, knStatusSchema } from '../../shared/ker-nethalas/status'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Un survivant créé avant ces migrations doit finir avec un état en cours valide, quelle que soit sa forme d'origine.
// Le DEFAULT SQL de 0131 recopie `emptyKnStatus()` à la main : 0132 le met à la forme actuelle, donc il dérive
// silencieusement si l'un des deux change sans l'autre.

const STATUS = '0131_ker_nethalas_status.sql'
const STATUS_SHAPE = '0132_ker_nethalas_status_shape.sql'
const EQUIPMENT = '0133_ker_nethalas_equipment_texts.sql'
const RUN = '0134_ker_nethalas_run.sql'

async function clientBefore(migration: string): Promise<Client> {
  const client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: migration })
  await client.execute(`INSERT INTO users (provider, provider_user_id, name) VALUES ('discord', 'legacy', 'Legacy')`)
  return client
}

const statusOf = async (client: Client, name: string) => {
  const { rows } = await client.execute({ sql: 'SELECT status FROM kn_characters WHERE name = ?', args: [name] })
  return JSON.parse(rows[0]!.status as string)
}

const runOf = async (client: Client, name: string) => {
  const { rows } = await client.execute({ sql: 'SELECT run FROM kn_characters WHERE name = ?', args: [name] })
  return JSON.parse(rows[0]!.run as string)
}

describe('migration 0131 puis 0132 (état en cours des survivants)', () => {
  it('donne un état vide valide aux survivants antérieurs à la colonne', async () => {
    const client = await clientBefore(STATUS)
    await client.execute(`INSERT INTO kn_characters (owner_id, name, resistances, skills) VALUES (1, 'Ancien', '{}', '{}')`)

    await applyMigration(client, STATUS)
    await applyMigration(client, STATUS_SHAPE)
    await applyMigration(client, RUN)

    const status = await statusOf(client, 'Ancien')
    expect(status).toEqual(emptyKnStatus())
    expect(knStatusSchema.safeParse(status).success).toBe(true)
    expect(await runOf(client, 'Ancien')).toEqual(emptyKnRun())
  })
})

describe('migration 0132 (forme de l\'état en cours)', () => {
  const legacy = (overseerInfluence: string | null, lostSkills: string[]) => JSON.stringify({
    conditions: [{ key: 'prone' }],
    rotStage: 2,
    madness: { counters: { ...emptyKnStatus().madness.counters, rushing: 3 }, lostSkills },
    domain: { overseerInfluence, growingDarkness: [{ key: 'gd_73_74' }] },
    custom: [],
  })

  it('convertit l\'influence unique en liste et les compétences perdues en objets, sans toucher au reste', async () => {
    const client = await clientBefore(STATUS_SHAPE)
    await client.execute({
      sql: `INSERT INTO kn_characters (owner_id, name, resistances, skills, status) VALUES (1, 'Avec', '{}', '{}', ?)`,
      args: [legacy('skilled', ['reason', 'dodge'])],
    })
    await client.execute({
      sql: `INSERT INTO kn_characters (owner_id, name, resistances, skills, status) VALUES (1, 'Sans', '{}', '{}', ?)`,
      args: [legacy(null, [])],
    })

    await applyMigration(client, STATUS_SHAPE)

    const avec = await statusOf(client, 'Avec')
    expect(avec.domain.overseerInfluences).toEqual(['skilled'])
    expect(avec.domain).not.toHaveProperty('overseerInfluence')
    expect(avec.madness.lostSkills).toEqual([{ skill: 'reason' }, { skill: 'dodge' }])
    expect(avec.madness.counters.rushing).toBe(3)
    expect(avec.rotStage).toBe(2)
    expect(avec.conditions).toEqual([{ key: 'prone' }])
    expect(avec.domain.growingDarkness).toEqual([{ key: 'gd_73_74' }])
    expect(knStatusSchema.safeParse(avec).success).toBe(true)

    const sans = await statusOf(client, 'Sans')
    expect(sans.domain.overseerInfluences).toEqual([])
    expect(sans.madness.lostSkills).toEqual([])
    expect(knStatusSchema.safeParse(sans).success).toBe(true)
  })
})

describe('migration 0134 (état du run)', () => {
  const legacy = JSON.stringify({
    ...emptyKnStatus(),
    domain: { overseerInfluences: ['skilled', 'piercing'], growingDarkness: [{ key: 'gd_57_58', skill: 'stealth' }, { key: 'gd_73_74' }] },
  })

  it('range le Domaine courant de l\'état en cours dans le premier Domaine du run', async () => {
    const client = await clientBefore(RUN)
    await client.execute({
      sql: `INSERT INTO kn_characters (owner_id, name, resistances, skills, status) VALUES (1, 'Danel', '{}', '{}', ?)`,
      args: [legacy],
    })

    await applyMigration(client, RUN)

    const run = await runOf(client, 'Danel')
    expect(run.domains).toHaveLength(1)
    expect(run.domains[0]).toEqual({
      ...emptyKnDomain(1),
      overseerInfluences: ['skilled', 'piercing'],
      growingDarkness: [{ key: 'gd_57_58', skill: 'stealth' }, { key: 'gd_73_74' }],
    })
    expect(run).toMatchObject({ current: 0, tensionDie: 8, lightRemaining: 20 })
    expect(knRunSchema.safeParse(run).success).toBe(true)

    const status = await statusOf(client, 'Danel')
    expect(status).not.toHaveProperty('domain')
    expect(knStatusSchema.safeParse(status).success).toBe(true)
  })
})

describe('migration 0133 (zones de texte)', () => {
  it('donne des textes vides aux survivants existants', async () => {
    const client = await clientBefore(EQUIPMENT)
    await client.execute(`INSERT INTO kn_characters (owner_id, name, resistances, skills) VALUES (1, 'Ancien', '{}', '{}')`)

    await applyMigration(client, EQUIPMENT)

    const { rows } = await client.execute(`SELECT weapons, damage_affinities, equipment FROM kn_characters WHERE name = 'Ancien'`)
    expect(rows[0]).toMatchObject({ weapons: '', damage_affinities: '', equipment: '' })
  })
})
