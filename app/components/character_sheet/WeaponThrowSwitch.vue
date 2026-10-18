<template>
  <template v-if="weapon.thrown">
    <div
      class="inline-flex"
      role="group"
      aria-label="Mode d'attaque"
    >
      <UButton
        size="sm"
        class="rounded-r-none"
        :color="weapon.throwing ? 'neutral' : 'primary'"
        :variant="weapon.throwing ? 'ghost' : 'soft'"
        :aria-pressed="!weapon.throwing"
        @click="emit('update:throwing', false)"
      >
        Mêlée
      </UButton>
      <UButton
        size="sm"
        class="rounded-l-none"
        :color="weapon.throwing ? 'primary' : 'neutral'"
        :variant="weapon.throwing ? 'soft' : 'ghost'"
        :aria-pressed="weapon.throwing"
        @click="emit('update:throwing', true)"
      >
        Lancer
      </UButton>
    </div>

    <template v-if="weapon.throwing">
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
        Dégâts {{ weapon.thrown.damageDice }}{{ weapon.thrown.damageBonus !== 0 ? formatModifier(weapon.thrown.damageBonus) : '' }} {{ damageTypeLabel }}
      </RollButton>
    </template>
  </template>
</template>

<script lang="ts" setup>
import { parseDice } from '~~/shared/rules/dice'
import type { WeaponStats } from '~/composables/character/useCharacterInventory'
import type { RollFn } from '~/composables/useDiceRoller'

const props = defineProps<{
  weapon: WeaponStats
  // Le libellé du type de dégâts que la ligne affiche déjà à côté : le lancer doit parler comme la mêlée.
  damageTypeLabel: string
  roll?: RollFn
}>()

const emit = defineEmits<{
  'update:throwing': [value: boolean]
}>()

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
