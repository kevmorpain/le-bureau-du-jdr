// Garde de navigation. La liste des chemins protégés vit dans `requiresAuth`
// (app/utils/requiresAuth.ts), partagée et testée unitairement.
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (requiresAuth(to.path) && !loggedIn.value) {
    return navigateTo('/login')
  }
})
