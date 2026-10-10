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

      <div class="space-y-2 border-t border-default pt-3">
        <p class="text-sm font-medium">
          Points temporaires
        </p>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KnNumberField
            v-for="vital in VITALS"
            :key="vital"
            :model-value="knTemporaryOf(character.status, vital)"
            :label="$t(`ker_nethalas.vitals.${vital}`)"
            :aria-label="`${$t(`ker_nethalas.vitals.${vital}`)} temporaire`"
            :min="KN_STATUS_BOUNDS.temporary.min"
            :max="KN_STATUS_BOUNDS.temporary.max"
            @update:model-value="character.status = knSetTemporary(character.status, vital, $event)"
          />
        </div>
        <p class="text-xs text-muted">
          Ils s'ajoutent au maximum, se dépensent avant la Robustesse quand on subit des dégâts, et disparaissent au prochain
          repos.
        </p>
      </div>

      <div class="space-y-2 border-t border-default pt-3">
        <p class="text-sm font-medium">
          Dégâts et soins
        </p>
        <div class="flex flex-wrap items-end gap-3">
          <KnNumberField
            v-model="amount"
            label="Montant"
            :min="0"
            :max="KN_BOUNDS.vital.max"
            class="w-32"
          />
          <UButton
            color="error"
            variant="soft"
            @click="hurt"
          >
            Subir
          </UButton>
          <UButton
            variant="soft"
            @click="healWounds"
          >
            Soigner des Blessures
          </UButton>
        </div>
        <p class="text-xs text-muted">
          Les dégâts retirent la Robustesse temporaire, puis la Robustesse, puis la Santé. Soigner des Blessures remplit d'abord
          la Robustesse, puis la Santé, jusqu'à leur maximum effectif.
        </p>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_STATUS_BOUNDS } from '~~/shared/ker-nethalas/status'
import { knHealWounds, knSetTemporary, knTakeDamage, knTemporaryOf, type KnWoundsState } from '~~/shared/ker-nethalas/vitals'

const props = defineProps<{
  resolved: KnResolvedSheet
}>()

const VITALS = ['health', 'toughness', 'aether', 'sanity'] as const

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()

const amount = ref(1)

const woundsState = (): KnWoundsState => ({
  toughness: character.value.toughnessCurrent,
  toughnessMax: props.resolved.maxVitals.toughness.effective,
  health: character.value.healthCurrent,
  healthMax: props.resolved.maxVitals.health.effective,
  temporaryToughness: knTemporaryOf(character.value.status, 'toughness'),
})

function apply(next: KnWoundsState) {
  const c = character.value
  c.toughnessCurrent = next.toughness
  c.healthCurrent = next.health
  if (next.temporaryToughness !== knTemporaryOf(c.status, 'toughness')) {
    c.status = knSetTemporary(c.status, 'toughness', next.temporaryToughness)
  }
}

function hurt() {
  const next = knTakeDamage(woundsState(), amount.value)
  apply(next)
  if (next.health === 0) toast.add({ title: 'La Santé tombe à 0 : le survivant meurt.', color: 'error' })
}

const healWounds = () => apply(knHealWounds(woundsState(), amount.value))
</script>
