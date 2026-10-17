import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knPermanentEffects } from '~~/shared/ker-nethalas/abilityAttack'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

// Ce que les aptitudes passives du survivant changent toujours. Le contenu des Maîtrises est partagé avec la page (même clé).
export function useKnPermanent(character: Ref<KnCharacter>) {
  const { data: masteries } = useKnContent<KnMastery[]>('masteries')
  return computed(() => knPermanentEffects(masteries.value ?? [], knMasteryEntries(character.value.masteryPicks, character.value.amulets)))
}
