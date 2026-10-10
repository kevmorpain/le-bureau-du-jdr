<template>
  <div
    v-if="!knAbilityIsPassive(ability)"
    class="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1"
  >
    <USwitch
      v-if="ability.sustained"
      :model-value="isOn"
      :label="isOn ? 'Maintenue' : 'Maintenir'"
      :disabled="!isOn && blockers.length > 0"
      :aria-label="`${ability.name} : maintenir`"
      @update:model-value="toggle"
    />
    <UButton
      v-else
      size="xs"
      variant="soft"
      :disabled="blockers.length > 0"
      :aria-label="`Utiliser ${ability.name}`"
      @click="use"
    >
      Utiliser
    </UButton>
    <span
      v-if="summary"
      class="text-xs text-muted"
    >
      {{ ability.sustained ? `Éther maximum −${ability.aether}` : summary }}
    </span>
    <span
      v-if="blockers.length"
      class="text-xs text-error"
    >
      {{ blockers[0] }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnMasteryAbility } from '~~/shared/ker-nethalas/masteries'
import {
  knAbilityBlockers,
  knAbilityIsPassive,
  knCostSummary,
  knPayAbility,
  knSustainBlockers,
  knSustainedKey,
  knToggleSustained,
} from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  ability: KnMasteryAbility
  masteryKey: string
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()

const key = computed(() => knSustainedKey(props.masteryKey, props.ability.tier))
const isOn = computed(() => (character.value.status.sustained ?? []).includes(key.value))
const summary = computed(() => knCostSummary(props.ability))

const purse = computed(() => ({
  aetherCurrent: character.value.aetherCurrent,
  healthCurrent: character.value.healthCurrent,
  exhaustion: character.value.exhaustion,
}))

const blockers = computed(() => {
  if (props.ability.sustained) return isOn.value ? [] : knSustainBlockers(props.ability, props.resolved.maxVitals.aether.effective)
  return knAbilityBlockers(props.ability, purse.value)
})

function use() {
  const paid = knPayAbility(props.ability, purse.value)
  character.value.aetherCurrent = paid.aetherCurrent
  character.value.healthCurrent = paid.healthCurrent
  character.value.exhaustion = paid.exhaustion
  toast.add({ title: `${props.ability.name} utilisée`, description: summary.value || undefined, color: 'success' })
}

function toggle() {
  const turningOn = !isOn.value
  character.value.status.sustained = knToggleSustained(character.value.status.sustained ?? [], key.value)
  // L'Éther maximum baisse du coût de l'aptitude : l'Éther actuel ne peut plus le dépasser.
  if (turningOn && props.ability.aether) {
    const newMax = props.resolved.maxVitals.aether.effective - props.ability.aether
    character.value.aetherCurrent = Math.min(character.value.aetherCurrent, newMax)
  }
}
</script>
