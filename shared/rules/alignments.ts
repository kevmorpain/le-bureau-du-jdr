export const ALIGNMENT_CODES = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE'] as const

export type AlignmentCode = (typeof ALIGNMENT_CODES)[number]

export interface AlignmentInfo {
  code: AlignmentCode
  /** Id historique du builder, conservé pour les états déjà persistés en localStorage. */
  builderId: string
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

export const DEFAULT_ALIGNMENT: AlignmentCode = 'TN'

export const alignmentByCode = (code: string | null | undefined): AlignmentInfo | null =>
  BY_CODE.get(code as AlignmentCode) ?? null

export const alignmentCodeFromBuilderId = (id: string | null | undefined): AlignmentCode =>
  BY_BUILDER_ID.get(id ?? '')?.code ?? BY_CODE.get(id as AlignmentCode)?.code ?? DEFAULT_ALIGNMENT
