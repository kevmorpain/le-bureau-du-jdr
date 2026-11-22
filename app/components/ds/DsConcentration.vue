<template>
  <div
    class="bg-ds-ink px-[11px] pb-[7px] pt-1.5 text-ds-panel"
    role="status"
  >
    <div class="flex justify-between text-[9.5px] font-bold uppercase tracking-[0.16em] opacity-75">
      <span>Concentration</span>
      <span v-if="remaining">{{ remaining }}</span>
    </div>
    <div class="mt-px text-[14.5px] font-bold">
      {{ spell }}
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ spell: string, remaining?: string }>()
</script>
