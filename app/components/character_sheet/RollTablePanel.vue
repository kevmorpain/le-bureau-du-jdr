<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-2"
      :class="inline ? 'pb-2' : 'sticky top-0 z-10 border-b border-default bg-default px-4 py-3 sm:px-6'"
    >
      <UButton
        v-if="rollsEnabled"
        icon="i-game-icons:rolling-dices"
        @click="rollOnTable"
      >
        Lancer le d{{ table.die }}
      </UButton>
      <div
        v-else
        class="flex items-center gap-2"
      >
        <UInput
          v-model.number="entered"
          type="number"
          :min="1"
          :max="table.die"
          :placeholder="`d${table.die} obtenu`"
          :aria-label="`Résultat du d${table.die}`"
          class="w-32"
          @keydown.enter="enterRoll"
        />
        <UButton
          :disabled="!validEntry"
          @click="enterRoll"
        >
          Voir le résultat
        </UButton>
      </div>
      <div
        v-if="rolls.length"
        class="flex items-center gap-1 text-sm text-muted"
      >
        <span>Derniers jets</span>
        <UButton
          v-for="(value, i) in rolls"
          :key="i"
          :label="String(value)"
          :color="i === rolls.length - 1 ? 'primary' : 'neutral'"
          variant="soft"
          size="xs"
          @click="scrollToRoll(value)"
        />
      </div>
    </div>

    <ol
      ref="list"
      class="space-y-1"
      :class="{ 'p-4 sm:px-6': !inline }"
    >
      <li
        v-for="(entry, index) in table.entries"
        :key="entry.min"
        class="flex gap-3 rounded-lg p-2 text-sm ring transition-colors"
        :class="index === latestIndex
          ? 'ring-primary bg-primary/10'
          : index === previousIndex
            ? 'ring-default bg-elevated'
            : 'ring-transparent'"
        :aria-current="index === latestIndex ? 'true' : undefined"
        :data-index="index"
      >
        <span class="w-14 shrink-0 font-mono text-muted">{{ rollTableRangeLabel(entry, table.die) }}</span>
        <span>{{ entry.text }}</span>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
import { rollTableEntryIndex, rollTableRangeLabel, type RollTable } from '~~/shared/rules/rollTables'

const props = defineProps<{
  table: RollTable
  inline?: boolean
}>()

const { roll, rollsEnabled } = useDiceRoller()

// Deux jets restent surlignés : Chaos contrôlé fait lancer deux fois puis choisir.
const rolls = ref<number[]>([])
const list = useTemplateRef<HTMLOListElement>('list')

const latestIndex = computed(() => {
  const last = rolls.value.at(-1)
  return last === undefined ? -1 : rollTableEntryIndex(props.table.entries, last)
})

const previousIndex = computed(() =>
  rolls.value.length > 1 ? rollTableEntryIndex(props.table.entries, rolls.value[0]!) : -1,
)

const scrollToRoll = (value: number) => {
  const index = rollTableEntryIndex(props.table.entries, value)
  list.value?.querySelector(`[data-index="${index}"]`)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
}

const showResult = async (result: number) => {
  rolls.value = [...rolls.value, result].slice(-2)
  await nextTick()
  scrollToRoll(result)
}

const rollOnTable = () => showResult(roll(props.table.name, 0, props.table.die))

const entered = ref<number | null>(null)
const validEntry = computed(() => Number.isInteger(entered.value) && entered.value! >= 1 && entered.value! <= props.table.die)

const enterRoll = async () => {
  if (!validEntry.value) return
  await showResult(entered.value!)
  entered.value = null
}
</script>
