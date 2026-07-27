// Mémorise la route courante pour que `restore-route.global.ts` puisse y revenir
// après une relance à froid de la PWA (cf. app/utils/lastRoute.ts).
//
// Uniquement en PWA installée : dans un onglet, le navigateur restaure déjà la page
// lui-même, et on éviterait de polluer la mémoire partagée avec la PWA (même origine).
export default defineNuxtPlugin(() => {
  if (!isStandaloneDisplay()) return

  const router = useRouter()

  router.afterEach((to) => {
    saveLastRoute(to.fullPath)
  })

  // Passage en arrière-plan : on ré-horodate, pour que le délai d'expiration coure à
  // partir du moment où l'utilisateur quitte l'app, pas de sa dernière navigation.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveLastRoute(router.currentRoute.value.fullPath)
    }
  })
})
