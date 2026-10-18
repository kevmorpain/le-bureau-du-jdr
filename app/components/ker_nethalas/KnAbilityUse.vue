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
    <template v-else-if="ability.project">
      <USelect
        v-model="projectCount"
        :items="projectItems"
        class="w-44"
        :aria-label="`${ability.name} : nombre de pièces`"
      />
      <UButton
        size="xs"
        variant="soft"
        :disabled="blockers.length > 0 || !canProject"
        @click="project"
      >
        Projeter
      </UButton>
      <span
        v-if="!canProject"
        class="text-xs text-muted"
      >Pas dans le Domaine d'introduction</span>
    </template>
    <template v-else-if="ability.engrave">
      <USelect
        v-model="engraveTarget"
        :items="engraveItems"
        placeholder="Arme à graver"
        class="w-52"
        :aria-label="`${ability.name} : arme à graver`"
      />
      <UButton
        size="xs"
        variant="soft"
        :disabled="!engraveTarget || blockers.length > 0"
        @click="engrave"
      >
        Graver
      </UButton>
    </template>
    <UButton
      v-else
      size="xs"
      variant="soft"
      :disabled="blockers.length > 0"
      :aria-label="`${knAbilityIsPassive(ability) && !ability.self?.length ? 'Marquer comme utilisée' : 'Utiliser'} ${ability.name}`"
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
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knEngravableWeapons, knEngrave } from '~~/shared/ker-nethalas/abilityAttack'
import { knForesight, knProjectRooms } from '~~/shared/ker-nethalas/foresight'
import { knCurrentDomain } from '~~/shared/ker-nethalas/run'
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

const missingProvisions = computed(() => Object.entries(props.ability.provisions ?? {}).some(([key, count]) => character.value.provisions[key as keyof typeof character.value.provisions] < count))

const blockers = computed(() => {
  if (props.ability.sustained) return isOn.value ? [] : knSustainBlockers(props.ability, props.resolved.maxVitals.aether.effective)
  if (used.value) return ['Déjà utilisée']
  return [...knAbilityBlockers(props.ability, purse.value), ...(missingProvisions.value ? ['Provisions insuffisantes'] : [])]
})

const projectCount = ref(props.ability.project ?? 1)
const projectItems = computed<SelectItem[]>(() => Array.from({ length: props.ability.project ?? 1 }, (_, index) => ({ label: `${index + 1} pièce${index ? 's' : ''}`, value: index + 1 })))
const canProject = computed(() => !knCurrentDomain(character.value.run).intro)

// Projeter l'esprit : les prochaines entrées nouvelles du Domaine sont tirées d'avance, et gardées pour l'entrée réelle.
function project() {
  const c = character.value
  const paid = knPayAbility(props.ability, purse.value)
  c.aetherCurrent = paid.aetherCurrent
  c.healthCurrent = paid.healthCurrent
  c.exhaustion = paid.exhaustion
  c.status = props.ability.limit ? knMarkUsed(c.status, key.value, props.ability.limit) : c.status
  c.run = knProjectRooms(c.run, projectCount.value)
  toast.add({ title: `${props.ability.name} : ${knForesight(c.run).length} pièce(s) pressentie(s)`, description: 'Elles s\'affichent dans la colonne de la pièce.', color: 'success' })
}

const engraveTarget = ref<string | undefined>()
const engraveItems = computed<SelectItem[]>(() => knEngravableWeapons(character.value.inventory).map(item => ({ label: item.name, value: item.id })))

// Les provisions que l'usage consomme.
function payProvisions(c: KnCharacter) {
  for (const [key, count] of Object.entries(props.ability.provisions ?? {})) {
    const provision = key as keyof typeof c.provisions
    c.provisions = { ...c.provisions, [provision]: Math.max(0, c.provisions[provision] - count) }
  }
}

function engrave() {
  const c = character.value
  if (!engraveTarget.value || !props.ability.engrave) return
  const paid = knPayAbility(props.ability, purse.value)
  c.aetherCurrent = paid.aetherCurrent
  c.healthCurrent = paid.healthCurrent
  c.exhaustion = paid.exhaustion
  payProvisions(c)
  c.inventory = knEngrave(c.inventory, engraveTarget.value, props.ability.engrave)
  toast.add({ title: `${props.ability.name} : arme gravée`, description: knCostSummary(props.ability) || undefined, color: 'success' })
  engraveTarget.value = undefined
}

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
  const marked = props.ability.limit ? knMarkUsed(state.status, key.value, props.ability.limit) : state.status
  c.status = props.ability.combatModifier?.length
    ? { ...marked, custom: [...marked.custom, { id: crypto.randomUUID(), name: props.ability.name, active: true, entries: props.ability.combatModifier, combat: true }] }
    : marked
  payProvisions(c)

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
  if (props.ability.health && state.health === 0) toast.add({ title: 'La Santé tombe à 0 : le survivant meurt.', color: 'error' })
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
