import { runSeeds } from '../db/seeds/run'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seed task',
  },
  async run() {
    return runSeeds()
  },
})
