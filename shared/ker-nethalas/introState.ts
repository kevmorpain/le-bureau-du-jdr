import { z } from 'zod'
import { boundedInt } from './zodHelpers'

export const KN_FIRST_DOMAIN_ROOMS = 8

// L'état du Domaine d'introduction, quand le Domaine en est un : les Débuts difficiles déjà subis, les salles dont le contenu a été pris,
// et la sortie franchie (on ne revient pas dans ce Domaine).
export const knIntroSchema = z.object({
  awakened: z.boolean(),
  taken: z.array(boundedInt({ min: 1, max: KN_FIRST_DOMAIN_ROOMS })).max(KN_FIRST_DOMAIN_ROOMS),
  left: z.boolean().optional(),
})

export type KnIntro = z.infer<typeof knIntroSchema>

export const emptyKnIntro = (): KnIntro => ({ awakened: false, taken: [] })
