<template>
  <!-- Métadonnées d'objet magique : badge de rareté + harmonisation par instance. Rien si
       l'objet n'est ni magique (rarity null) ni harmonisable. Placé dans la ligne d'inventaire. -->
  <template v-if="entry.item && (entry.item.rarity || entry.item.requiresAttunement)">
    <UBadge
      v-if="entry.item.rarity"
      :label="RARITY_LABELS_FR[entry.item.rarity]"
      :color="rarityColor"
      variant="soft"
      size="md"
      class="shrink-0"
    />
    <UTooltip
      v-if="entry.item.requiresAttunement"
      :text="attunementTooltip"
    >
      <div
        class="flex items-center gap-1 shrink-0"
        @click.stop
      >
        <USwitch
          :model-value="entry.attuned"
          :disabled="limitReached"
          size="md"
          :aria-label="entry.attuned ? 'Retirer l\'harmonisation' : 'Harmoniser'"
          @update:model-value="emit('toggleAttune', entry.id)"
        />
        <span class="text-xs text-muted">{{ entry.attuned ? 'Harmonisé' : 'À harmoniser' }}</span>
      </div>
    </UTooltip>
  </template>
</template>

<script lang="ts" setup>
import type { InventoryEntry } from '~/composables/character/useCharacterInventory'
import { ATTUNEMENT_LIMIT } from '~~/shared/rules/attunement'
import { RARITY_LABELS_FR, type Rarity } from '~~/shared/rules/itemRarity'

const props = defineProps<{
  entry: InventoryEntry
  // Le personnage a atteint la limite d'objets harmonisés : on ne peut plus qu'en retirer un.
  attunementFull?: boolean
}>()
const emit = defineEmits<{ toggleAttune: [entryId: number] }>()

// Rareté → couleur de badge (Nuxt UI). Du plus commun au plus rare.
const RARITY_COLOR: Record<Rarity, 'neutral' | 'success' | 'info' | 'primary' | 'warning' | 'error'> = {
  common: 'neutral',
  uncommon: 'success',
  rare: 'info',
  very_rare: 'primary',
  legendary: 'warning',
  artifact: 'error',
}
const rarityColor = computed(() => props.entry.item?.rarity ? RARITY_COLOR[props.entry.item.rarity] : 'neutral')

const limitReached = computed(() => !props.entry.attuned && props.attunementFull === true)

const attunementTooltip = computed(() => {
  if (limitReached.value) return `Limite de ${ATTUNEMENT_LIMIT} objets harmonisés atteinte : retire l'harmonisation d'un autre objet`
  const note = props.entry.item?.attunementNote
  const base = props.entry.attuned ? 'Objet harmonisé' : 'Nécessite une harmonisation'
  return note ? `${base} — ${note}` : base
})
</script>
