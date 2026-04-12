import { db, schema } from 'hub:db'

interface SkillInput {
  skillKey: string
  proficiencyLevel: 'none' | 'proficient' | 'expert'
  source: 'class' | 'species' | 'background' | 'feat' | 'manual'
  isOverride?: boolean
}

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  const skills = await readBody<SkillInput[]>(event)

  if (!id || !Array.isArray(skills)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .insert(schema.characterSkills)
    .values(skills.map(s => ({
      characterSheetId,
      skillKey: s.skillKey,
      proficiencyLevel: s.proficiencyLevel,
      source: s.source,
      isOverride: s.isOverride ?? false,
    })))
    .onConflictDoUpdate({
      target: [
        schema.characterSkills.characterSheetId,
        schema.characterSkills.skillKey,
        schema.characterSkills.source,
      ],
      set: {
        proficiencyLevel: sql`excluded.proficiency_level`,
        isOverride: sql`excluded.is_override`,
      },
    })

  return { success: true }
})
