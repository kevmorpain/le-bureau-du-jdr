<template>
  <div>
    <div class="flex items-center gap-2 mb-1.5">
      <label class="text-xs font-bold uppercase tracking-widest text-muted flex-1">{{ label }}</label>
      <button
        v-if="suggestions.length"
        type="button"
        class="text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer"
        :class="open
          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
          : 'border-(--ui-border) text-muted hover:border-amber-500/40'"
        @click="open = !open"
      >
        {{ open ? '▾ Suggestions' : '+ Suggestions' }}
      </button>
    </div>

    <!-- Panel suggestions -->
    <div
      v-if="open && suggestions.length"
      class="mb-2 p-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) space-y-1"
    >
      <button
        v-for="(suggestion, i) in suggestions"
        :key="i"
        type="button"
        class="w-full text-left text-xs px-2.5 py-1.5 rounded-md border border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/50 hover:text-(--ui-text) transition-colors cursor-pointer leading-relaxed"
        @click="pick(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>

    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      rows="3"
      class="w-full px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-(--ui-text) placeholder-muted focus:border-amber-500/50 focus:outline-none resize-none leading-relaxed"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  placeholder: string
  modelValue: string
  suggestions: string[]
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)

function pick(suggestion: string) {
  emit('update:modelValue', suggestion)
  open.value = false
}
</script>
