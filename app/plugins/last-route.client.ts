// Mémorise la route courante pour `restore-route.global.ts`. Uniquement en PWA installée : dans un
// onglet, le navigateur restaure déjà la page lui-même.
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
