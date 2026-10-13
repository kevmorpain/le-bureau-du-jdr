<template>
  <div
    v-if="character && resolved"
    class="space-y-6 pb-12"
  >
    <UPageHeader :title="character.name">
      <template #links>
        <span
          class="text-sm"
          :class="status === 'error' ? 'text-error' : 'text-muted'"
        >
          {{ stateLabel }}
        </span>
      </template>
    </UPageHeader>

    <KnIdentitySection v-model:character="character" />

    <KnRemindersSection :reminders="resolved.reminders" />

    <KnVitalsSection
      v-model:character="character"
      :resolved
    />

    <KnRunSection
      v-model:character="character"
      :resolved
      :tables
      :bestiary
    />

    <KnCombatSection
      v-model:character="character"
      :resolved
      :bestiary
      :masteries
    />

    <KnRestSection
      v-model:character="character"
      :resolved
      :masteries
      :magic
    />

    <KnRollSection
      v-model:character="character"
      v-model:selected="rollSelection"
      :resolved
    />

    <KnChecksSection
      v-model:character="character"
      :resolved
      @roll="openRoll"
    />

    <KnMasteriesSection
      v-model:character="character"
      :masteries
      :bestiary
      :resolved
    />

    <KnGoalsSection
      v-model:character="character"
      :goals
    />

    <KnEffectsSection v-model:character="character" />

    <KnConditionsReference :character />

    <KnEquipmentSection
      v-model:character="character"
      :masteries
      :catalog
      :loot
      :aging
      :resolved
    />

    <KnLootSection
      v-model:character="character"
      :loot
      :catalog
      :bestiary
      :masteries
    />

    <KnTraderSection
      v-model:character="character"
      :catalog
    />

    <KnNotesSection v-model:character="character" />
  </div>

  <UPageBody v-else>
    <p class="text-muted">
      Ce survivant est introuvable.
    </p>
    <UButton
      to="/ker-nethalas"
      variant="soft"
      class="mt-4"
    >
      Retour à la liste
    </UButton>
  </UPageBody>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { AutoSaveStatus } from '~/composables/useAutoSave'
import type { KnPotionAging } from '~~/shared/ker-nethalas/consumables'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnPersonalGoal } from '~~/shared/ker-nethalas/goals'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import type { KnLootContent } from '~~/shared/ker-nethalas/loot'
import type { KnMagicContent } from '~~/shared/ker-nethalas/magic'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnRollTable } from '~~/shared/ker-nethalas/tables'

const route = useRoute()

const { data: masteries } = await useKnContent<KnMastery[]>('masteries')
const { data: goals } = await useKnContent<KnPersonalGoal[]>('personalGoals')

const { data: corridorDescriptions } = await useKnContent<KnRollTable>('corridorDescriptions')
const { data: roomDescriptions } = await useKnContent<KnRollTable>('roomDescriptions')
const { data: events } = await useKnContent<KnRollTable>('events')
const { data: scavenging } = await useKnContent<KnRollTable>('scavenging')
const { data: traps } = await useKnContent<KnRollTable>('traps')
const { data: encountersA } = await useKnContent<KnRollTable>('encountersA')
const { data: encountersB } = await useKnContent<KnRollTable>('encountersB')
const { data: overseers } = await useKnContent<KnRollTable>('overseers')
const { data: bestiary } = await useKnContent<KnCreature[]>('bestiary')
const { data: catalog } = await useKnContent<KnCatalogItem[]>('items')
const { data: loot } = await useKnContent<KnLootContent>('loot')
const { data: aging } = await useKnContent<KnPotionAging>('potionAging')
const { data: magic } = await useKnContent<KnMagicContent>('magicItems')
const tables = computed(() => ({
  corridorDescriptions: corridorDescriptions.value,
  roomDescriptions: roomDescriptions.value,
  events: events.value,
  scavenging: scavenging.value,
  traps: traps.value,
  encountersA: encountersA.value,
  encountersB: encountersB.value,
  overseers: overseers.value,
}))

const { data } = await useFetch<KnCharacter>(`/api/ker-nethalas/characters/${route.params.id}`)
// `useFetch` rend `data` superficielle : on la recopie dans une ref profonde pour que l'édition soit réactive.
const character = ref(data.value)

const { status } = useKnAutosave(character)
const resolved = useKnResolved(character, masteries)

const STATUS_LABELS: Record<AutoSaveStatus, string> = {
  idle: '',
  saving: 'Enregistrement…',
  saved: 'Enregistré',
  error: 'Échec de l\'enregistrement',
}
const stateLabel = computed(() => STATUS_LABELS[status.value])

const rollSelection = ref('skill:dodge')

function openRoll(selection: string) {
  rollSelection.value = selection
  document.getElementById('kn-roll')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>
