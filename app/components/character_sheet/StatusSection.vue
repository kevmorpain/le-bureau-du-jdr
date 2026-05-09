<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">États</span>
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
                :class="activeConditions.includes(condition) ? 'text-primary' : ''"
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

    <!-- Conditions actives -->
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
          size="sm"
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
      Aucun état actif
    </p>

    <!-- Épuisement : dots cliquables -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted">Épuisement</span>
        <span
          v-if="exhaustionLevel > 0"
          class="text-xs text-red-400 font-semibold"
        >Niv. {{ exhaustionLevel }}</span>
      </div>
      <div class="flex gap-1.5">
        <button
          v-for="n in 6"
          :key="n"
          class="size-3.5 rounded-full border-2 transition-colors cursor-pointer"
          :class="n <= exhaustionLevel
            ? 'bg-red-500/60 border-red-500 hover:bg-red-500/80'
            : 'bg-transparent border-muted hover:border-red-400'"
          :aria-label="`Épuisement niveau ${n}`"
          @click="exhaustionLevel = exhaustionLevel === n ? n - 1 : n"
        />
      </div>
      <ul
        v-if="exhaustionLevel > 0"
        class="space-y-0.5"
      >
        <li
          v-for="(line, i) in exhaustionImpactLines.slice(0, exhaustionLevel)"
          :key="i"
          class="text-xs text-red-400"
        >
          {{ line }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { conditionLabels } from '~~/shared/utils/labels'
import { conditionTooltipLines, exhaustionImpactLines } from '~~/shared/utils/condition-effects'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  activeConditions,
  toggleCondition,
  exhaustionLevel,
  binaryConditions,
} = useCharacterSheet(toRef(props, 'characterSheet'))
</script>
