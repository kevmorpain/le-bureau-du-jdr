import type { TemporaryEffect } from '~~/shared/utils/temporary_effects'

export const ROUNDS_PER_MINUTE = 10

// Au-delà de 10 minutes, personne ne compte les rounds et l'app n'a pas d'horloge de jeu : la durée
// reste affichée, la fin est manuelle.
export const MAX_COUNTED_ROUNDS = 10 * ROUNDS_PER_MINUTE

export const SPELL_DURATION_UNITS = ['instant', 'round', 'minute', 'hour', 'day', 'until_dispelled', 'special'] as const
export type SpellDurationUnit = typeof SPELL_DURATION_UNITS[number]

// Unités qui portent une quantité ; `special` est la saisie libre des cas que la structure n'exprime pas.
export const COUNTED_DURATION_UNITS = ['round', 'minute', 'hour', 'day'] as const

export type SpellDuration = { durationUnit: SpellDurationUnit, durationValue: number | null }
export type SpellDurationRow = SpellDuration & { duration: string, concentration: boolean }

const ROUNDS_PER_UNIT: Partial<Record<SpellDurationUnit, number>> = { round: 1, minute: ROUNDS_PER_MINUTE }
const UNIT_LABELS: Record<typeof COUNTED_DURATION_UNITS[number], [string, string]> = {
  round: ['round', 'rounds'], minute: ['minute', 'minutes'], hour: ['heure', 'heures'], day: ['jour', 'jours'],
}

const isCounted = (unit: SpellDurationUnit): unit is typeof COUNTED_DURATION_UNITS[number] => unit in UNIT_LABELS

// Libellé de la durée seule (« 1 minute ») ; `text` n'est lu que pour `special`, où il fait foi.
export const durationLabel = ({ durationUnit, durationValue }: SpellDuration, text = ''): string => {
  if (durationUnit === 'instant') return 'Instantanée'
  if (durationUnit === 'until_dispelled') return 'Jusqu\'à dissipation'
  if (isCounted(durationUnit)) {
    const value = durationValue ?? 1
    return `${value} ${UNIT_LABELS[durationUnit][value > 1 ? 1 : 0]}`
  }
  return text.trim()
}

// Texte d'affichage d'un sort, dérivé de sa durée structurée ; pour `special`, le texte saisi.
export const durationText = (duration: SpellDuration, concentration: boolean, text = ''): string =>
  concentration && isCounted(duration.durationUnit) ? `Concentration, jusqu'à ${durationLabel(duration)}` : durationLabel(duration, text)

// Nombre de rounds à décompter, ou null quand la durée ne s'y prête pas.
export const durationRounds = ({ durationUnit, durationValue }: SpellDuration): number | null => {
  const perUnit = ROUNDS_PER_UNIT[durationUnit]
  const rounds = perUnit && durationValue ? durationValue * perUnit : null
  return rounds !== null && rounds <= MAX_COUNTED_ROUNDS ? rounds : null
}

// null : sort instantané, rien à suivre. Toute autre durée est suivie, décomptée seulement si elle se compte en rounds.
export const castDuration = (spell: SpellDurationRow): { label: string, rounds: number | null } | null =>
  spell.durationUnit === 'instant' ? null : { label: durationLabel(spell, spell.duration), rounds: durationRounds(spell) }

export type EndedEffect = Pick<TemporaryEffect, 'id' | 'name' | 'spellId' | 'concentration'>

// Ce que le joueur a écrit (effets, description) ne disparaît jamais tout seul : l'entrée est
// seulement désactivée. Une entrée qui n'est que du suivi (sort lancé, durée) est retirée.
const carriesPlayerContent = (entry: TemporaryEffect) => entry.effects.length > 0 || !!entry.description

const finish = (entries: readonly TemporaryEffect[], ends: (e: TemporaryEffect) => boolean) => {
  const ended: EndedEffect[] = []
  const next: TemporaryEffect[] = []
  for (const entry of entries) {
    if (!ends(entry)) {
      next.push(entry)
      continue
    }
    ended.push({ id: entry.id, name: entry.name, spellId: entry.spellId, concentration: entry.concentration })
    if (carriesPlayerContent(entry)) next.push({ ...entry, active: false })
  }
  return { entries: next, ended }
}

// Un round s'écoule : les entrées actives qui comptent leurs rounds en perdent un, celles qui arrivent à 0 prennent fin.
export const elapseRound = (entries: readonly TemporaryEffect[]) => {
  const reachedZero = new Set<number>()
  const counted = entries.map((e) => {
    if (!e.active || !e.countdown || e.countdown.remaining === 0) return e
    const remaining = e.countdown.remaining - 1
    if (remaining === 0) reachedZero.add(e.id)
    return { ...e, countdown: { ...e.countdown, remaining } }
  })
  return finish(counted, e => reachedZero.has(e.id))
}

// La concentration porte sur `keepSpellId` (ou sur rien) : les sorts suivis qui en dépendaient prennent fin.
export const endConcentrationEntries = (entries: readonly TemporaryEffect[], keepSpellId: number | null) =>
  finish(entries, e => !!e.concentration && e.spellId !== keepSpellId)

export type CastSpell = { spellId: number, name: string, label: string, concentration: boolean, rounds: number | null }

// Relancer un sort déjà suivi le réarme : une seule entrée par sort, ses effets saisis par le joueur sont conservés.
export const armSpell = (entries: readonly TemporaryEffect[], cast: CastSpell): TemporaryEffect[] => {
  const countdown = cast.rounds === null ? undefined : { rounds: cast.rounds, remaining: cast.rounds }
  const refreshed = (e: TemporaryEffect): TemporaryEffect => ({
    ...e, active: true, durationLabel: cast.label, concentration: cast.concentration || undefined, countdown,
  })
  if (entries.some(e => e.spellId === cast.spellId)) {
    return entries.map(e => (e.spellId === cast.spellId ? refreshed(e) : e))
  }
  const id = Math.max(0, ...entries.map(e => e.id)) + 1
  return [...entries, refreshed({ id, name: cast.name, spellId: cast.spellId, active: true, effects: [] })]
}

export const elapseConditionRounds = <K extends string>(rounds: Partial<Record<K, number>>, active: readonly K[]) => {
  const next: Partial<Record<K, number>> = {}
  const ended: K[] = []
  for (const condition of active) {
    const left = rounds[condition]
    if (left === undefined) continue
    if (left <= 1) ended.push(condition)
    else next[condition] = left - 1
  }
  return { rounds: next, ended }
}
