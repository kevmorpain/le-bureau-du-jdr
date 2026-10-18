<template>
  <KnCard storage-key="foresight">
    <template #header>
      <KnCardHeader title="Pièces pressenties">
        Projection de l'esprit : les prochaines entrées nouvelles de ce Domaine seront ces pièces, dans cet ordre. L'entrée réelle reprend ce
        qui a été vu ; le Dé de Tension, le Lair et la Sortie se tirent à ce moment.
      </KnCardHeader>
    </template>
    <template #summary>
      {{ rooms.length }} pièce{{ rooms.length > 1 ? 's' : '' }} pressentie{{ rooms.length > 1 ? 's' : '' }}
    </template>

    <div class="space-y-4">
      <div
        v-for="(room, index) in rooms"
        :key="index"
        class="space-y-1"
      >
        <p class="text-xs font-medium uppercase text-muted">
          Entrée à venir n° {{ index + 1 }}
        </p>
        <KnVisitBlock
          :visit="room"
          :position="index + 1"
          :tension-die="run.tensionDie"
          :lair-die="domain.lairDie"
          :exit-die="domain.exitDie"
          :lockpicks="0"
          :level="level"
          :bestiary
          :tables
        />
      </div>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-heroicons:x-mark"
        @click="emit('clear')"
      >
        Oublier ces pièces
      </UButton>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import { knCurrentDomain, type KnRun, type KnVisit } from '~~/shared/ker-nethalas/run'
import type { KnExplorationTableName, KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  run: KnRun
  rooms: KnVisit[]
  level: number
  bestiary: KnCreature[] | null
  tables: Partial<Record<KnExplorationTableName, KnRollTable | null>>
}>()

const emit = defineEmits<{ clear: [] }>()

const domain = computed(() => knCurrentDomain(props.run))
</script>
