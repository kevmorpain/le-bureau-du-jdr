<template>
  <div class="flex items-center gap-3.5">
    <span
      :id="`${id}-ok`"
      class="ds-label text-ds-gain"
    >Succès</span>
    <div
      role="group"
      class="flex flex-row-reverse items-center gap-1"
      :aria-labelledby="`${id}-ok`"
    >
      <button
        v-for="index in 3"
        :key="index"
        type="button"
        class="flex size-8 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-ds-gold"
        :aria-label="`${index} succès sur 3`"
        :aria-pressed="index <= successes"
        @click="successes = index === successes ? index - 1 : index"
      >
        <DsDiamond
          size="lg"
          color="gain"
          :state="index <= successes ? 'full' : 'empty'"
        />
      </button>
    </div>
    <span
      class="h-6 w-px bg-ds-gold-dim"
      aria-hidden="true"
    />
    <div
      role="group"
      class="flex items-center gap-1"
      :aria-labelledby="`${id}-ko`"
    >
      <button
        v-for="index in 3"
        :key="index"
        type="button"
        class="flex size-8 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-ds-gold"
        :aria-label="`${index} échec sur 3`"
        :aria-pressed="index <= failures"
        @click="failures = index === failures ? index - 1 : index"
      >
        <DsDiamond
          size="lg"
          color="bad"
          :state="index <= failures ? 'full' : 'empty'"
        />
      </button>
    </div>
    <span
      :id="`${id}-ko`"
      class="ds-label text-ds-bad"
    >Échecs</span>
  </div>
</template>

<script lang="ts" setup>
const successes = defineModel<number>('successes', { default: 0 })
const failures = defineModel<number>('failures', { default: 0 })
const id = useId()
</script>
