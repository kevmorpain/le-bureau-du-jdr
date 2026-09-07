import { describe, it, expect } from 'vitest'
import { ref, toRef, reactive } from 'vue'
import { sheetTextField } from '../../app/composables/character/sheetField'
import { useCharacterIdentity } from '../../app/composables/character/useCharacterIdentity'

// ─────────────────────────────────────────────────────────────────────────────
// Identité & description. Deux contrats gardés ici :
//
//  1. `sheetTextField` — la fabrique qui remplace les computed get/set copiés-collés
//     (personnalité, notes, identité). Elle DOIT muter la fiche en place : la moitié
//     des sections la reçoivent via `toRef(props, 'characterSheet')` (props en lecture
//     seule), où réassigner `.value` serait silencieusement perdu.
//  2. `useCharacterIdentity` — garde du nom non vide (contrat de
//     `updateCharacterSheetSchema`, sinon l'auto-save renvoie 422), filtrage du
//     portrait affichable, et exposition des données déjà en base mais jusqu'ici
//     invisibles sur la fiche (alignement éditable, catégorie de taille d'espèce).
// ─────────────────────────────────────────────────────────────────────────────

const sheet = (over: Record<string, unknown> = {}) => ref({
  id: 1,
  name: 'Ambroise',
  age: '',
  height: '',
  weight: '',
  eyes: '',
  hair: '',
  skin: '',
  deity: '',
  backstory: '',
  allies: '',
  portraitUrl: '',
  notes: '',
  ...over,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

describe('sheetTextField', () => {
  it('lit la colonne et renvoie "" quand elle est absente ou nulle', () => {
    const notes = sheetTextField(sheet({ notes: 'PNJ : Kaelis' }), 'notes')
    expect(notes.value).toBe('PNJ : Kaelis')

    const missing = sheetTextField(sheet({ notes: null }), 'notes')
    expect(missing.value).toBe('')
  })

  it('mute la fiche EN PLACE (l\'objet garde son identité) → écriture visible à travers des props', () => {
    // Reproduit QuickNotesSection : la fiche arrive par `toRef(props, …)`, donc
    // réassigner `.value` n'atteindrait jamais la page.
    const page = ref(sheet().value)
    const before = page.value
    const props = reactive({ characterSheet: page.value })
    const notes = sheetTextField(toRef(props, 'characterSheet'), 'notes')

    notes.value = 'Repos long à l\'auberge'

    expect(page.value.notes).toBe('Repos long à l\'auberge')
    expect(page.value).toBe(before)
  })

  it('n\'écrit rien quand le garde renvoie null', () => {
    const s = sheet()
    const name = sheetTextField(s, 'name', v => v.trim() ? v : null)

    name.value = '   '

    expect(s.value.name).toBe('Ambroise')
  })

  it('ne casse pas quand aucune fiche n\'est fournie (useCharacterSheet() sans argument)', () => {
    const orphan = sheetTextField(undefined, 'notes')
    expect(orphan.value).toBe('')
    expect(() => {
      orphan.value = 'x'
    }).not.toThrow()
  })
})

describe('useCharacterIdentity', () => {
  it('persiste les champs d\'apparence, d\'histoire et d\'alliés', () => {
    const s = sheet()
    const identity = useCharacterIdentity(s)

    identity.age.value = '27 ans'
    identity.eyes.value = 'Verts'
    identity.backstory.value = 'Orphelin de Neverwinter.'
    identity.allies.value = 'Ordre du Gantelet'

    expect(s.value.age).toBe('27 ans')
    expect(s.value.eyes).toBe('Verts')
    expect(s.value.backstory).toBe('Orphelin de Neverwinter.')
    expect(s.value.allies).toBe('Ordre du Gantelet')
  })

  it('refuse un nom vide mais accepte un renommage', () => {
    const s = sheet()
    const { name } = useCharacterIdentity(s)

    name.value = ''
    expect(s.value.name).toBe('Ambroise')

    name.value = '   '
    expect(s.value.name).toBe('Ambroise')

    name.value = 'Ambroise Ferrehaute'
    expect(s.value.name).toBe('Ambroise Ferrehaute')
  })

  it('n\'affiche que les apparences renseignées, dans l\'ordre de la fiche', () => {
    const { appearanceFields } = useCharacterIdentity(sheet({
      age: '27 ans',
      hair: '  ',
      skin: 'Hâlée',
      deity: 'Tyr',
    }))

    expect(appearanceFields.value.map(f => [f.label, f.value])).toEqual([
      ['Âge', '27 ans'],
      ['Peau', 'Hâlée'],
      ['Divinité', 'Tyr'],
    ])
  })

  it('rend l\'alignement éditable depuis la fiche (colonne posée à la création)', () => {
    const s = sheet({ alignment: 'CG' })
    const { alignment, alignmentLabel } = useCharacterIdentity(s)

    expect(alignment.value).toBe('CG')
    expect(alignmentLabel.value).toBe('Chaotique Bon')

    alignment.value = 'LE'

    expect(s.value.alignment).toBe('LE')
    expect(alignmentLabel.value).toBe('Loyal Mauvais')
  })

  it('retombe sur le neutre quand la fiche n\'en porte pas', () => {
    const { alignment, alignmentLabel } = useCharacterIdentity(sheet())
    expect(alignment.value).toBe('TN')
    expect(alignmentLabel.value).toBe('Neutre')
  })

  it('affiche la catégorie de taille de l\'espèce (en base, jamais rendue jusqu\'ici)', () => {
    expect(useCharacterIdentity(sheet({ species: { size: 'S' } })).sizeLabel.value).toBe('Petite')
    expect(useCharacterIdentity(sheet({ species: { size: 'M' } })).sizeLabel.value).toBe('Moyenne')
    // Espèce absente ou code inconnu → rien à afficher (pas de « null » à l'écran).
    expect(useCharacterIdentity(sheet()).sizeLabel.value).toBeNull()
    expect(useCharacterIdentity(sheet({ species: { size: 'P' } })).sizeLabel.value).toBeNull()
  })

  it('ne rend un portrait que pour http(s) ou un chemin du site', () => {
    const src = (portraitUrl: string) => useCharacterIdentity(sheet({ portraitUrl })).portraitSrc.value

    expect(src('https://exemple.test/ambroise.png')).toBe('https://exemple.test/ambroise.png')
    expect(src('  /portraits/ambroise.png  ')).toBe('/portraits/ambroise.png')
    expect(src('')).toBeNull()
    expect(src('javascript:alert(1)')).toBeNull()
    expect(src('data:image/png;base64,AAAA')).toBeNull()
  })
})
