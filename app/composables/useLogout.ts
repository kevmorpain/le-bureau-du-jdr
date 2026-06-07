/**
 * Déconnexion : efface la session puis purge les caches PWA contenant des
 * données de fiches (NetworkFirst `api-character` + `pages` dans nuxt.config),
 * pour qu'un appareil partagé ne ré-affiche pas les fiches du compte précédent.
 */
export function useLogout() {
  const { clear } = useUserSession()

  async function logout() {
    await clear()

    if (import.meta.client && typeof caches !== 'undefined') {
      await Promise.all([
        caches.delete('api-character'),
        caches.delete('pages'),
      ])
    }

    await navigateTo('/login')
  }

  return { logout }
}
