<template>
  <div
    v-if="character && resolved"
    class="pb-12"
  >
    <KnStatusBar
      v-model:character="character"
      :resolved
      :masteries
      :magic
      :state-label
      :failed="status === 'error'"
    />

    <div class="grid items-start gap-5 py-5 min-[1400px]:grid-cols-[minmax(24rem,32rem)_minmax(26rem,36rem)_minmax(30rem,1fr)]">
      <div class="@container min-w-0 space-y-4">
        <KnRemindersSection :reminders="resolved.reminders" />

        <KnFateDenied
          v-model:character="character"
          :resolved
          :masteries
        />

        <KnGoalsSection
          v-model:character="character"
          :goals
          :masteries
        />

        <KnChecksSection
          v-model:character="character"
          :resolved
          @roll="openRoll"
        />

        <KnRollSection
          v-model:character="character"
          v-model:selected="rollSelection"
          :resolved
        />

        <KnMasteriesSection
          v-model:character="character"
          :masteries
          :bestiary
          :resolved
        />

        <KnMadnessSection
          v-model:character="character"
          :resolved
        />

        <KnEffectsSection v-model:character="character" />

        <KnEquipmentSection
          v-model:character="character"
          :masteries
          :catalog
          :loot
          :aging
          :resolved
        />

        <KnIdentitySection
          v-model:character="character"
          :masteries
        />

        <KnNotesSection v-model:character="character" />
      </div>

      <div class="@container min-w-0 space-y-4">
        <KnFirstDomainSection
          v-model:character="character"
          :resolved
          :rooms="firstDomain"
          :catalog
          :loot
          :magic
        />

        <KnDungeonPanel
          v-model:character="character"
          v-model:selected="selectedVisit"
          :resolved
          :tables
          :bestiary
        />
      </div>

      <div class="@container min-w-0 space-y-4">
        <KnRoomPanel
          v-model:character="character"
          :selected="selectedVisit"
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

        <KnLootSection
          v-model:character="character"
          :loot
          :catalog
          :bestiary
          :masteries
          :magic
        />

        <KnTraderSection
          v-if="traderHere"
          v-model:character="character"
          :catalog
        />
      </div>
    </div>
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
import type { KnFirstDomainRoom } from '~~/shared/ker-nethalas/firstDomain'
import type { KnPersonalGoal } from '~~/shared/ker-nethalas/goals'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import type { KnLootContent } from '~~/shared/ker-nethalas/loot'
import type { KnMagicContent } from '~~/shared/ker-nethalas/magic'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knCurrentDomain, knTraderHere } from '~~/shared/ker-nethalas/run'
import type { KnRollTable } from '~~/shared/ker-nethalas/tables'

definePageMeta({ layout: 'wide' })

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
const { data: encountersFirstDomain } = await useKnContent<KnRollTable>('encountersFirstDomain')
const { data: firstDomain } = await useKnContent<KnFirstDomainRoom[]>('firstDomain')
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
  encountersFirstDomain: encountersFirstDomain.value,
  overseers: overseers.value,
}))

const { data } = await useFetch<KnCharacter>(`/api/ker-nethalas/characters/${route.params.id}`)
// `useFetch` rend `data` superficielle : on la recopie dans une ref profonde pour que l'édition soit réactive.
const character = ref(data.value)

const { status } = useKnAutosave(character)
const traderHere = computed(() => !!character.value && knTraderHere(character.value.run))
useKnDarknessGoal(character)
const resolved = useKnResolved(character, masteries)

const STATUS_LABELS: Record<AutoSaveStatus, string> = {
  idle: '',
  saving: 'Enregistrement…',
  saved: 'Enregistré',
  error: 'Échec de l\'enregistrement',
}
const stateLabel = computed(() => STATUS_LABELS[status.value])

const rollSelection = ref('skill:dodge')

// `null` : la colonne de droite suit la dernière entrée du chemin ; un nombre fixe une entrée plus ancienne.
const selectedVisit = ref<number | null>(null)
watch(
  [() => character.value?.run.current, () => character.value && knCurrentDomain(character.value.run).visits.length],
  () => {
    selectedVisit.value = null
  },
)

function openRoll(selection: string) {
  rollSelection.value = selection
  document.getElementById('kn-roll')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>
