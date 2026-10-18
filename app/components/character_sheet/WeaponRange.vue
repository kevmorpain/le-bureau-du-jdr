<template>
  <div
    v-if="visible"
    class="flex items-center justify-end gap-3 flex-wrap"
  >
    <UCheckbox
      label="Longue portée"
      size="sm"
      :model-value="weapon.rangeChoice!.long"
      @update:model-value="(value: boolean | 'indeterminate') => emit('range-choice', { long: value === true })"
    />
    <UCheckbox
      label="Ennemi à 1,50 m"
      size="sm"
      :model-value="weapon.rangeChoice!.adjacent"
      @update:model-value="(value: boolean | 'indeterminate') => emit('range-choice', { adjacent: value === true })"
    />
    <span
      v-if="showRange && weapon.rangeText"
      class="text-sm text-muted"
    >
      Portée {{ weapon.rangeText }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { RangeChoice } from '~~/shared/rules/weaponRange'
import type { WeaponStats } from '~/composables/character/useCharacterInventory'

// Distance de la cible : ne pèse que sur un tir ou un lancer, donc cachée tant qu'une arme à lancer est en mode Mêlée.
const props = withDefaults(defineProps<{
  weapon: WeaponStats
  // L'inventaire affiche déjà la portée avec les propriétés de l'arme.
  showRange?: boolean
}>(), {
  showRange: true,
})

const emit = defineEmits<{
  'range-choice': [patch: Partial<RangeChoice>]
}>()

const visible = computed(() => props.weapon.rangeChoice !== null && (!props.weapon.thrown || props.weapon.throwing))
</script>
