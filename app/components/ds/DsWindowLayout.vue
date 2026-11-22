<template>
  <div class="ds-bevel ds-shape-octagon window">
    <div class="ds-fill window__fill">
      <header class="window__head">
        <h2 class="window__title">
          {{ title }}
        </h2>
        <DsCornerButton
          v-if="closable"
          class="window__close"
          :label="$t('ds.close')"
          @click="emit('close')"
        />
      </header>
      <slot name="modes" />
      <div class="window__body">
        <slot />
      </div>
      <footer
        v-if="$slots.footer"
        class="window__foot"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { title, closable = true } = defineProps<{ title: string, closable?: boolean }>()

const emit = defineEmits<{ close: [] }>()
</script>

<style scoped>
.window {
  --ds-cut: var(--ds-cut-panel);
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  font-family: var(--font-atkinson);
}

.window__fill {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 14px 16px;
  color: var(--color-ds-ink);
}

.window__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.window__title {
  font-family: var(--font-bodoni);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.window__close { margin-left: auto; }

.window__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  margin: 0 -4px;
  padding: 0 4px;
  overflow-y: auto;
}

.window__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
</style>
