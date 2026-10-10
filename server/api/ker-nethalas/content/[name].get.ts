import { db } from '~~/server/utils/db'
import { getKnContent } from '~~/server/utils/knContent'

// La session est exigée par le middleware `ker-nethalas-authz` ; le contenu est le même pour tous les comptes.
export default defineEventHandler(async (event) => {
  const content = await getKnContent(db, getRouterParam(event, 'name') ?? '')
  if (content === null) throw createError({ statusCode: 404, statusMessage: 'Content set not loaded' })

  return content
})
