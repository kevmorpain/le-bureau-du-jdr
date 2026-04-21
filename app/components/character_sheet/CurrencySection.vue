<template>
  <div class="space-y-2">
    <h2 class="font-semibold text-sm text-muted uppercase tracking-wide">
      Bourse
    </h2>

    <div class="grid grid-cols-5 gap-2">
      <div
        v-for="coin in coins"
        :key="coin.key"
        class="flex flex-col items-center gap-1"
      >
        <UInput
          :model-value="characterSheet[coin.key]"
          type="number"
          :min="0"
          size="sm"
          class="w-full text-center"
          :ui="{ base: 'text-center' }"
          @change="(e: Event) => update(coin.key, Number((e.target as HTMLInputElement).value))"
        />
        <span
          class="text-xs font-semibold uppercase"
          :class="coin.color"
        >
          {{ coin.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const emit = defineEmits<{
  'update:characterSheet': [value: CharacterSheet]
}>()

const coins = [
  { key: 'pp' as const, label: 'PP', color: 'text-sky-300' },
  { key: 'po' as const, label: 'PO', color: 'text-yellow-400' },
  { key: 'pe' as const, label: 'PE', color: 'text-emerald-400' },
  { key: 'pa' as const, label: 'PA', color: 'text-gray-400' },
  { key: 'pc' as const, label: 'PC', color: 'text-amber-700' },
]

const update = (key: 'pp' | 'po' | 'pe' | 'pa' | 'pc', value: number) => {
  emit('update:characterSheet', { ...props.characterSheet, [key]: Math.max(0, value) })
}
</script>
