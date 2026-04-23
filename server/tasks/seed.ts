import * as _seed from '../db/seeds'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    console.log('Running DB seed task...')

    // Étape 1 : données de base (peuvent tourner en parallèle)
    await Promise.all([
      // _seed.abilityScores(),
      // _seed.damageTypes(),
      // _seed.magicSchools(),
      // _seed.characterSpecies(),
      // _seed.classes(),
    ])

    // Étape 2 : features de classe (nécessite classes)
    // await _seed.warlock()

    // Étape 3 : fiches de personnage (nécessite warlock pour les character_features)
    // await _seed.spells()
    // await _seed.characterSheets()
    // await _seed.items()

    return { result: 'success' }
  },
})
