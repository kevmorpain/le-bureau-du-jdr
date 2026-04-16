import * as seed from '../db/seeds'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    console.log('Running DB seed task...')

    // Étape 1 : données de base (peuvent tourner en parallèle)
    await Promise.all([
      // seed.abilityScores(),
      // seed.damageTypes(),
      // seed.magicSchools(),
      // seed.characterSpecies(),
      // seed.classes(),
    ])

    // Étape 2 : features de classe (nécessite classes)
    await seed.warlock()

    // Étape 3 : fiches de personnage (nécessite warlock pour les character_features)
    // await seed.spells()
    await seed.characterSheets()

    return { result: 'success' }
  },
})
