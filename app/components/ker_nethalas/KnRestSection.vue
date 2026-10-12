<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Repos et provisions
      </h2>
      <p class="text-sm text-muted">
        Prendre son souffle et établir le camp appliquent les gains et les coûts à votre place : jauges, Épuisement, lumière, provisions.
      </p>
    </template>

    <div class="space-y-6">
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <UButton @click="takeBreather">
            Prendre son souffle
          </UButton>
          <UButton
            variant="soft"
            @click="campOpen = !campOpen"
          >
            Établir le camp
          </UButton>
        </div>

        <ul
          v-if="breatherLines.length"
          class="space-y-1 text-sm"
        >
          <li
            v-for="(line, index) in breatherLines"
            :key="index"
          >
            {{ line }}
          </li>
        </ul>

        <KnCampPanel
          v-if="campOpen"
          v-model:character="character"
          :resolved
          :masteries
          @close="campOpen = false"
        />
      </div>

      <p class="text-sm">
        <span class="font-medium">Provisions :</span>
        {{ provisionsText }}
        <span class="text-muted">(à gérer dans la section Équipement)</span>
      </p>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_PROVISION_KEYS, knTakeBreather } from '~~/shared/ker-nethalas/camp'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCurrentDomain } from '~~/shared/ker-nethalas/run'
import { knRest } from '~~/shared/ker-nethalas/vitals'

const props = defineProps<{
  resolved: KnResolvedSheet
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { signed } = useKnLabels()
const { t } = useI18n()

const provisionsText = computed(() => {
  const held = KN_PROVISION_KEYS.filter(key => character.value.provisions[key] > 0)
  return held.length ? held.map(key => `${character.value.provisions[key]} ${t(`ker_nethalas.provisions.${key}`).toLowerCase()}`).join(', ') : 'aucune'
})

const campOpen = ref(false)
const breatherLines = ref<string[]>([])

function takeBreather() {
  const c = character.value
  const before = {
    toughness: c.toughnessCurrent,
    health: c.healthCurrent,
    exhaustion: c.exhaustion,
    light: c.run.lightRemaining,
    tensionDie: c.run.tensionDie,
  }
  const result = knTakeBreather({
    toughness: before.toughness,
    toughnessMax: props.resolved.maxVitals.toughness.effective,
    health: before.health,
    healthMax: props.resolved.maxVitals.health.effective,
    exhaustion: before.exhaustion,
    lightRemaining: before.light,
    tensionDie: before.tensionDie,
  })

  c.toughnessCurrent = result.toughness
  c.healthCurrent = result.health
  c.exhaustion = result.exhaustion
  c.run.lightRemaining = result.lightRemaining
  c.run.tensionDie = result.tensionDie
  c.status = knRest(c.status, 'breather')

  const lines = [
    [
      `Robustesse ${signed(result.toughness - before.toughness)} (D10 : ${result.toughnessRoll} + 2)`,
      `Santé ${signed(result.health - before.health)}`,
      `Épuisement ${signed(result.exhaustion - before.exhaustion)}`,
      `lumière ${signed(result.lightRemaining - before.light)}`,
      result.tensionDie === before.tensionDie ? `Dé de Tension : reste à D${before.tensionDie}` : `Dé de Tension : D${before.tensionDie} → D${result.tensionDie}`,
    ].join(' · '),
  ]
  if (knCurrentDomain(c.run).growingDarkness.some(event => event.key === 'gd_15_16')) {
    lines.push('Un événement de l\'Obscurité Grandissante demande aussi un test de Dé de Tension tout de suite.')
  }
  if (c.status.rotStage >= 1) lines.push('Pourriture : test d\'Endurance, sinon elle avance d\'un stade.')
  breatherLines.value = lines
}
</script>
