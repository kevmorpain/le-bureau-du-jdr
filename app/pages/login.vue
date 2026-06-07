<template>
  <div class="flex items-center justify-center min-h-[70vh] p-4">
    <UPageCard class="w-full max-w-sm">
      <UAlert
        v-if="hasError"
        color="error"
        variant="subtle"
        icon="heroicons:exclamation-triangle"
        title="La connexion a échoué"
        description="Réessaie de te connecter."
        class="mb-4"
      />

      <UAuthForm
        :providers="providers"
        title="Connexion"
        description="Connecte-toi pour créer et gérer tes fiches de personnage."
        icon="heroicons:user-circle"
      />
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const hasError = computed(() => route.query.error === 'oauth')

// OAuth-only : les providers sont de simples boutons-liens vers les routes
// serveur (server/routes/auth/*). Pas de `fields` → UAuthForm n'affiche ni
// formulaire ni bouton submit (cf. source du composant).
const providers: ButtonProps[] = [
  { label: 'Continuer avec Discord', icon: 'simple-icons:discord', to: '/auth/discord', external: true },
  { label: 'Continuer avec Google', icon: 'simple-icons:google', to: '/auth/google', external: true },
]

// Un utilisateur déjà connecté n'a rien à faire ici.
const { loggedIn } = useUserSession()
watchEffect(() => {
  if (loggedIn.value) navigateTo('/characters')
})
</script>
