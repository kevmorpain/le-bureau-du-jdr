import { db } from 'hub:db'
import { seedElfLineages } from './lib/seedElfLineages'

export default function seed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return seedElfLineages(db as any)
}
