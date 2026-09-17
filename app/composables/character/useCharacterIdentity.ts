import { sheetTextField } from './sheetField'
import { alignmentByCode, DEFAULT_ALIGNMENT, type AlignmentCode } from '~~/shared/rules/alignments'
import { creatureSizeLabel } from '~~/shared/rules/creatureSize'

/** Colonnes texte de `character_sheets` : auto-save par le deep watch de `[id].vue`. */
export const useCharacterIdentity = (characterSheet?: Ref<CharacterSheet>) => {
  // `updateCharacterSheetSchema` exige `name` non vide : un nom blanc n'est jamais
  // écrit (sinon l'auto-save renverrait un 422 à chaque frappe pendant l'effacement).
  const name = sheetTextField(characterSheet, 'name', v => v.trim() ? v : null)

  const age = sheetTextField(characterSheet, 'age')
  const height = sheetTextField(characterSheet, 'height')
  const weight = sheetTextField(characterSheet, 'weight')
  const eyes = sheetTextField(characterSheet, 'eyes')
  const hair = sheetTextField(characterSheet, 'hair')
  const skin = sheetTextField(characterSheet, 'skin')
  const deity = sheetTextField(characterSheet, 'deity')
  const backstory = sheetTextField(characterSheet, 'backstory')
  const allies = sheetTextField(characterSheet, 'allies')
  const portraitUrl = sheetTextField(characterSheet, 'portraitUrl')

  const alignment = computed<AlignmentCode>({
    get: () => (characterSheet?.value?.alignment as AlignmentCode | undefined) ?? DEFAULT_ALIGNMENT,
    set: (v: AlignmentCode) => {
      if (!characterSheet?.value) return
      const sheet = characterSheet.value as Record<string, unknown>
      sheet.alignment = v
    },
  })

  const alignmentLabel = computed<string>(() => alignmentByCode(alignment.value)?.name ?? '')

  const sizeLabel = computed<string | null>(() => creatureSizeLabel(characterSheet?.value?.species?.size))

  /** On ne rend que http(s) et les chemins relatifs ; toute autre valeur est ignorée. */
  const portraitSrc = computed<string | null>(() => {
    const url = portraitUrl.value.trim()
    if (!url) return null
    return /^(https?:\/\/|\/)/i.test(url) ? url : null
  })

  const appearanceFields = computed(() =>
    ([
      { key: 'age', label: 'Âge', value: age.value },
      { key: 'height', label: 'Taille', value: height.value },
      { key: 'weight', label: 'Poids', value: weight.value },
      { key: 'eyes', label: 'Yeux', value: eyes.value },
      { key: 'hair', label: 'Cheveux', value: hair.value },
      { key: 'skin', label: 'Peau', value: skin.value },
      { key: 'deity', label: 'Divinité', value: deity.value },
    ] as const).filter(f => f.value.trim().length > 0),
  )

  return {
    name,
    age,
    height,
    weight,
    eyes,
    hair,
    skin,
    deity,
    backstory,
    allies,
    portraitUrl,
    portraitSrc,
    appearanceFields,
    alignment,
    alignmentLabel,
    sizeLabel,
  }
}
