// AideDD, Ensorceleur › Source de magie › Flexibilité des sorts.
export const SORCERY_SLOT_COST: Readonly<Record<number, number>> = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 }

export const SORCERY_MAX_CREATED_SLOT_LEVEL = 5

export const slotCreationCost = (slotLevel: number): number | null => SORCERY_SLOT_COST[slotLevel] ?? null

// Convertir un emplacement en points en rend autant que son niveau, sans jamais dépasser le maximum de points.
export const pointsAfterSlotConversion = (spent: number, slotLevel: number): number => Math.max(0, spent - slotLevel)

// Sort jumeau : « un nombre de points égal au niveau du sort (1 point si c'est un sort mineur) ».
export const metamagicCost = (amount: number | 'spell_level', spellLevel: number): number =>
  amount === 'spell_level' ? Math.max(1, spellLevel) : amount
