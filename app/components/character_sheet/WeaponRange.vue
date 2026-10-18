<template>
  <div
    v-if="weapon.thrown || weapon.rangeChoice"
    class="space-y-1.5"
  >
    <div
      v-if="weapon.thrown"
      class="flex items-center gap-1 flex-wrap"
    >
      <span class="text-sm text-muted">Lancer</span>
      <RollButton
        size="sm"
        variant="soft"
        color="primary"
        @click="rollThrow"
      >
        Attaque {{ formatModifier(weapon.thrown.attackBonus) }}
      </RollButton>
      <RollButton
        size="sm"
        variant="soft"
        color="neutral"
        @click="rollThrowDamage"
      >
        Dégâts {{ weapon.thrown.damageDice }}{{ weapon.thrown.damageBonus !== 0 ? formatModifier(weapon.thrown.damageBonus) : '' }} {{ damageType }}
      </RollButton>
    </div>

    <div
      v-if="weapon.rangeChoice"
      class="flex items-center gap-3 flex-wrap"
    >
      <UCheckbox
        label="Longue portée"
        size="sm"
        :model-value="weapon.rangeChoice.long"
        @update:model-value="(value: boolean | 'indeterminate') => emit('range-choice', { long: value === true })"
      />
      <UCheckbox
        label="Ennemi à 1,50 m"
        size="sm"
        :model-value="weapon.rangeChoice.adjacent"
        @update:model-value="(value: boolean | 'indeterminate') => emit('range-choice', { adjacent: value === true })"
      />
      <span
        v-if="showRange && weapon.rangeText"
        class="text-sm text-muted"
      >
        Portée {{ weapon.rangeText }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { parseDice } from '~~/shared/rules/dice'
import type { RangeChoice } from '~~/shared/rules/weaponRange'
import { damageTypeLabels } from '~~/shared/utils/labels'
import type { WeaponStats } from '~/composables/character/useCharacterInventory'
import type { RollFn } from '~/composables/useDiceRoller'

const props = withDefaults(defineProps<{
  weapon: WeaponStats
  roll?: RollFn
  // L'inventaire affiche déjà la portée avec les propriétés de l'arme.
  showRange?: boolean
}>(), {
  roll: undefined,
  showRange: true,
})

const emit = defineEmits<{
  'range-choice': [patch: Partial<RangeChoice>]
}>()

const damageType = computed(() =>
  ((damageTypeLabels as Record<string, string>)[props.weapon.damageType] ?? props.weapon.damageType).toLowerCase(),
)

const rollThrow = () => {
  const thrown = props.weapon.thrown
  if (!thrown) return
  props.roll?.(`Lancer — ${props.weapon.name}`, thrown.attackBonus, 20, 1, { d20: { type: 'attack', weapon: true, extra: thrown.attackRollSources } })
}

const rollThrowDamage = () => {
  const thrown = props.weapon.thrown
  if (!thrown) return
  const { count, sides } = parseDice(thrown.damageDice) ?? { count: 1, sides: 6 }
  props.roll?.(`Dégâts (lancer) — ${props.weapon.name}`, thrown.damageBonus, sides, count, { damage: { weaponDie: { melee: false } } })
}
</script>
