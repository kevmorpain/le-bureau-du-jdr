<template>
  <div v-if="$pwa?.needRefresh">
    <span>
      New content available, click on reload button to update.
    </span>

    <button @click="$pwa.updateServiceWorker()">
      Reload
    </button>
  </div>

  <UPageHero
    :title="$t('home.hero.title')"
    :description="$t('home.hero.description')"
    :links
  >
    <template #title>
      <i18n-t
        keypath="home.hero.title"
        tag="p"
      >
        <template #highlight>
          <span class="text-primary">
            {{ $t('home.hero.title_highlight') }}
          </span>
        </template>
      </i18n-t>
    </template>
  </UPageHero>
</template>

<script lang="ts" setup>
import type { ButtonProps } from '@nuxt/ui'

const links = ref<ButtonProps[]>([
  {
    label: $t('home.hero.links.1'),
    to: '/character/1',
    icon: 'heroicons-outline:identification',
  },
  {
    label: $t('home.hero.links.0'),
    to: '/spells',
    color: 'neutral',
    variant: 'subtle',
    icon: 'heroicons-outline:book-open',
  },
])
</script>
