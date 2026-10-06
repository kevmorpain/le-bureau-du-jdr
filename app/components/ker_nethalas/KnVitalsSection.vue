<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Jauges
      </h2>
      <p class="text-sm text-muted">
        Le maximum de base est modifiable ; le maximum effectif s'affiche à droite quand un effet le change.
      </p>
    </template>

    <div class="space-y-3">
      <div
        v-for="vital in VITALS"
        :key="vital"
        class="grid grid-cols-[7rem_1fr_auto_1fr_3.5rem] items-center gap-2"
      >
        <span>{{ $t(`ker_nethalas.vitals.${vital}`) }}</span>
        <KnNumberField
          v-model="character[`${vital}Current`]"
          :aria-label="`${$t(`ker_nethalas.vitals.${vital}`)} : valeur actuelle`"
          :min="KN_BOUNDS.vital.min"
          :max="KN_BOUNDS.vital.max"
        />
        <span class="text-muted">/</span>
        <KnNumberField
          v-model="character[`${vital}Max`]"
          :aria-label="`${$t(`ker_nethalas.vitals.${vital}`)} : valeur maximale`"
          :min="KN_BOUNDS.vital.min"
          :max="KN_BOUNDS.vital.max"
        />
        <KnEffectiveVital
          :vital="resolved.maxVitals[vital]"
          :name="$t(`ker_nethalas.vitals.${vital}`)"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 pt-2">
        <KnNumberField
          v-model="character.exhaustion"
          label="Épuisement"
          :min="KN_BOUNDS.exhaustion.min"
          :max="KN_BOUNDS.exhaustion.max"
        />
        <KnNumberField
          v-model="character.damageModifier"
          label="Modificateur de dégâts"
          :min="KN_BOUNDS.damageModifier.min"
          :max="KN_BOUNDS.damageModifier.max"
        />
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

defineProps<{
  resolved: KnResolvedSheet
}>()

const VITALS = ['health', 'toughness', 'aether', 'sanity'] as const

const character = defineModel<KnCharacter>('character', { required: true })
</script>
