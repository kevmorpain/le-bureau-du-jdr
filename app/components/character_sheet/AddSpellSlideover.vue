<template>
  <USlideover
    v-model:open="open"
    title="Ajouter un sort"
  >
    <template #body>
      <div class="space-y-4 p-4">
        <UInput
          v-model="search"
          placeholder="Rechercher un sort..."
          icon="i-heroicons:magnifying-glass"
          autofocus
        />

        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="lvl in levelOptions"
            :key="lvl.value"
            :variant="selectedLevels.includes(lvl.value) ? 'solid' : 'outline'"
            class="cursor-pointer"
            @click="toggleLevel(lvl.value)"
          >
            {{ lvl.label }}
          </UBadge>
        </div>

        <div
          v-if="pending"
          class="flex justify-center py-8"
        >
          <UIcon
            name="i-heroicons:arrow-path"
            class="animate-spin size-6 text-muted"
          />
        </div>

        <ul
          v-else
          class="space-y-1"
        >
          <li
            v-for="spell in filteredSpells"
            :key="spell.id"
          >
            <button
              class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-elevated/50 transition-colors text-left"
              :disabled="alreadyAddedIds.has(spell.id)"
              @click="handleAdd(spell.id)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <UBadge
                  size="md"
                  variant="soft"
                >
                  {{ spell.level === 0 ? 'Tour' : `Niv ${spell.level}` }}
                </UBadge>
                <span
                  class="truncate"
                  :class="{ 'text-muted': alreadyAddedIds.has(spell.id) }"
                >
                  {{ spell.name }}
                </span>
              </div>

              <span
                v-if="alreadyAddedIds.has(spell.id)"
                class="text-xs text-muted flex-none"
              >
                Ajouté
              </span>
              <UIcon
                v-else
                name="i-heroicons:plus"
                class="size-4 text-muted flex-none"
              />
            </button>
          </li>

          <li
            v-if="filteredSpells.length === 0 && !pending"
            class="text-center text-muted text-sm py-8"
          >
            Aucun sort trouvé.
          </li>
        </ul>
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { Ruleset } from '~~/shared/rules/ruleset'

const props = defineProps<{
  alreadyAddedIds: Set<number>
  ruleset: Ruleset
}>()

const emit = defineEmits<{
  add: [spellId: number]
}>()

const open = defineModel<boolean>('open', { default: false })

const addingIds = ref<Set<number>>(new Set())

const { query: search, levels: selectedLevels, filteredSpells, pending, reset } = useSpellCatalogSearch(() => props.ruleset)

const levelOptions = [
  { label: 'Tour', value: 0 },
  ...Array.from({ length: 9 }, (_, i) => ({ label: `Niv ${i + 1}`, value: i + 1 })),
]

const toggleLevel = (level: number) => {
  selectedLevels.value = selectedLevels.value.includes(level)
    ? selectedLevels.value.filter(selected => selected !== level)
    : [...selectedLevels.value, level]
}

const handleAdd = async (spellId: number) => {
  if (addingIds.value.has(spellId)) return
  addingIds.value.add(spellId)
  emit('add', spellId)
  addingIds.value.delete(spellId)
}

watch(open, (val) => {
  if (!val) reset()
})
</script>
