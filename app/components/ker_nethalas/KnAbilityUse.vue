<template>
  <div
    v-if="knAbilityIsUsable(ability)"
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
      :aria-label="`${knAbilityIsPassive(ability) ? 'Marquer comme utilisée' : 'Utiliser'} ${ability.name}`"
      @click="use"
    >
      {{ knAbilityIsPassive(ability) && !ability.self?.length ? 'Marquer utilisée' : 'Utiliser' }}
    </UButton>
    <UButton
      v-if="used"
      size="xs"
      variant="ghost"
      color="neutral"
      :aria-label="`Annuler l'utilisation de ${ability.name}`"
      @click="character.status = knUnmarkUsed(character.status, key)"
    >
      Annuler
    </UButton>
    <span
      v-if="summary"
      class="text-xs text-muted"
    >
      {{ ability.sustained ? `Éther maximum −${ability.aether}` : summary }}
    </span>
    <span
      v-if="ability.limit"
      class="text-xs text-muted"
    >
      {{ knUseLimitLabel[ability.limit] }}
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
  knAbilityIsUsable,
  knApplySelfEffects,
  knCostSummary,
  knIsUsedUp,
  knMarkUsed,
  knPayAbility,
  knSustainBlockers,
  knSustainedKey,
  knToggleSustained,
  knUnmarkUsed,
  knUseLimitLabel,
} from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  ability: KnMasteryAbility
  masteryKey: string
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()
const { t } = useI18n()

const key = computed(() => knSustainedKey(props.masteryKey, props.ability.tier))
const isOn = computed(() => (character.value.status.sustained ?? []).includes(key.value))
const used = computed(() => knIsUsedUp(character.value.status, key.value))
const summary = computed(() => knCostSummary(props.ability))

const purse = computed(() => ({
  aetherCurrent: character.value.aetherCurrent,
  healthCurrent: character.value.healthCurrent,
  exhaustion: character.value.exhaustion,
}))

const blockers = computed(() => {
  if (props.ability.sustained) return isOn.value ? [] : knSustainBlockers(props.ability, props.resolved.maxVitals.aether.effective)
  if (used.value) return ['Déjà utilisée']
  return knAbilityBlockers(props.ability, purse.value)
})

const vitalName = (vital: string) => t(`ker_nethalas.vitals.${vital}`).toLowerCase()

function use() {
  const c = character.value
  const paid = knPayAbility(props.ability, purse.value)
  const { state, outcomes } = knApplySelfEffects(props.ability.self ?? [], {
    toughness: c.toughnessCurrent,
    toughnessMax: props.resolved.maxVitals.toughness.effective,
    health: paid.healthCurrent,
    healthMax: props.resolved.maxVitals.health.effective,
    sanity: c.sanityCurrent,
    sanityMax: props.resolved.maxVitals.sanity.effective,
    aether: paid.aetherCurrent,
    aetherMax: props.resolved.maxVitals.aether.effective,
    status: c.status,
  })

  c.toughnessCurrent = state.toughness
  c.healthCurrent = state.health
  c.sanityCurrent = state.sanity
  c.aetherCurrent = state.aether
  c.exhaustion = paid.exhaustion
  c.status = props.ability.limit ? knMarkUsed(state.status, key.value, props.ability.limit) : state.status

  const lines = outcomes.map(({ effect, label, roll }) => {
    const detail = `${label} : ${roll.rolls.length ? roll.rolls.join(' + ') : roll.total}`
    if (effect.kind === 'woundsHeal') return `${roll.total} Blessures soignées (${detail})`
    if (effect.kind === 'temporary') return `+${roll.total} ${vitalName(effect.vital)} temporaire (${detail})`
    return `${vitalName(effect.vital)} +${roll.total} (${detail})`
  })
  toast.add({
    title: knAbilityIsPassive(props.ability) ? `${props.ability.name} : utilisée` : `${props.ability.name} utilisée`,
    description: [summary.value, ...lines].filter(Boolean).join(' · ') || undefined,
    color: 'success',
  })
}

function toggle() {
  const turningOn = !isOn.value
  character.value.status = { ...character.value.status, sustained: knToggleSustained(character.value.status.sustained ?? [], key.value) }
  // L'Éther maximum baisse du coût de l'aptitude : l'Éther actuel ne peut plus le dépasser.
  if (turningOn && props.ability.aether) {
    const newMax = props.resolved.maxVitals.aether.effective - props.ability.aether
    character.value.aetherCurrent = Math.min(character.value.aetherCurrent, newMax)
  }
}
</script>
