import { useStorage } from '@vueuse/core'
import { NO_RANGE_CHOICE, type RangeChoice } from '~~/shared/rules/weaponRange'

// Distance de la cible et mode d'attaque (mêlée ou lancer), arme par arme : état de rencontre (comme les états et
// l'initiative), dans le navigateur, pas en base.
export const useWeaponRange = (characterId: number | undefined) => {
  // La fiche est rendue côté serveur, qui ne voit pas `localStorage` : lu dès le premier rendu, l'état différerait du
  // HTML reçu et Vue ne corrige pas les attributs d'un nœud hydraté (bascule et cases resteraient figées).
  const options = { initOnMounted: true }
  const choices = useStorage<Record<string, RangeChoice>>(characterStorageKey(characterId, 'rangeChoices'), {}, undefined, options)
  const throwing = useStorage<Record<string, boolean>>(characterStorageKey(characterId, 'throwing'), {}, undefined, options)

  const choiceOf = (entryId: number): RangeChoice => choices.value[entryId] ?? NO_RANGE_CHOICE

  const setChoice = (entryId: number, patch: Partial<RangeChoice>) => {
    choices.value = { ...choices.value, [entryId]: { ...choiceOf(entryId), ...patch } }
  }

  const isThrowing = (entryId: number): boolean => throwing.value[entryId] === true

  const setThrowing = (entryId: number, value: boolean) => {
    throwing.value = { ...throwing.value, [entryId]: value }
  }

  return { choiceOf, setChoice, isThrowing, setThrowing }
}
