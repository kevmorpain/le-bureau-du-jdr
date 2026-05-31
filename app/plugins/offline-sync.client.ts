// Pilote la synchro hors-ligne côté client : stockage persistant, rejeu de la file au
// chargement, à la reconnexion réseau et à la reprise au premier plan (cas iPad).
// (Pas de Background Sync API sur iOS → c'est l'app qui rejoue, pas le service worker.)
export default defineNuxtPlugin(() => {
  const { online, pendingCount, flushAll, refreshPendingCount } = useOfflineSync()

  // Demande un stockage persistant pour limiter l'éviction iOS (~7 j sans usage).
  if (navigator.storage?.persist) {
    navigator.storage.persisted().then((granted) => {
      if (!granted) void navigator.storage.persist()
    }).catch(() => {})
  }

  refreshPendingCount()
  if (online.value) void flushAll()

  // Rejeu dès le retour du réseau.
  watch(online, (isOnline) => {
    if (isOnline) void flushAll()
  })

  // Reprise au premier plan (réveil de l'app sur tablette).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    refreshPendingCount()
    if (online.value) void flushAll()
  })

  // Filet de sécurité : retente tant qu'il reste des éléments en attente.
  setInterval(() => {
    if (online.value && pendingCount.value > 0) void flushAll()
  }, 30_000)
})
