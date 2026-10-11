// Un jeu de données du livre, chargé hors du dépôt : `data` reste `null` tant qu'il n'est pas chargé (404), et
// l'interface doit alors fonctionner sans lui. À attendre dans `setup`, comme `useFetch`, pour que le serveur le rende.
export function useKnContent<T>(name: string) {
  return useFetch<T | null>(`/api/ker-nethalas/content/${name}`, {
    key: `kn-content-${name}`,
    default: () => null,
  })
}
