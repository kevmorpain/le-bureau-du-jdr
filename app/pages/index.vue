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

  <!-- Enrichissement connecté : la home reste publique et « déconnecté d'abord »,
       cette section n'apparaît que si une session est résolue ET qu'il y a des
       personnages. `loggedIn` est lu côté serveur (cookie scellé) → rendu SSR,
       sans « pop » après hydratation pour un utilisateur connecté. -->
  <UPageBody v-if="loggedIn && hasCharacters">
    <div class="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-semibold">
          {{ $t('home.recent.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ $t('home.recent.description') }}
        </p>
      </div>

      <UButton
        to="/characters"
        :label="$t('home.recent.see_all')"
        color="neutral"
        variant="link"
        trailing-icon="heroicons-outline:arrow-right"
        class="shrink-0"
      />
    </div>

    <UPageGrid>
      <NuxtLink
        v-for="character in recentCharacters"
        :key="character.id"
        :to="`/characters/${character.id}`"
      >
        <CharacterCard :character />
      </NuxtLink>
    </UPageGrid>
  </UPageBody>
</template>

<script lang="ts" setup>
import type { ButtonProps } from '@nuxt/ui'

const { loggedIn } = useUserSession()

// Endpoint protégé (401 pour l'anonyme) : on ne le sollicite que si une session
// existe. `immediate` fige le booléen au setup ; `watch` relance si l'état bascule.
const { data: characters } = await useFetch<CharacterSheet[]>('/api/character_sheets', {
  immediate: loggedIn.value,
  watch: [loggedIn],
  default: () => [],
})

// Tri décroissant sur des dates ISO (comparaison lexicographique valide), 3 max.
const recentCharacters = computed<CharacterSheet[]>(() =>
  [...(characters.value ?? [])]
    .sort((a, b) => (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? ''))
    .slice(0, 3),
)

const hasCharacters = computed<boolean>(() => recentCharacters.value.length > 0)

// CTA honnêtes et contextuels :
// - connecté avec des persos → « Mes personnages » d'abord (le cas le plus courant au retour) ;
// - sinon (anonyme, ou connecté sans perso) → « Créer un personnage ». Un anonyme qui clique
//   passe naturellement par /login (garde d'auth) puis revient sur /characters/new.
const links = computed<ButtonProps[]>(() => {
  if (loggedIn.value && hasCharacters.value) {
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
