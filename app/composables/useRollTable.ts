import type { MaybeRefOrGetter } from 'vue'
import { rollTableEntryIndex, type RollTable } from '~~/shared/rules/rollTables'

// Two rolls stay highlighted: Controlled Chaos rolls twice, then picks one.
const KEPT_ROLLS = 2

export const useRollTable = (table: MaybeRefOrGetter<RollTable | null | undefined>, { silent = false } = {}) => {
  const { roll, rollsEnabled } = useDiceRoller()
  const rolls = ref<number[]>([])
  const entered = ref<number | null>(null)

  const entries = computed(() => toValue(table)?.entries ?? [])
  const latestIndex = computed(() => {
    const last = rolls.value.at(-1)
    return last === undefined ? -1 : rollTableEntryIndex(entries.value, last)
  })
  const previousIndex = computed(() =>
    rolls.value.length > 1 ? rollTableEntryIndex(entries.value, rolls.value[0]!) : -1)

  const record = (result: number) => {
    rolls.value = [...rolls.value, result].slice(-KEPT_ROLLS)
    return result
  }

  const rollOnTable = (): number | null => {
    const current = toValue(table)
    if (!current || !rollsEnabled.value) return null
    return record(roll(current.name, 0, current.die, 1, { silent }))
  }

  const isEntryValid = computed(() => {
    const die = toValue(table)?.die ?? 0
    return Number.isInteger(entered.value) && entered.value! >= 1 && entered.value! <= die
  })

  const enterRoll = (): number | null => {
    if (!isEntryValid.value) return null
    const result = record(entered.value!)
    entered.value = null
    return result
  }

  return { rolls, entered, latestIndex, previousIndex, rollsEnabled, rollOnTable, enterRoll, isEntryValid }
}
