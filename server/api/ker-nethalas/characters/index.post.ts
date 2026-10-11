import { db } from '~~/server/utils/db'
import { getKnContent } from '~~/server/utils/knContent'
import { createKnCharacter } from '~~/server/utils/knCharacters'
import { knCreationSchema } from '~~/shared/ker-nethalas/creation'
import { knGoalPickIssues, type KnPersonalGoal } from '~~/shared/ker-nethalas/goals'
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

  const goals = await getKnContent(db, 'personalGoals') as KnPersonalGoal[] | null
  const goalIssues = knGoalPickIssues(result.data.goals, goals?.map(goal => goal.key) ?? null)
  if (goalIssues.length) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid personal goals', data: goalIssues })
  }

  const created = await createKnCharacter(db, user.id, result.data)
  setResponseStatus(event, 201)
  return created
})
