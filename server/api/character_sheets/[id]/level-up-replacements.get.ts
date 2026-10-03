import { db } from '~~/server/utils/db'
import { levelUpReplacements } from '~~/server/utils/duplicateProficiencies'

export default defineEventHandler(async (event) => {
  const characterSheetId = Number(getRouterParam(event, 'id'))
  const joinedClassId = Number(getQuery(event).classId)
  if (!characterSheetId || !joinedClassId) throw createError({ statusCode: 400, statusMessage: 'id et classId requis' })
  return await levelUpReplacements(db, characterSheetId, joinedClassId)
})
