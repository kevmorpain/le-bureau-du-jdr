<template>
  <div
    v-if="defenseEntries.length || hasDraconicAncestry"
    class="rounded-xl border border-default bg-default p-3 space-y-2"
  >
    <span class="text-xs font-bold uppercase tracking-widest text-muted">Résistances & Défenses</span>

    <ul
      v-if="defenseEntries.length"
      class="space-y-0.5 text-sm"
    >
      <li
        v-for="entry in defenseEntries"
        :key="entry.key"
        class="flex items-center gap-1.5"
      >
        <UIcon
          :name="defenseIcon[entry.level]"
          class="size-4 flex-shrink-0"
          :class="entry.level === 'vulnerability' ? 'text-red-400' : entry.temporary ? 'text-rose-400' : 'text-blue-400'"
        />
        <span :class="entry.temporary ? 'text-rose-400' : ''">{{ entry.label }}</span>
        <ConditionWarning
          v-if="entry.temporary"
          :lines="['Résistance temporaire (état actif).']"
        />
      </li>
    </ul>

    <template v-if="hasDraconicAncestry">
      <p class="text-xs text-muted">
        Ascendance draconique
      </p>
      <USelect
        v-model="dragonbornAncestry"
        :items="ancestryOptions"
        placeholder="Choisir…"
        size="xs"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { dragonbornAncestryLabels, allDragonbornAncestries } from '~~/shared/utils/draconic_ancestry'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  defenseEntries,
  hasDraconicAncestry,
  dragonbornAncestry,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const defenseIcon: Record<string, string> = {
  immunity: 'i-heroicons:chevron-double-up-16-solid',
  resistance: 'i-heroicons:chevron-up-16-solid',
  vulnerability: 'i-heroicons:chevron-down-16-solid',
}

const ancestryOptions = allDragonbornAncestries.map(a => ({
  label: dragonbornAncestryLabels[a],
  value: a,
}))
</script>
