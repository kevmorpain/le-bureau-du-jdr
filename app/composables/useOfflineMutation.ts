import { toValue, type MaybeRefOrGetter } from 'vue'
import { readQueue, type QueuedMethod } from '~/utils/offlineQueue'

interface MutateArgs {
  endpoint: string
  method: QueuedMethod
  body?: unknown
  // Ops « remplacement complet » (fiche entière, tableau de slots) : seule la dernière est gardée.
  dedupeKey?: string
  label?: string
  // Appelé avec la réponse serveur quand la mutation passe en direct (en ligne, sans backlog).
  // Sert à réconcilier (ex. id d'une entrée d'inventaire créée).
  onServerResponse?: (res: unknown) => void
}

/**
 * Remplace les `$fetch` de mutation : en ligne et sans file en attente → requête directe ;
 * sinon (hors-ligne, ou backlog à respecter) → enfile pour rejeu. Les erreurs serveur réelles
 * (validation, 4xx) ne sont PAS enfilées (elles ne réussiraient jamais au rejeu).
 *
 * L'update optimiste de l'état local reste à la charge de l'appelant.
 */
export function useOfflineMutation(characterId: MaybeRefOrGetter<number>) {
  const { enqueue, online } = useOfflineSync()

  async function offlineMutate(args: MutateArgs): Promise<'sent' | 'queued'> {
    const id = toValue(characterId)
    const hasBacklog = readQueue(id).length > 0

    if (online.value && !hasBacklog) {
      try {
        const res = await $fetch(args.endpoint, {
          method: args.method,
          body: args.body as Record<string, unknown> | undefined,
        })
        args.onServerResponse?.(res)
        return 'sent'
      }
      catch (err) {
        // ofetch : une `response` présente = le serveur a répondu (erreur métier) → ne pas enfiler.
        if ((err as { response?: unknown })?.response) throw err
        // Sinon = échec réseau → on bascule sur la file.
      }
    }

    enqueue({
      characterId: id,
      endpoint: args.endpoint,
      method: args.method,
      body: args.body,
      dedupeKey: args.dedupeKey,
      label: args.label,
      baseVersion: getBaseVersion(id),
    })
    return 'queued'
  }

  return { offlineMutate }
}
