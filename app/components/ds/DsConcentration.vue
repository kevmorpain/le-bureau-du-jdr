<template>
  <div
    class="concentration"
    :class="{ 'concentration--inline': isInline }"
    role="status"
  >
    <div class="concentration__head">
      <span>{{ $t('ds.concentration') }}</span>
      <span
        v-if="remaining"
        class="concentration__remaining"
      >{{ remaining }}</span>
    </div>
    <div class="concentration__spell">
      {{ spell }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const { spell, remaining, isInline = false } = defineProps<{ spell: string, remaining?: string, isInline?: boolean }>()
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

.concentration--inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
}

/* `display: contents` drops the head's box, and its opacity with it: the dimming moves to its children. */
.concentration--inline .concentration__head { display: contents; }
.concentration--inline .concentration__head > span { opacity: 0.75; }
.concentration--inline .concentration__remaining { order: 1; margin-left: auto; }

.concentration--inline .concentration__spell {
  margin-top: 0;
  font-size: 12.5px;
}
</style>
