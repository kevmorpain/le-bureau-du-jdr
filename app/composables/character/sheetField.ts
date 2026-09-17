import type { Ref, WritableComputedRef } from 'vue'

export type SheetTextKey = {
  [K in keyof CharacterSheet]-?: NonNullable<CharacterSheet[K]> extends string ? K : never
}[keyof CharacterSheet]

/**
 * Fabrique un `computed` lecture/écriture sur une colonne texte de `character_sheets`.
 *
 * L'écriture mute la fiche EN PLACE (et ne la remplace pas) : le composant peut donc la tenir via
 * `defineModel`, une ref de page ou `toRef(props, …)` — où réassigner `.value` écrirait dans des
 * props en lecture seule et serait silencieusement perdu.
 *
 * @param guard Renvoyer `null` annule l'écriture (ex. un nom vide, refusé par le schéma Zod).
 */
export const sheetTextField = (
  characterSheet: Ref<CharacterSheet> | undefined,
  key: SheetTextKey,
  guard?: (value: string) => string | null,
): WritableComputedRef<string> => computed({
  get: () => (characterSheet?.value?.[key] as string | null | undefined) ?? '',
  set: (v: string) => {
    if (!characterSheet?.value) return
    const next = guard ? guard(v) : v
    if (next === null) return
    const sheet = characterSheet.value as Record<string, unknown>
    sheet[key] = next
  },
})
