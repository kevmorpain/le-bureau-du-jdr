// Garde de navigation. La liste des chemins protégés vit dans `requiresAuth`
// (app/utils/requiresAuth.ts), partagée et testée unitairement.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (requiresAuth(to.path) && !loggedIn.value) {
    // On mémorise la destination voulue pour y revenir après connexion
    // (cf. app/pages/login.vue + callbacks OAuth).
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
