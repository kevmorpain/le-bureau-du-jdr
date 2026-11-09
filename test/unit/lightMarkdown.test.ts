import { describe, it, expect } from 'vitest'
import { parseInline, parseMarkdown } from '../../app/utils/lightMarkdown'

describe('parseInline', () => {
  it('reconnaît le gras et l\'italique, le reste est du texte', () => {
    expect(parseInline('Voir **Aux niveaux supérieurs** et *ceci* ici')).toEqual([
      { text: 'Voir ' },
      { text: 'Aux niveaux supérieurs', bold: true },
      { text: ' et ' },
      { text: 'ceci', italic: true },
      { text: ' ici' },
    ])
  })

  it('laisse tel quel un astérisque isolé (multiplication, note)', () => {
    expect(parseInline('2 * 3 dégâts')).toEqual([{ text: '2 * 3 dégâts' }])
  })

  it('ne produit jamais de balise : le HTML reste du texte', () => {
    expect(parseInline('<img src=x onerror=alert(1)> **gras**')).toEqual([
      { text: '<img src=x onerror=alert(1)> ' },
      { text: 'gras', bold: true },
    ])
  })
})

describe('parseMarkdown', () => {
  it('sépare les paragraphes sur les lignes vides', () => {
    expect(parseMarkdown('Un.\n\nDeux.')).toEqual([
      { type: 'paragraph', inline: [{ text: 'Un.' }] },
      { type: 'paragraph', inline: [{ text: 'Deux.' }] },
    ])
  })

  it('garde les retours à la ligne simples d\'un texte écrit avant ce format', () => {
    expect(parseMarkdown('Un.\nDeux.')).toEqual([
      { type: 'paragraph', inline: [{ text: 'Un.' }, { text: '\n' }, { text: 'Deux.' }] },
    ])
  })

  it('forme une liste à puces, même collée au paragraphe qui la précède', () => {
    expect(parseMarkdown('Choisissez :\n- **A** : un\n- **B** : deux')).toEqual([
      { type: 'paragraph', inline: [{ text: 'Choisissez :' }] },
      {
        type: 'list',
        ordered: false,
        items: [
          [{ text: 'A', bold: true }, { text: ' : un' }],
          [{ text: 'B', bold: true }, { text: ' : deux' }],
        ],
      },
    ])
  })

  it('forme une liste numérotée', () => {
    expect(parseMarkdown('1. un\n2. deux')).toEqual([
      { type: 'list', ordered: true, items: [[{ text: 'un' }], [{ text: 'deux' }]] },
    ])
  })

  it('forme un tableau à partir de sa ligne de séparation, avec le formatage dans les cellules', () => {
    expect(parseMarkdown('| Matériau | Durée |\n| --- | --- |\n| *Pierre* | **12** heures |\n| Gemmes | 10 minutes |')).toEqual([
      {
        type: 'table',
        header: [[{ text: 'Matériau' }], [{ text: 'Durée' }]],
        rows: [
          [[{ text: 'Pierre', italic: true }], [{ text: '12', bold: true }, { text: ' heures' }]],
          [[{ text: 'Gemmes' }], [{ text: '10 minutes' }]],
        ],
      },
    ])
  })

  it('coupe le paragraphe qui précède un tableau et laisse le texte qui le suit à part', () => {
    const blocks = parseMarkdown('Voir ci-dessous :\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nSuite.')
    expect(blocks.map(b => b.type)).toEqual(['paragraph', 'table', 'paragraph'])
  })

  it('enchaîne deux tableaux séparés par une ligne vide', () => {
    const blocks = parseMarkdown('| A |\n| --- |\n| 1 |\n\n| B |\n| --- |\n| 2 |')
    expect(blocks.map(b => b.type)).toEqual(['table', 'table'])
  })

  it('laisse en paragraphe une ligne à barres sans ligne de séparation', () => {
    expect(parseMarkdown('| pas | un tableau |')).toEqual([
      { type: 'paragraph', inline: [{ text: '| pas | un tableau |' }] },
    ])
  })

  it('ignore les lignes vides superflues et un texte vide', () => {
    expect(parseMarkdown('\n\n  \n')).toEqual([])
    expect(parseMarkdown('')).toEqual([])
  })
})
