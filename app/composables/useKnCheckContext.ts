import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

interface KnCheckContext {
  character: Ref<KnCharacter>
  resolved: ComputedRef<KnResolvedSheet>
}

const KEY: InjectionKey<KnCheckContext> = Symbol('kn-check-context')

// Les tests faits dans le bloc d'une salle ont besoin de la fiche et de ses scores effectifs sans les faire descendre
// de composant en composant.
export const provideKnCheckContext = (context: KnCheckContext) => provide(KEY, context)

export function useKnCheckContext(): KnCheckContext {
  const context = inject(KEY)
  if (!context) throw new Error('Un test en ligne se fait dans la section du run')
  return context
}
