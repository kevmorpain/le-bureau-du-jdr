<template>
  <UCard>
    <template #header>
      <KnCardHeader title="Repos et provisions">
        Prendre son souffle et établir le camp appliquent les gains et les coûts à votre place : jauges, Épuisement, lumière, provisions.
      </KnCardHeader>
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
          :magic
          @close="campOpen = false"
        />

        <div class="space-y-2 border-t border-default pt-3">
          <p class="text-sm font-medium">
            Bandage hors combat
          </p>
          <p class="text-sm text-muted">
            Un test de Médecine réussi et un Bandage soignent D4 Robustesse, une seule fois par salle.
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              size="sm"
              variant="outline"
              icon="i-heroicons:cube"
              @click="bandageCheckOpen = !bandageCheckOpen"
            >
              Tester la Médecine
            </UButton>
            <UButton
              size="sm"
              :variant="bandageSuggested ? 'solid' : 'soft'"
              :disabled="character.provisions.bandages < 1 || bandageUsed"
              @click="useBandage"
            >
              Test réussi : soigner D4 Robustesse
            </UButton>
            <span
              v-if="bandageUsed"
              class="text-sm text-muted"
            >Déjà fait dans cette salle.</span>
            <span
              v-else-if="character.provisions.bandages < 1"
              class="text-sm text-muted"
            >Aucun Bandage.</span>
          </div>
          <KnInlineCheck
            v-if="bandageCheckOpen"
            :request="{ id: 'skill:medicine', difficulty: 'normal', note: 'Soigner avec un Bandage' }"
            @rolled="success => bandageSuggested = success"
            @close="bandageCheckOpen = false"
          />
          <p
            v-if="bandageLine"
            class="text-sm"
          >
            {{ bandageLine }}
          </p>
        </div>
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
import { KN_PROVISION_KEYS } from '~~/shared/ker-nethalas/camp'
import { KN_BANDAGE, knUseBandage } from '~~/shared/ker-nethalas/healing'
import type { KnMagicContent } from '~~/shared/ker-nethalas/magic'
import { knIsUsedUp } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = withDefaults(defineProps<{
  resolved: KnResolvedSheet
  masteries: KnMastery[] | null
  magic: KnMagicContent | null
  // Ouvrir directement le camp, quand on vient du bouton « Établir le camp ».
  openCamp?: boolean
}>(), { openCamp: false })

const character = defineModel<KnCharacter>('character', { required: true })

const { signed } = useKnLabels()
const { t } = useI18n()

const provisionsText = computed(() => {
  const held = KN_PROVISION_KEYS.filter(key => character.value.provisions[key] > 0)
  return held.length ? held.map(key => `${character.value.provisions[key]} ${t(`ker_nethalas.provisions.${key}`).toLowerCase()}`).join(', ') : 'aucune'
})

const campOpen = ref(props.openCamp)
const { takeBreather, lines: breatherLines } = useKnBreather(character, () => props.resolved)

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })

const bandageCheckOpen = ref(false)
const bandageSuggested = ref(false)
const bandageLine = ref('')
const bandageUsed = computed(() => knIsUsedUp(character.value.status, KN_BANDAGE.key))

function useBandage() {
  const c = character.value
  const result = knUseBandage({
    toughness: c.toughnessCurrent,
    toughnessMax: props.resolved.maxVitals.toughness.effective,
    bandages: c.provisions.bandages,
    status: c.status,
  })
  if ('error' in result) return
  const gained = result.toughness - c.toughnessCurrent
  c.toughnessCurrent = result.toughness
  c.provisions = { ...c.provisions, bandages: result.bandages }
  c.status = result.status
  bandageLine.value = `Bandage : D4 → ${result.roll}, Robustesse ${signed(gained)}${gained < result.roll ? ' (limitée au maximum)' : ''}.`
  bandageSuggested.value = false
  bandageCheckOpen.value = false
}
</script>
