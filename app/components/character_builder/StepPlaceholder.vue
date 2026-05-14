<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">{{ icon }}</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">{{ label }}</h2>
        <p class="text-sm text-muted mt-0.5">{{ description }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-dashed border-(--ui-border) bg-(--ui-bg-elevated) p-12 text-center">
      <p class="text-muted italic text-sm">
        Cette étape est en cours d'implémentation…
      </p>
      <p class="text-xs text-muted/60 mt-2">
        Voir <code class="text-amber-400">docs/character-builder.md</code> pour la spécification complète.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  stepId: string
  label: string
  icon: string
  description: string
}>()
</script>
