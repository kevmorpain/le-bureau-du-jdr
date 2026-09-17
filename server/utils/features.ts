import { isNull } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

// Les features-options (tag non nul) ne sont jamais attribuées d'office : seulement si choisies.
export const isPassiveGrant = () => isNull(schema.features.tag)
