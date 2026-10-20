import type { ResolvedChoice } from '~~/shared/rules/resolve'

const TITLES: Partial<Record<ResolvedChoice['kind'], string>> = {
  favored_enemy: 'Ennemi juré',
  fighting_style: 'Style de combat',
  additional_fighting_style: 'Style de combat supplémentaire',
  pact_boon: 'Don du Pacte',
  invocations: 'Manifestations occultes',
  metamagic: 'Métamagie',
  maneuvers: 'Manœuvres',
}

// Le Rôdeur et le Druide partagent le type de choix « terrain » : seul le propriétaire les distingue.
export function choiceTitle(choice: Pick<ResolvedChoice, 'kind' | 'ownerSubclassId'>): string | undefined {
  if (choice.kind === 'terrain') return choice.ownerSubclassId != null ? 'Terrain du cercle' : 'Terrain favori'
  return TITLES[choice.kind]
}

const OCCULT_KINDS: ReadonlyArray<ResolvedChoice['kind']> = ['pact_boon', 'invocations', 'metamagic']

/** Teinte du sélecteur d'options : les choix occultes en violet, les choix martiaux en rouge. */
export const choiceAccent = (choice: Pick<ResolvedChoice, 'kind'>): 'red' | 'violet' =>
  OCCULT_KINDS.includes(choice.kind) ? 'violet' : 'red'
