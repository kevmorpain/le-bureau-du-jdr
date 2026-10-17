<template>
  <UCard>
    <template
      v-if="$slots.header"
      #header
    >
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <slot name="header" />
        </div>
        <UButton
          :icon="open ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-expanded="open"
          :aria-label="open ? 'Replier' : 'Déplier'"
          @click="open = !open"
        />
      </div>
    </template>

    <div v-show="open">
      <slot />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'

const props = withDefaults(defineProps<{
  storageKey: string
  defaultOpen?: boolean
}>(), { defaultOpen: true })

// Lu après le montage : un état mémorisé qui diffère du défaut ne fait pas échouer l'hydratation.
const open = useStorage(`kn:card:${props.storageKey}`, props.defaultOpen, undefined, { initOnMounted: true })
</script>
