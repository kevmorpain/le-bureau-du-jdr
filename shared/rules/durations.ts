import type { TemporaryEffect } from '~~/shared/utils/temporary_effects'

// AideDD, Le combat : « Un round représente environ six secondes dans le monde du jeu. »
export const ROUNDS_PER_MINUTE = 10

// Au-delà de 10 minutes, personne ne compte les rounds et l'app n'a pas d'horloge de jeu : la durée
// reste affichée, la fin est manuelle.
export const MAX_COUNTED_ROUNDS = 10 * ROUNDS_PER_MINUTE

export type SpellDuration = {
  label: string
  concentration: boolean
  rounds: number | null
}

const UNIT_ROUNDS: Record<string, number> = { round: 1, minute: ROUNDS_PER_MINUTE }

// null : sort instantané, rien à suivre. Toute autre durée est suivie, décomptée seulement si elle se compte en rounds.
export const parseSpellDuration = (text: string): SpellDuration | null => {
  const raw = text.trim()
  if (/^instantan[ée]e/i.test(raw)) return null

  const concentration = /^concentration/i.test(raw)
  const label = raw.replace(/^concentration,?\s*/i, '').replace(/^jusqu['’]à\s+(?=\d)/i, '')
  const match = /(\d+)\s*(round|minute|heure|jour)s?\b/i.exec(label)
  const perUnit = match ? UNIT_ROUNDS[match[2]!.toLowerCase()] : undefined
  const rounds = match && perUnit ? Number(match[1]) * perUnit : null

  return { label, concentration, rounds: rounds !== null && rounds <= MAX_COUNTED_ROUNDS ? rounds : null }
}

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

export type CastSpell = { spellId: number, name: string } & SpellDuration

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
