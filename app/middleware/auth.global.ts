// La liste des chemins protégés vit dans `requiresAuth` (partagée et testée unitairement).
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (requiresAuth(to.path) && !loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
