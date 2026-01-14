import { db, schema } from 'hub:db'
import { classesData } from './data/classes'

export default async function seed() {
  classesData.forEach(async (cls) => {
    await db.insert(schema.classes).values(cls)
  })
}
