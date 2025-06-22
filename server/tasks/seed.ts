import * as seed from '../database/seeds'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    console.log('Running DB seed task...')

    await Promise.all([
      seed.abilityScores(),
      seed.damageTypes(),
      seed.magicSchools(),
    ])
    await seed.spells() // needs magicSchools to be seeded first

    return { result: 'success' }
  },
})
