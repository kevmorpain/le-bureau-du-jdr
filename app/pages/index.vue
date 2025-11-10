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
const links = ref([
  {
    label: $t('home.hero.links.0'),
    to: '/spells',
    icon: 'heroicons-outline:book-open',
  },
  // {
  //   label: 'Learn more',
  //   to: '/docs/getting-started/theme/design-system',
  //   color: 'neutral',
  //   variant: 'subtle',
  //   trailingIcon: 'i-lucide-arrow-right',
  // },
])
</script>
