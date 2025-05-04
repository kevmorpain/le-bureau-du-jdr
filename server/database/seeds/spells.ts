import * as schema from '../schema'
import type { SpellComponent } from '../schema/spells'
import spells from './data/spells.json'

async function getSchoolId(schoolName: string) {
  const school = await useDrizzle().query.magicSchools.findFirst({
    where: eq(schema.magicSchools.name, schoolName),
  })
  if (!school) {
    throw new Error('Unknown school name: ' + schoolName)
  }
  return school.id
}

export default async function seed() {
  spells.forEach(async ({ school, ...spell }) => {
    await useDrizzle().insert(tables.spells).values({
      ...spell,
      components: spell.components as SpellComponent[],
      schoolId: await getSchoolId(school),
    })
  })
}
