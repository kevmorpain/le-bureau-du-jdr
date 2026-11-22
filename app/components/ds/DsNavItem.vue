<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :aria-current="active ? 'page' : undefined"
    class="nav"
    :class="{ 'nav--active': active }"
  >
    <span
      class="nav__icon"
      aria-hidden="true"
    ><slot name="icon" /></span>
    {{ label }}
  </component>
</template>

<script lang="ts" setup>
import { NuxtLink } from '#components'
import type { RouteLocationRaw } from 'vue-router'

const { label, active = false, to } = defineProps<{ label: string, active?: boolean, to?: RouteLocationRaw }>()
</script>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 64px;
  padding: 10px 0 9px;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-ds-faint);
  cursor: pointer;
}

.nav:hover { color: var(--color-ds-mute); }
.nav:focus-visible { outline: 2px solid var(--color-ds-gold); }

.nav--active,
.nav--active:hover {
  color: var(--color-ds-gold);
  background: radial-gradient(ellipse at 50% 38%, var(--color-ds-glow), transparent 70%);
}

.nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}
</style>
