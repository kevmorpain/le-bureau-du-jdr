import type { FeatureChoice, OptionSource } from './choices'
import { TOOL_CATEGORIES } from './tools'

// Tri des entrées de maîtrise d'un historique : une entrée fixe devient un effet de maîtrise du porteur,
// une entrée « au choix » un point de choix (`backgroundChoices`).

export function isChoiceProficiency(entry: string): boolean {
  return entry.toLowerCase().includes('choix') || entry.includes('×')
}

export function fixedProficiencies(entries: string[]): string[] {
  return entries.filter(e => !isChoiceProficiency(e))
}

// Entrées d'outils « au choix » des historiques → options (noms du catalogue d'outils). Le Marchand de
// guilde prend les outils de navigateur OU une langue (AideDD, Artisan de guilde, variante).
const TOOL_CHOICE_SOURCES: Record<string, OptionSource> = {
  'Jeux au choix ×1': { type: 'tools', from: TOOL_CATEGORIES['Jeux']! },
  'Instrument de musique au choix': { type: 'tools', from: TOOL_CATEGORIES['Instruments de musique']! },
  'Outil d\'artisan au choix': { type: 'tools', from: TOOL_CATEGORIES['Outils d\'artisan']! },
  'Outils de navigateur ou langue au choix': { type: 'tools', from: ['Outils de navigateur'], orLanguages: true },
}
const LANGUAGE_CHOICE = /^Au choix ×(\d+)$/

/** Points de choix d'un historique, tirés de ses entrées « au choix ». Une entrée non reconnue lève. */
export function backgroundChoices(bg: { name: string, toolProficiencies?: string[], languageProficiencies?: string[] }): FeatureChoice[] {
  const choices: FeatureChoice[] = []
  for (const entry of (bg.toolProficiencies ?? []).filter(isChoiceProficiency)) {
    const optionSource = TOOL_CHOICE_SOURCES[entry]
    if (!optionSource) throw new Error(`Historique ${bg.name} : outil au choix non reconnu « ${entry} »`)
    choices.push({ kind: 'tool', count: 1, optionSource })
  }
  for (const entry of (bg.languageProficiencies ?? []).filter(isChoiceProficiency)) {
    const count = Number(LANGUAGE_CHOICE.exec(entry)?.[1])
    if (!count) throw new Error(`Historique ${bg.name} : langue au choix non reconnue « ${entry} »`)
    choices.push({ kind: 'language', count, optionSource: { type: 'languages' } })
  }
  return choices
}
