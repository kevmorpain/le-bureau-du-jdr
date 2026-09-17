// Grande arme (relance) et Protection (réaction) ne sont pas des bonus statiques : non gérés ici.

export function defenseAcBonus(kinds: ReadonlySet<string>, hasBodyArmor: boolean): number {
  return kinds.has('defense') && hasBodyArmor ? 1 : 0
}

export function archeryAttackBonus(kinds: ReadonlySet<string>, isRanged: boolean): number {
  return kinds.has('archery') && isRanged ? 2 : 0
}

// Un bouclier n'est pas une arme : seul le nombre d'armes équipées compte.
export function duelingDamageBonus(
  kinds: ReadonlySet<string>,
  w: { isMelee: boolean, isTwoHanded: boolean, usingTwoHanded: boolean, equippedWeaponCount: number },
): number {
  if (!kinds.has('dueling')) return 0
  const oneHandedNoOther = w.isMelee && !w.isTwoHanded && !w.usingTwoHanded && w.equippedWeaponCount === 1
  return oneHandedNoOther ? 2 : 0
}

export function twoWeaponOffhandUsesAbilityMod(kinds: ReadonlySet<string>): boolean {
  return kinds.has('two_weapon')
}
