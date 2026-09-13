// Application des bonus STATIQUES de style de combat (PHB 2014) à la CA et aux armes — logique PURE
// (aucun import), consommée par `useCharacterInventory` (F2 tranche 3) et testée en isolation.
//
// Les `kinds` proviennent des effets `fighting_style_modifier` matérialisés (le style choisi est une
// feature `fighting_style` sur la fiche). Grande arme (relance de dés) et Protection (réaction) ne
// sont pas des bonus statiques → non gérés ici (rendus par la description de la feature).

/** Défense : +1 CA tant qu'une armure (de corps) est portée. */
export function defenseAcBonus(kinds: ReadonlySet<string>, hasBodyArmor: boolean): number {
  return kinds.has('defense') && hasBodyArmor ? 1 : 0
}

/** Archerie : +2 aux jets d'attaque avec une arme à distance. */
export function archeryAttackBonus(kinds: ReadonlySet<string>, isRanged: boolean): number {
  return kinds.has('archery') && isRanged ? 2 : 0
}

/**
 * Duel : +2 aux jets de dégâts avec une arme de corps à corps maniée à UNE main et aucune autre
 * arme (une arme polyvalente maniée à une main compte ; un bouclier n'est pas une arme, donc seul
 * le nombre d'ARMES équipées est considéré).
 */
export function duelingDamageBonus(
  kinds: ReadonlySet<string>,
  w: { isMelee: boolean, isTwoHanded: boolean, usingTwoHanded: boolean, equippedWeaponCount: number },
): number {
  if (!kinds.has('dueling')) return 0
  const oneHandedNoOther = w.isMelee && !w.isTwoHanded && !w.usingTwoHanded && w.equippedWeaponCount === 1
  return oneHandedNoOther ? 2 : 0
}

/** Combat à deux armes : la main secondaire ajoute le modificateur de caractéristique aux dégâts. */
export function twoWeaponOffhandUsesAbilityMod(kinds: ReadonlySet<string>): boolean {
  return kinds.has('two_weapon')
}
