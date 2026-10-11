import { describe, it, expect } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { emptyKnProvisions, knProvisionsSchema } from '../../shared/ker-nethalas/camp'
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
const PROVISIONS = '0135_ker_nethalas_provisions.sql'
const RITUAL_COMPONENTS = '0142_ker_nethalas_ritual_components.sql'

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

describe('migration 0135 (provisions)', () => {
  it('donne des provisions vides, identiques à emptyKnProvisions(), aux survivants existants', async () => {
    const client = await clientBefore(PROVISIONS)
    await client.execute(`INSERT INTO kn_characters (owner_id, name, resistances, skills) VALUES (1, 'Ancien', '{}', '{}')`)

    await applyMigration(client, PROVISIONS)
    await applyMigration(client, RITUAL_COMPONENTS)

    const { rows } = await client.execute(`SELECT provisions FROM kn_characters WHERE name = 'Ancien'`)
    const provisions = JSON.parse(rows[0]!.provisions as string)
    expect(provisions).toEqual(emptyKnProvisions())
    expect(knProvisionsSchema.safeParse(provisions).success).toBe(true)
  })
})

describe('migration 0142 (composants rituels)', () => {
  it('ajoute les composants rituels aux provisions existantes sans toucher aux autres', async () => {
    const client = await clientBefore(RITUAL_COMPONENTS)
    const before = { rations: 3, bandages: 1, craftingSupplies: 12, cookingIngredients: 0, lampOil: 0, lockpicks: 0, torches: 1, attunementCrystals: 2 }
    await client.execute({
      sql: `INSERT INTO kn_characters (owner_id, name, resistances, skills, provisions) VALUES (1, 'Existant', '{}', '{}', ?)`,
      args: [JSON.stringify(before)],
    })
    await client.execute({
      sql: `INSERT INTO kn_characters (owner_id, name, resistances, skills, provisions) VALUES (1, 'Déjà à jour', '{}', '{}', ?)`,
      args: [JSON.stringify({ ...before, ritualComponents: 4 })],
    })

    await applyMigration(client, RITUAL_COMPONENTS)

    const read = async (name: string) => {
      const { rows } = await client.execute({ sql: 'SELECT provisions FROM kn_characters WHERE name = ?', args: [name] })
      return JSON.parse(rows[0]!.provisions as string)
    }
    expect(await read('Existant')).toEqual({ ...before, ritualComponents: 0 })
    expect(knProvisionsSchema.safeParse(await read('Existant')).success).toBe(true)
    expect((await read('Déjà à jour')).ritualComponents).toBe(4)
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
