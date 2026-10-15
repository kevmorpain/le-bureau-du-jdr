<template>
  <div class="sticky top-(--ui-header-height) z-30 -mx-4 space-y-2 border-b border-default bg-default/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div class="min-w-60 space-y-1">
        <p class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-lg font-bold">{{ character.name }}</span>
          <span class="text-xs text-muted">Niveau {{ character.level }} · {{ domain.name }}, {{ entriesText }}</span>
        </p>
        <div class="flex items-center gap-2">
          <UProgress
            :model-value="Math.min(character.xp, KN_LEVEL_XP)"
            :max="KN_LEVEL_XP"
            size="xs"
            class="flex-1"
          />
          <span class="whitespace-nowrap text-xs text-muted">XP {{ character.xp }} / {{ KN_LEVEL_XP }}</span>
          <UButton
            v-if="knCanLevelUp(character.xp)"
            size="xs"
            icon="i-heroicons:arrow-up-circle"
            @click="goToLevelUp"
          >
            Monter de niveau
          </UButton>
        </div>
      </div>

      <button
        type="button"
        class="grid min-w-0 flex-1 cursor-pointer grid-cols-2 gap-x-5 gap-y-1 rounded-md p-1 text-left hover:bg-elevated sm:grid-cols-4"
        aria-label="Modifier les jauges"
        @click="vitalsOpen = true"
      >
        <div
          v-for="vital in VITALS"
          :key="vital"
          class="min-w-0 space-y-1"
        >
          <div class="flex justify-between gap-2 text-xs">
            <span class="text-muted">{{ $t(`ker_nethalas.vitals.${vital}`) }}</span>
            <span class="font-semibold tabular-nums">{{ character[`${vital}Current`] }} / {{ resolved.maxVitals[vital].effective }}</span>
          </div>
          <UProgress
            :model-value="Math.max(0, Math.min(character[`${vital}Current`], resolved.maxVitals[vital].effective))"
            :max="Math.max(1, resolved.maxVitals[vital].effective)"
            size="xs"
            :color="VITAL_COLORS[vital]"
          />
        </div>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        v-if="character.exhaustion > 0"
        color="warning"
        variant="subtle"
        size="md"
        :label="`Épuisement ${character.exhaustion}`"
      />
      <UBadge
        v-if="character.sanityCurrent === 0"
        color="error"
        variant="solid"
        size="md"
        label="Santé mentale à 0 : tirer une Folie"
      />
      <UBadge
        :color="character.run.lightRemaining === 0 ? 'error' : 'neutral'"
        variant="subtle"
        size="md"
        :label="character.run.lightRemaining === 0 ? 'Sans lumière' : `Lumière ${character.run.lightRemaining} salles`"
      />

      <UPopover
        v-for="entry in character.status.conditions"
        :key="entry.key"
        mode="hover"
      >
        <button
          type="button"
          class="cursor-help"
        >
          <UBadge
            color="error"
            variant="subtle"
            size="md"
            :label="entry.value ? `${$t(`ker_nethalas.conditions.${entry.key}.name`)} ${entry.value}` : $t(`ker_nethalas.conditions.${entry.key}.name`)"
          />
        </button>
        <template #content>
          <div class="max-w-xs space-y-1 p-3 text-sm">
            <p class="font-medium">
              {{ $t(`ker_nethalas.conditions.${entry.key}.name`) }}
            </p>
            <p class="text-muted">
              {{ $t(`ker_nethalas.conditions.${entry.key}.reminder`, { value: entry.value ?? 'X' }) }}
            </p>
          </div>
        </template>
      </UPopover>

      <UPopover
        v-if="character.status.rotStage > 0"
        mode="hover"
      >
        <button
          type="button"
          class="cursor-help"
        >
          <UBadge
            color="secondary"
            variant="subtle"
            size="md"
            :label="`Pourriture, stade ${character.status.rotStage}`"
          />
        </button>
        <template #content>
          <ul class="max-w-xs space-y-1 p-3 text-sm">
            <li
              v-for="n in character.status.rotStage"
              :key="n"
            >
              <span class="font-medium">Stade {{ n }}</span>
              — {{ $t(`ker_nethalas.rot.stage${n}`) }}
            </li>
          </ul>
        </template>
      </UPopover>

      <UPopover
        v-if="madness.length"
        mode="hover"
      >
        <button
          type="button"
          class="cursor-help"
        >
          <UBadge
            color="secondary"
            variant="subtle"
            size="md"
            :label="`Folie : ${madness.length}`"
          />
        </button>
        <template #content>
          <ul class="max-w-xs space-y-1 p-3 text-sm">
            <li
              v-for="entry in madness"
              :key="entry.key"
            >
              {{ entry.label }}
            </li>
          </ul>
        </template>
      </UPopover>

      <span
        class="ml-auto text-xs"
        :class="failed ? 'text-error' : 'text-muted'"
      >
        {{ stateLabel }}
      </span>
      <UButton
        size="sm"
        variant="soft"
        icon="i-heroicons:moon"
        @click="restOpen = true"
      >
        Repos et provisions
      </UButton>
    </div>

    <USlideover
      v-model:open="vitalsOpen"
      title="Jauges"
      side="right"
      :ui="{ body: 'overflow-y-auto' }"
    >
      <template #body>
        <KnVitalsSection
          v-model:character="character"
          :resolved
        />
      </template>
    </USlideover>

    <USlideover
      v-model:open="restOpen"
      title="Repos et provisions"
      side="right"
      :ui="{ content: 'max-w-2xl', body: 'overflow-y-auto' }"
    >
      <template #body>
        <KnRestSection
          v-model:character="character"
          :resolved
          :masteries
          :magic
        />
      </template>
    </USlideover>
  </div>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_MADNESS_COUNTER_KEYS } from '~~/shared/ker-nethalas/catalog/madness'
import type { KnMagicContent } from '~~/shared/ker-nethalas/magic'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_LEVEL_XP, knCanLevelUp } from '~~/shared/ker-nethalas/progression'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCurrentDomain } from '~~/shared/ker-nethalas/run'

defineProps<{
  resolved: KnResolvedSheet
  masteries: KnMastery[] | null
  magic: KnMagicContent | null
  stateLabel: string
  failed: boolean
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()

const VITALS = ['health', 'toughness', 'aether', 'sanity'] as const
const VITAL_COLORS = { health: 'error', toughness: 'neutral', aether: 'info', sanity: 'secondary' } as const

const vitalsOpen = ref(false)
const restOpen = ref(false)

const domain = computed(() => knCurrentDomain(character.value.run))
const entriesText = computed(() => domain.value.visits.length ? `entrée ${domain.value.visits.length}` : 'aucune entrée')

const madness = computed(() => [
  ...KN_MADNESS_COUNTER_KEYS
    .filter(key => character.value.status.madness.counters[key] > 0)
    .map(key => ({ key, label: `${t(`ker_nethalas.madnessNames.${key}`)} (cumul ${character.value.status.madness.counters[key]})` })),
  ...character.value.status.madness.lostSkills.map((entry, index) => ({
    key: `lostSkill-${index}`,
    label: entry.skill ? `${t('ker_nethalas.madnessNames.lostSkill')} : ${t(`ker_nethalas.skills.${entry.skill}`)}` : t('ker_nethalas.madnessNames.lostSkill'),
  })),
])

function goToLevelUp() {
  document.getElementById('kn-identity')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>
