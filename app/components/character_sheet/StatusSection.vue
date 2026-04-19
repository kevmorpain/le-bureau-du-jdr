<template>
  <div class="rounded-lg overflow-hidden bg-default ring ring-default grid grid-cols-2 divide-x divide-default w-96">
    <!-- Panneau gauche : Résistances / Immunités / Vulnérabilités -->
    <div class="py-1 px-2 space-y-1">
      <p class="font-semibold text-muted">
        Résistances
      </p>

      <ul
        v-if="defenseEntries.length"
        class="space-y-0.5 text-sm"
      >
        <li
          v-for="entry in defenseEntries"
          :key="entry.key"
          class="flex items-center gap-1"
        >
          <UIcon
            :name="defenseIcon[entry.level]"
            :class="entry.level === 'vulnerability' ? 'text-red-400 size-4' : entry.temporary ? 'text-rose-400 size-4' : 'text-blue-400 size-4'"
          />
          <span :class="entry.temporary ? 'text-rose-400' : ''">{{ entry.label }}</span>
          <ConditionWarning
            v-if="entry.temporary"
            :lines="['Résistance temporaire (état actif).']"
          />
        </li>
      </ul>
      <p
        v-else
        class="text-xs text-muted italic"
      >
        Aucune
      </p>

      <!-- Sélecteur d'ascendance draconique -->
      <template v-if="hasDraconicAncestry">
        <p class="font-semibold text-muted mt-2 mb-1 text-xs">
          Ascendance draconique
        </p>
        <USelect
          v-model="dragonbornAncestry"
          :options="ancestryOptions"
          placeholder="Choisir…"
          size="xs"
        />
      </template>
    </div>

    <!-- Panneau droit : États actifs -->
    <div class="py-1 px-2 space-y-1">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-muted">
          États
        </p>

        <UPopover>
          <UButton
            icon="i-heroicons:plus-16-solid"
            size="xs"
            variant="ghost"
            color="neutral"
          />

          <template #content>
            <div class="p-2 w-44">
              <p class="text-xs text-muted mb-1.5 font-medium">
                Ajouter un état
              </p>
              <div class="flex flex-col gap-0.5">
                <button
                  v-for="condition in binaryConditions"
                  :key="condition"
                  class="text-left text-sm px-2 py-0.5 rounded hover:bg-elevated transition-colors flex items-center justify-between"
                  :class="activeConditions.includes(condition) ? 'text-red-400' : ''"
                  @click="toggleCondition(condition)"
                >
                  {{ conditionLabels[condition] }}
                  <UIcon
                    v-if="activeConditions.includes(condition)"
                    name="i-heroicons:check-16-solid"
                    class="size-3"
                  />
                </button>
              </div>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- Conditions binaires actives -->
      <div
        v-if="activeConditions.length"
        class="flex flex-wrap gap-1"
      >
        <UTooltip
          v-for="condition in activeConditions"
          :key="condition"
          :text="conditionTooltipLines[condition].join('\n')"
          :ui="{ text: 'whitespace-pre-line max-w-56', content: 'h-auto' }"
        >
          <UBadge
            color="primary"
            variant="subtle"
            size="md"
          >
            {{ conditionLabels[condition] }}
            <template #trailing>
              <button
                class="flex items-center hover:opacity-70 transition-opacity"
                @click="toggleCondition(condition)"
              >
                <UIcon
                  name="i-heroicons:x-mark-16-solid"
                  class="size-3"
                />
              </button>
            </template>
          </UBadge>
        </UTooltip>
      </div>
      <p
        v-else
        class="text-xs text-muted italic"
      >
        Aucun
      </p>

      <!-- Épuisement -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">
          Épuisement
        </span>
        <UTooltip
          class="ml-auto"
          :text="exhaustionTooltip || undefined"
          :ui="{ text: 'whitespace-pre-line', content: 'h-auto' }"
        >
          <UInputNumber
            v-model="exhaustionLevel"
            :min="0"
            :max="6"
            size="xs"
            class="w-24"
            color="primary"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { conditionLabels } from '~~/shared/utils/labels'
import { dragonbornAncestryLabels, allDragonbornAncestries } from '~~/shared/utils/draconic_ancestry'
import { conditionTooltipLines } from '~~/shared/utils/condition-effects'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  defenseEntries,
  activeConditions,
  toggleCondition,
  exhaustionLevel,
  exhaustionTooltip,
  binaryConditions,
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
