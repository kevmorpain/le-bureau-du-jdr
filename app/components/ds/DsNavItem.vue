<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :aria-current="active ? 'page' : undefined"
    class="flex w-16 cursor-pointer flex-col items-center gap-1 pb-[9px] pt-2.5 text-[10px] font-bold focus-visible:outline-2 focus-visible:outline-ds-gold"
    :class="active
      ? 'bg-[radial-gradient(ellipse_at_50%_38%,var(--color-ds-glow),transparent_70%)] text-ds-gold'
      : 'text-ds-faint hover:text-ds-mute'"
  >
    <span
      class="flex size-[22px] items-center justify-center"
      aria-hidden="true"
    ><slot name="icon" /></span>
    {{ label }}
  </component>
</template>

<script lang="ts" setup>
import { NuxtLink } from '#components'
import type { RouteLocationRaw } from 'vue-router'

withDefaults(defineProps<{ label: string, active?: boolean, to?: RouteLocationRaw }>(), { active: false, to: undefined })
</script>
