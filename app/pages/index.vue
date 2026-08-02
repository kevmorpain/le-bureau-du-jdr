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

// CTA honnêtes et contextuels (la home reste un point d'entrée, elle n'affiche
// pas les persos). `loggedIn` est lu côté serveur (cookie scellé) → rendu SSR,
// pas de « pop » après hydratation.
// - connecté → « Mes personnages » d'abord (le cas le plus courant au retour) ;
// - anonyme → « Créer un personnage ». Un anonyme qui clique passe naturellement
//   par /login (garde d'auth) puis revient sur /characters/new.
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
