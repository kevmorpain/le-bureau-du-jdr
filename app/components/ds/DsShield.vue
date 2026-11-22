<template>
  <div
    class="ds-bevel ds-shape-shield shield"
    role="group"
    :aria-label="`${label} ${value}`"
  >
    <div
      class="ds-fill shield__fill"
      aria-hidden="true"
    >
      <span class="ds-label shield__label">{{ label }}</span>
      <span class="ds-number shield__value">{{ value }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { label, value } = defineProps<{ label: string, value: string | number }>()
</script>

<style scoped>
.shield {
  --ds-fill: var(--color-ds-panel-raised);
  box-sizing: border-box;
  width: 58px;
  height: 62px;
  padding: 1px 1px 3px;
}

.shield__fill {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding-top: 7px;
  box-sizing: border-box;
}

.shield__label { font-size: 9px; }
.shield__value { font-size: 17px; line-height: 1.15; color: var(--color-ds-ink); }
</style>
