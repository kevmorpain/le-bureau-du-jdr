/**
 * Les 9 alignements D&D 5e — ensemble fermé canonique (même esprit que `abilities.ts`,
 * cf. decisions.md D6).
 *
 * Source unique de vérité pour :
 *  - le code stocké en base (`character_sheets.alignment`, cf. l'enum `Alignment` du schéma
 *    Drizzle qui porte les mêmes 9 valeurs) ;
 *  - le validateur Zod de mise à jour de fiche (`updateCharacterSheetSchema`) ;
 *  - les libellés affichés (fiche ET builder) ;
 *  - la conversion depuis l'`id` du builder (minuscules, `n` pour Neutre), conservée pour
 *    ne pas casser les états de builder déjà persistés en localStorage.
 */
export const ALIGNMENT_CODES = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'] as const

/** Union dérivée des codes stockés en base. */
export type AlignmentCode = (typeof ALIGNMENT_CODES)[number]

export interface AlignmentInfo {
  /** Code stocké en base. */
  code: AlignmentCode
  /** Identifiant historique du builder (minuscules ; « n » pour Neutre). */
  builderId: string
  /** Abréviation française affichée (LB, NB, CB, LN, N, CN, LM, NM, CM). */
  short: string
  name: string
  description: string
}

export const ALIGNMENTS: readonly AlignmentInfo[] = [
  { code: 'LG', builderId: 'lg', short: 'LB', name: 'Loyal Bon', description: 'Suit les règles avec compassion.' },
  { code: 'NG', builderId: 'ng', short: 'NB', name: 'Neutre Bon', description: 'Fait le bien selon sa conscience.' },
  { code: 'CG', builderId: 'cg', short: 'CB', name: 'Chaotique Bon', description: 'Fait le bien, peu importe les règles.' },
  { code: 'LN', builderId: 'ln', short: 'LN', name: 'Loyal Neutre', description: 'Respecte l\'ordre avant tout.' },
  { code: 'TN', builderId: 'n', short: 'N', name: 'Neutre', description: 'Équilibre et pragmatisme.' },
  { code: 'CN', builderId: 'cn', short: 'CN', name: 'Chaotique Neutre', description: 'Liberté absolue, sans morale fixe.' },
  { code: 'LE', builderId: 'le', short: 'LM', name: 'Loyal Mauvais', description: 'Pouvoir et règles au service du mal.' },
  { code: 'NE', builderId: 'ne', short: 'NM', name: 'Neutre Mauvais', description: 'Sert ses seuls intérêts.' },
  { code: 'CE', builderId: 'ce', short: 'CM', name: 'Chaotique Mauvais', description: 'Violence et caprice sans limite.' },
] as const

const BY_CODE = new Map(ALIGNMENTS.map(a => [a.code, a]))
const BY_BUILDER_ID = new Map(ALIGNMENTS.map(a => [a.builderId, a]))

/** Alignement par défaut d'une fiche (cf. défaut de la colonne). */
export const DEFAULT_ALIGNMENT: AlignmentCode = 'TN'

export const alignmentByCode = (code: string | null | undefined): AlignmentInfo | null =>
  BY_CODE.get(code as AlignmentCode) ?? null

/**
 * Convertit l'`id` du builder en code base. Accepte aussi un code déjà en base
 * (idempotent), et retombe sur l'alignement par défaut si rien ne correspond.
 */
export const alignmentCodeFromBuilderId = (id: string | null | undefined): AlignmentCode =>
  BY_BUILDER_ID.get(id ?? '')?.code ?? BY_CODE.get(id as AlignmentCode)?.code ?? DEFAULT_ALIGNMENT
