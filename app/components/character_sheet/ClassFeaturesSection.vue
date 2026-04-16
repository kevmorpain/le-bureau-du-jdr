<template>
  <div class="space-y-2">
    <ul class="space-y-1">
      <li
        v-for="feature in resolvedFeatures"
        :key="feature.id"
        class="rounded-lg bg-default ring ring-default p-2"
      >
        <UCollapsible>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon
                v-if="feature.actionType"
                :name="actionTypeIcon(feature.actionType)"
                class="size-4 flex-shrink-0 text-muted"
              />
              <h3 class="font-semibold truncate">
                {{ feature.name }}
              </h3>
            </div>

            <div
              v-if="feature.maxUses !== null"
              class="flex items-center gap-1 flex-shrink-0"
            >
              <button
                v-for="i in feature.maxUses"
                :key="i"
                class="size-4 rounded-full border-2 transition-colors"
                :class="i <= feature.currentUses
                  ? 'bg-primary border-primary'
                  : 'bg-transparent border-muted'"
                :aria-label="i <= feature.currentUses ? 'Utilisation dépensée' : 'Utilisation disponible'"
                @click="toggleUse(feature.id, feature.currentUses, feature.maxUses!, i)"
              />
              <UBadge
                v-if="feature.rechargeType"
                :label="rechargeLabel(feature.rechargeType)"
                variant="soft"
                size="xs"
                class="ml-1"
              />
            </div>
          </div>

          <template #content>
            <p class="text-sm text-muted mt-2 whitespace-pre-line">
              {{ feature.description }}
            </p>
          </template>
        </UCollapsible>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const { resolvedFeatures } = useCharacterSheet(toRef(props, 'characterSheet'))

const toaster = useToast()

const actionTypeIcon = (actionType: string) => {
  const icons: Record<string, string> = {
    action: 'i-heroicons:bolt',
    bonus_action: 'i-heroicons:plus-circle',
    reaction: 'i-heroicons:arrow-uturn-left',
    free: 'i-heroicons:star',
  }
  return icons[actionType] ?? 'i-heroicons:bolt'
}

const rechargeLabel = (rechargeType: string) => {
  const labels: Record<string, string> = {
    short_rest: 'Repos court',
    long_rest: 'Repos long',
    dawn: 'À l\'aube',
  }
  return labels[rechargeType] ?? rechargeType
}

const toggleUse = async (featureId: number, currentUses: number, maxUses: number, slot: number) => {
  // clicking a filled slot: decrement, clicking empty slot: increment
  const newUses = slot <= currentUses ? slot - 1 : slot

  try {
    await $fetch(`/api/character_sheets/${props.characterSheet.id}/features`, {
      method: 'PUT',
      body: [{ featureId, currentUses: newUses }],
    })
    // Optimistically update in place via the parent's character sheet reactive ref
    const cf = props.characterSheet.features?.find(f => f.featureId === featureId)
    if (cf) cf.currentUses = newUses
  }
  catch {
    toaster.add({ title: 'Erreur lors de la mise à jour', color: 'error' })
  }
}
</script>
