import type { Ref, WritableComputedRef } from 'vue'

/** Clés de `character_sheets` dont la valeur est une chaîne (colonnes texte). */
export type SheetTextKey = {
  [K in keyof CharacterSheet]-?: NonNullable<CharacterSheet[K]> extends string ? K : never
}[keyof CharacterSheet]

/**
 * Fabrique un `computed` lecture/écriture sur une colonne texte de `character_sheets`.
 *
 * L'écriture mute la fiche **en place** : le deep watch de
 * `app/pages/characters/[id]/index.vue` (debounce 1 s) la persiste via
 * `PUT /api/character_sheets/{id}` (pattern 1 de docs/persistence.md). La mutation en
 * place — et non le remplacement de l'objet — est ce qui rend la fabrique utilisable
 * quelle que soit la façon dont le composant tient la fiche : `defineModel`, ref de la
 * page, ou `toRef(props, 'characterSheet')` (où réassigner `.value` écrirait dans des
 * props en lecture seule et serait silencieusement perdu, cf. QuickNotesSection).
 *
 * @param guard Optionnel — transforme/rejette une valeur avant écriture. Renvoyer
 *   `null` annule l'écriture (ex. un nom vide, refusé par `updateCharacterSheetSchema`).
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
