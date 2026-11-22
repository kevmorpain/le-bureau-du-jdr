<template>
  <span
    class="ds-bevel ds-shape-corner badge"
    :class="[`badge--${variant}`, `badge--on-${surface}`]"
    :data-variant="variant"
  >
    <span class="ds-fill badge__fill">
      <slot>{{ label }}</slot>
    </span>
  </span>
</template>

<script lang="ts" setup>
export type DsBadgeVariant = 'default' | 'equipped' | 'attuned' | 'stowed' | 'new'
export type DsSurface = 'panel' | 'panel-raised' | 'bg'

const { label, variant = 'default', surface = 'panel' } = defineProps<{
  label?: string
  variant?: DsBadgeVariant
  surface?: DsSurface
}>()
</script>

<style scoped>
/* La hauteur se fixe sur la couche extérieure : sinon une rangée en flex l'étire sous la couche de fond. */
.badge {
  --ds-cut: var(--ds-cut-tag);
  --text: var(--color-ds-gold);
  display: inline-flex;
  height: 18px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.badge--on-panel { --ds-fill: var(--color-ds-panel); }
.badge--on-panel-raised { --ds-fill: var(--color-ds-panel-raised); }
.badge--on-bg { --ds-fill: var(--color-ds-bg); }

.badge--default { --ds-edge-color: var(--color-ds-gold-dim); }

.badge--stowed {
  --ds-edge-color: var(--color-ds-line);
  --text: var(--color-ds-mute);
}

.badge--new {
  --ds-edge-color: var(--color-ds-gain);
  --text: var(--color-ds-gain);
  height: 16px;
  font-size: 9.5px;
  letter-spacing: 0.08em;
}

.badge--equipped,
.badge--attuned {
  --ds-edge: 0px;
  --text: var(--color-ds-bg);
}

.badge--equipped { --ds-fill: var(--color-ds-gold); }
.badge--attuned { --ds-fill: var(--color-ds-gain); }

.badge__fill {
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 6px;
  color: var(--text);
}

.badge--new .badge__fill { padding: 0 5px; }
.badge--equipped .badge__fill,
.badge--attuned .badge__fill { padding: 0 7px; }
</style>
