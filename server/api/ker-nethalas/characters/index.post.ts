import { db } from '~~/server/utils/db'
import { getKnContent } from '~~/server/utils/knContent'
import { createKnCharacter } from '~~/server/utils/knCharacters'
import { knCreationSchema } from '~~/shared/ker-nethalas/creation'
import { knMasteryPickIssues, type KnMastery } from '~~/shared/ker-nethalas/masteries'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const result = await readValidatedBody(event, knCreationSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const masteries = await getKnContent(db, 'masteries') as KnMastery[] | null
  const issues = knMasteryPickIssues(result.data.masteries, masteries?.map(mastery => mastery.key) ?? null)
  if (issues.length) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid masteries', data: issues })
  }

  const created = await createKnCharacter(db, user.id, result.data)
  setResponseStatus(event, 201)
  return created
})
