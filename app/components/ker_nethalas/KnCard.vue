<template>
  <div class="overflow-hidden rounded-xl border border-default">
    <div
      v-if="$slots.header"
      class="flex cursor-pointer items-start gap-2 bg-elevated px-3 py-2 hover:bg-accented"
      @click="onHeaderClick"
    >
      <div class="min-w-0 flex-1">
        <slot name="header" />
        <div
          v-if="!open && $slots.summary"
          class="mt-0.5 text-xs text-muted"
        >
          <slot name="summary" />
        </div>
      </div>
      <UButton
        icon="i-heroicons:chevron-down-16-solid"
        color="neutral"
        variant="ghost"
        size="xs"
        :class="{ '-rotate-90': !open }"
        :aria-expanded="open"
        :aria-label="open ? 'Replier' : 'Déplier'"
        @click="open = !open"
      />
    </div>

    <div
      v-show="open"
      class="bg-default p-3 sm:p-4"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'

const props = withDefaults(defineProps<{
  storageKey: string
  defaultOpen?: boolean
}>(), { defaultOpen: true })

// Lu après le montage : un état mémorisé qui diffère du défaut ne fait pas échouer l'hydratation.
const open = useStorage(`kn:card:${props.storageKey}`, props.defaultOpen, undefined, { initOnMounted: true })

// Un clic sur l'en-tête replie la carte, sauf s'il vise un bouton ou un champ de l'en-tête.
function onHeaderClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('button, a, input, select, [role=combobox]')) return
  open.value = !open.value
}
</script>
