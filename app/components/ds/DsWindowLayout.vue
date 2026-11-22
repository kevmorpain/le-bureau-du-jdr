<template>
  <div class="ds-cut-octagon flex min-h-0 flex-1 flex-col bg-ds-gold p-px font-atkinson [--ds-cut:10px]">
    <div class="ds-cut-octagon flex min-h-0 flex-1 flex-col gap-2.5 bg-ds-panel px-4 py-3.5 text-ds-ink [--ds-cut:9.6px]">
      <header class="flex items-center gap-2.5">
        <h2 class="font-bodoni text-2xl font-bold leading-tight">
          {{ title }}
        </h2>
        <DsCornerButton
          v-if="closable"
          class="ml-auto"
          label="Fermer"
          @click="emit('close')"
        />
      </header>
      <slot name="modes" />
      <div class="-mx-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1">
        <slot />
      </div>
      <footer
        v-if="$slots.footer"
        class="flex items-center justify-end gap-2.5"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Anatomie commune de la fenêtre et du tiroir : titre et fermeture, barre de modes, corps qui défile, pied fixe.
withDefaults(defineProps<{ title: string, closable?: boolean }>(), { closable: true })

const emit = defineEmits<{ close: [] }>()
</script>
