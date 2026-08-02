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

const { loggedIn } = useUserSession()

const links = computed<ButtonProps[]>(() => {
  if (loggedIn.value) {
    return [
      {
        label: $t('home.hero.cta.my_characters'),
        to: '/characters',
        icon: 'heroicons-outline:identification',
      },
      {
        label: $t('home.hero.cta.new_character'),
        to: '/characters/new',
        color: 'neutral',
        variant: 'subtle',
        icon: 'heroicons-outline:plus-circle',
      },
    ]
  }

  return [
    {
      label: $t('home.hero.cta.create'),
      to: '/characters/new',
      icon: 'heroicons-outline:plus-circle',
    },
    {
      label: $t('home.hero.cta.spells'),
      to: '/spells',
      color: 'neutral',
      variant: 'subtle',
      icon: 'heroicons-outline:book-open',
    },
  ]
})
</script>
