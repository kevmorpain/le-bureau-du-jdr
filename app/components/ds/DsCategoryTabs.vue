<template>
  <div
    role="tablist"
    :aria-label="label"
    class="tabs"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="tab"
      :aria-selected="option.value === model"
      class="tab"
      :class="{ 'tab--on': option.value === model }"
      @click="model = option.value"
    >
      <DsIcon
        v-if="option.icon"
        :name="option.icon"
        :size="14"
      />
      {{ option.label }}
      <span
        v-if="option.count !== undefined"
        class="tab__count"
      >{{ option.count }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string | number">
import type { DsIconName } from './DsIcon.vue'
import type { DsOption } from './DsSegmented.vue'

const { options, label } = defineProps<{ options: (DsOption<T> & { count?: number, icon?: DsIconName })[], label: string }>()
const model = defineModel<T>()
</script>

<style scoped>
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0 18px;
  border-bottom: 1px solid var(--color-ds-line);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: -1px;
  padding: 6px 0 7px;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-ds-mute);
  cursor: pointer;
}

.tab:hover { color: var(--color-ds-ink); }
.tab:focus-visible { outline: 2px solid var(--color-ds-gold); }

.tab--on {
  border-bottom-color: var(--color-ds-gold);
  color: var(--color-ds-ink);
}

.tab__count {
  font-size: 11px;
  color: var(--color-ds-faint);
}

.tab--on .tab__count { color: var(--color-ds-gold); }
</style>
