import { describe, it, expect } from 'vitest'
import {
  PORTRAIT_TYPES,
  ownedPortraitKey,
  portraitKey,
  portraitKeyFromPath,
  portraitPrefix,
  portraitUrlFromKey,
} from '../../server/utils/portraits'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat des clés de portrait (R2). Trois surfaces en dépendent — l'upload, la route
// de service et la purge à la suppression de fiche — et un désaccord entre elles se
// paierait cher : URL qui pointe dans le vide, objets orphelins facturés à vie, ou pire,
// suppression du portrait d'autrui. D'où ces tests sur les fonctions pures.
// ─────────────────────────────────────────────────────────────────────────────

const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

describe('clés et URL de portrait', () => {
  it('fait l\'aller-retour clé ⇄ URL', () => {
    const key = portraitKey(12, UUID, 'webp')
    expect(key).toBe(`portraits/12/${UUID}.webp`)

    const url = portraitUrlFromKey(key)
    expect(url).toBe(`/api/portraits/12/${UUID}.webp`)

    // La route reconstruit exactement la clé de départ.
    expect(portraitKeyFromPath(url.replace('/api/portraits/', ''))).toBe(key)
  })

  it('préfixe une fiche pour la purge', () => {
    expect(portraitPrefix(12)).toBe('portraits/12/')
    expect(portraitKey(12, UUID, 'jpg').startsWith(portraitPrefix(12))).toBe(true)
  })

  it('n\'accepte que les extensions des types autorisés', () => {
    expect(Object.values(PORTRAIT_TYPES).sort()).toEqual(['jpg', 'png', 'webp'])
    for (const ext of Object.values(PORTRAIT_TYPES)) {
      expect(portraitKeyFromPath(`12/${UUID}.${ext}`), ext).not.toBeNull()
    }
  })
})

describe('portraitKeyFromPath — garde-fou de la route publique', () => {
  it('accepte la forme attendue', () => {
    expect(portraitKeyFromPath(`7/${UUID}.webp`)).toBe(`portraits/7/${UUID}.webp`)
  })

  it('refuse tout le reste', () => {
    const rejected = [
      `../${UUID}.webp`, // traversée
      `12/../../etc/passwd`,
      `12/${UUID}.svg`, // type non autorisé (SVG = vecteur de script)
      `12/${UUID}`, // sans extension
      `12/pas-un-uuid.webp`,
      `abc/${UUID}.webp`, // id non numérique
      `12/${UUID}.webp/extra`,
      '',
    ]
    for (const path of rejected) {
      expect(portraitKeyFromPath(path), path).toBeNull()
    }
  })
})

describe('ownedPortraitKey — ce que le remplacement a le droit de supprimer', () => {
  it('reconnaît un portrait de la fiche', () => {
    expect(ownedPortraitKey(`/api/portraits/12/${UUID}.webp`, 12)).toBe(`portraits/12/${UUID}.webp`)
  })

  it('refuse le portrait d\'une AUTRE fiche', () => {
    expect(ownedPortraitKey(`/api/portraits/13/${UUID}.webp`, 12)).toBeNull()
  })

  it('refuse une URL externe collée à la main (on ne supprime que chez nous)', () => {
    expect(ownedPortraitKey('https://exemple.test/ambroise.png', 12)).toBeNull()
    expect(ownedPortraitKey('/images/ambroise.png', 12)).toBeNull()
  })

  it('refuse une valeur vide ou absente', () => {
    expect(ownedPortraitKey('', 12)).toBeNull()
    expect(ownedPortraitKey(null, 12)).toBeNull()
    expect(ownedPortraitKey(undefined, 12)).toBeNull()
  })

  it('refuse une URL de la bonne forme mais au chemin invalide', () => {
    expect(ownedPortraitKey('/api/portraits/12/../13/x.webp', 12)).toBeNull()
    expect(ownedPortraitKey(`/api/portraits/12/${UUID}.svg`, 12)).toBeNull()
  })
})
