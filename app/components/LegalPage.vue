<template>
  <article
    class="max-w-3xl mx-auto py-8 space-y-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline"
  >
    <h1 class="text-3xl font-bold">
      {{ title }}
    </h1>
    <p class="text-sm text-muted">
      Dernière mise à jour : {{ LEGAL_UPDATED_AT }}
    </p>
    <slot />
  </article>
</template>

<script lang="ts" setup>
import { LEGAL_UPDATED_AT } from '~/data/legal'

const props = defineProps<{ title: string }>()

useHead({ title: () => `${props.title} — Le Bureau du JDR` })
</script>
