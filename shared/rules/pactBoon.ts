export type PactBoon = 'chain' | 'blade' | 'tome'

export const PACT_BOON_NAMES: Record<PactBoon, string> = {
  chain: 'Pacte de la Chaîne',
  blade: 'Pacte de la Lame',
  tome: 'Pacte du Tome',
}

export const pactBoonOfName = (name: string | null | undefined): PactBoon | null =>
  (Object.keys(PACT_BOON_NAMES) as PactBoon[]).find(k => PACT_BOON_NAMES[k] === name) ?? null
