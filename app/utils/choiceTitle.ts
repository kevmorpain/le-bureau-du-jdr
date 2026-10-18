import type { ResolvedChoice } from '~~/shared/rules/resolve'

// Le Rôdeur et le Druide partagent le type de choix « terrain » : seul le propriétaire les distingue.
export function choiceTitle(choice: Pick<ResolvedChoice, 'kind' | 'ownerSubclassId'>): string | undefined {
  if (choice.kind === 'terrain') return choice.ownerSubclassId != null ? 'Terrain du cercle' : 'Terrain favori'
  if (choice.kind === 'favored_enemy') return 'Ennemi juré'
  if (choice.kind === 'additional_fighting_style') return 'Style de combat supplémentaire'
  if (choice.kind === 'maneuvers') return 'Manœuvres'
  return undefined
}
