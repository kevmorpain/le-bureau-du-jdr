// Relance à froid de la PWA : l'OS rouvre l'app sur « / » (le `start_url` du manifeste) → on renvoie
// l'utilisateur là où il en était (cf. app/utils/lastRoute.ts). S'exécute après `auth.global.ts`.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // Seulement au tout premier rendu client : une navigation volontaire vers
  // l'accueil (clic sur le logo) ne doit jamais être détournée.
  if (!useNuxtApp().isHydrating) return

  if (to.fullPath !== '/') return
  if (!isStandaloneDisplay()) return

  const last = readLastRoute()
  if (!last || last === to.fullPath) return

  return navigateTo(last, { replace: true })
})
