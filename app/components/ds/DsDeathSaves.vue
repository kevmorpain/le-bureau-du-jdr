<template>
  <div class="saves">
    <span
      :id="`${id}-ok`"
      class="ds-label saves__title saves__title--ok"
    >{{ $t('ds.death_saves.successes') }}</span>
    <div
      role="group"
      class="saves__cells saves__cells--from-center"
      :aria-labelledby="`${id}-ok`"
    >
      <button
        v-for="index in 3"
        :key="index"
        type="button"
        class="saves__cell"
        :aria-label="$t('ds.death_saves.success_n', { n: index })"
        :aria-pressed="index <= successes"
        @click="successes = index === successes ? index - 1 : index"
      >
        <DsDiamond
          size="lg"
          color="gain"
          :state="index <= successes ? 'filled' : 'empty'"
        />
      </button>
    </div>
    <span
      class="saves__divider"
      aria-hidden="true"
    />
    <div
      role="group"
      class="saves__cells"
      :aria-labelledby="`${id}-ko`"
    >
      <button
        v-for="index in 3"
        :key="index"
        type="button"
        class="saves__cell"
        :aria-label="$t('ds.death_saves.failure_n', { n: index })"
        :aria-pressed="index <= failures"
        @click="failures = index === failures ? index - 1 : index"
      >
        <DsDiamond
          size="lg"
          color="bad"
          :state="index <= failures ? 'filled' : 'empty'"
        />
      </button>
    </div>
    <span
      :id="`${id}-ko`"
      class="ds-label saves__title saves__title--ko"
    >{{ $t('ds.death_saves.failures') }}</span>
  </div>
</template>

<script lang="ts" setup>
const successes = defineModel<number>('successes', { default: 0 })
const failures = defineModel<number>('failures', { default: 0 })
const id = useId()
</script>

<style scoped>
.saves {
  display: flex;
  align-items: center;
  gap: 14px;
}

.saves__title--ok { color: var(--color-ds-gain); }
.saves__title--ko { color: var(--color-ds-bad); }

.saves__cells {
  display: flex;
  align-items: center;
  gap: 4px;
}

.saves__cells--from-center { flex-direction: row-reverse; }

.saves__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.saves__cell:focus-visible { outline: 2px solid var(--color-ds-gold); }

.saves__divider {
  width: 1px;
  height: 24px;
  background: var(--color-ds-gold-dim);
}
</style>
