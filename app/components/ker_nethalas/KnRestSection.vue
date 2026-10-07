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
          @close="campOpen = false"
        />
      </div>

      <div class="space-y-2">
        <h3 class="font-medium">
          Provisions
        </h3>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KnNumberField
            v-for="key in KN_PROVISION_KEYS"
            :key
            v-model="character.provisions[key]"
            :label="$t(`ker_nethalas.provisions.${key}`)"
            :min="KN_PROVISION_BOUNDS.min"
            :max="KN_PROVISION_BOUNDS.max"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_PROVISION_BOUNDS, KN_PROVISION_KEYS, knTakeBreather } from '~~/shared/ker-nethalas/camp'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knCurrentDomain } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { signed } = useKnLabels()

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
