import * as seed from '../db/seeds'

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
    await seed.spells()

    return { result: 'success' }
  },
})
