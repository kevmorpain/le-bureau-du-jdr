import type { H3Event } from 'h3'
import { parseKnCharacterId } from '~~/server/utils/knPaths'

export function requireKnCharacterId(event: H3Event): number {
  const id = parseKnCharacterId(getRouterParam(event, 'id'))
  if (id === null) throw createError({ statusCode: 400, statusMessage: 'Invalid character id' })
  return id
}
