<template>
  <div class="rounded-xl overflow-hidden border border-default">
    <!-- Header -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 bg-elevated hover:bg-accented transition-colors text-left"
      @click="toggle"
    >
      <span class="flex-1 text-xs font-bold uppercase tracking-widest text-muted">
        {{ title }}
        <span
          v-if="badge != null && badge > 0"
          class="ml-2 text-[10px] bg-muted text-inverted rounded-full px-1.5 py-0.5 font-bold"
        >{{ badge }}</span>
      </span>
      <UIcon
        name="i-heroicons:chevron-down-16-solid"
        class="size-4 text-muted transition-transform duration-150 shrink-0"
        :class="{ '-rotate-90': isCollapsed }"
      />
    </button>

    <!-- Content -->
    <div
      v-if="!isCollapsed"
      class="bg-default p-3"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  title: string
  badge?: number | null
  storageKey?: string
}>()

const isCollapsed = ref(false)

onMounted(() => {
  if (props.storageKey) {
    try {
      const stored = localStorage.getItem(`cs-collapsed-${props.storageKey}`)
      if (stored !== null) isCollapsed.value = stored === 'true'
    } catch { /* localStorage non disponible */ }
  }
})

const toggle = () => {
  isCollapsed.value = !isCollapsed.value
  if (props.storageKey) {
    try {
      localStorage.setItem(`cs-collapsed-${props.storageKey}`, String(isCollapsed.value))
    } catch { /* localStorage non disponible */ }
  }
}
</script>
