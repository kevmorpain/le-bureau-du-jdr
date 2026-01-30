import * as seed from '../db/seeds'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    console.log('Running DB seed task...')

    await Promise.all([
      // seed.abilityScores(),
      // seed.damageTypes(),
      // seed.magicSchools(),
      seed.characterSpecies(),
      // seed.classes(),
    ])
    // await seed.spells()
    // await seed.characterSheets()

    return { result: 'success' }
  },
})
