import { z } from 'zod'
import { boundedInt } from './zodHelpers'

// `count` dés à `sides` faces plus `bonus` ; un montant fixe s'écrit sans dé (`count` 0).
export const knDiceSchema = z.object({
  count: boundedInt({ min: 0, max: 20 }),
  sides: boundedInt({ min: 0, max: 100 }),
  bonus: boundedInt({ min: -99, max: 99 }),
}).refine(dice => dice.count === 0 || dice.sides >= 2, { message: 'un dé a au moins deux faces' })

export type KnDice = z.infer<typeof knDiceSchema>
