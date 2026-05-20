<template>
  <UTooltip :text="label">
    <span
      class="inline-flex items-center justify-center size-4 shrink-0"
      :aria-label="label"
    >
      <!-- Action : cercle plein vert -->
      <span
        v-if="type === 'action'"
        class="size-3 rounded-full"
        style="background: #22c55e"
      />
      <!-- Action bonus : triangle plein orange -->
      <span
        v-else-if="type === 'bonus_action'"
        class="size-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent"
        style="border-bottom-color: #f97316"
      />
      <!-- Réaction : losange plein rose -->
      <span
        v-else-if="type === 'reaction'"
        class="size-2.5 rotate-45"
        style="background: #f472b6"
      />
      <!-- Gratuite : étoile via game-icons -->
      <UIcon
        v-else-if="type === 'free'"
        name="i-game-icons:star-formation"
        class="size-3.5 text-blue-400"
      />
    </span>
  </UTooltip>
</template>

<script lang="ts" setup>
const props = defineProps<{
  type: 'action' | 'bonus_action' | 'reaction' | 'free'
}>()

const labels: Record<string, string> = {
  action: 'Action',
  bonus_action: 'Action bonus',
  reaction: 'Réaction',
  free: 'Action gratuite',
}

const label = computed(() => labels[props.type] ?? props.type)
</script>
