import { db } from '~~/server/utils/db'
import { seedElfLineages } from './lib/seedElfLineages'

export default function seed() {
  return seedElfLineages(db)
}
