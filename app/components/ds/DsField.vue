<template>
  <DsFrame
    shape="corner"
    :cut="6"
    :tone="invalid ? 'bad' : 'gold-dim'"
    fill="bg"
    :padded="false"
    class="inline-flex focus-within:bg-ds-gold"
  >
    <slot />
  </DsFrame>
</template>

<script lang="ts" setup>
// Cadre commun des champs : seul ce qui est éditable a un cadre doré.
withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false })
</script>
