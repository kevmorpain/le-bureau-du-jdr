import type { RechargeType } from '~~/server/db/schema/features'

export const REST_TYPES = ['short', 'long', 'dawn'] as const
export type RestType = typeof REST_TYPES[number]

export const REST_RECHARGE_MAP: Record<RestType, RechargeType[]> = {
  short: ['short_rest'],
  long: ['short_rest', 'long_rest'],
  dawn: ['dawn'],
}
