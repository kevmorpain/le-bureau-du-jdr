<template>
  <div
    class="concentration"
    role="status"
  >
    <div class="concentration__head">
      <span>{{ $t('ds.concentration') }}</span>
      <span v-if="remaining">{{ remaining }}</span>
    </div>
    <div class="concentration__spell">
      {{ spell }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const { spell, remaining } = defineProps<{ spell: string, remaining?: string }>()
</script>

<style scoped>
.concentration {
  padding: 6px 11px 7px;
  background: var(--color-ds-ink);
  color: var(--color-ds-panel);
}

.concentration__head {
  display: flex;
  justify-content: space-between;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.75;
}

.concentration__spell {
  margin-top: 1px;
  font-size: 14.5px;
  font-weight: 700;
}
</style>
