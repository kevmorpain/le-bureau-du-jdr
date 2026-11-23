import type { RollFn } from '~/composables/useDiceRoller'
import type { WeaponStats } from './useCharacterInventory'

type WeaponAttackDeps = {
  equippedWeaponStats: Ref<WeaponStats[]>
  spendAmmunition: (entryId: number) => boolean
  roll: RollFn | undefined
}

const parseDice = (dice: string): { count: number, sides: number } => {
  const [count, sides] = dice.split('d').map(Number)
  return { count: count || 1, sides: sides || 6 }
}

export const useWeaponAttacks = ({ equippedWeaponStats, spendAmmunition, roll }: WeaponAttackDeps) => {
  const { t } = useI18n()
  const toast = useToast()

  const weaponStatsByEntry = computed(() => new Map(equippedWeaponStats.value.map(weapon => [weapon.entryId, weapon])))

  const rollAttack = (entryId: number) => {
    const weapon = weaponStatsByEntry.value.get(entryId)
    if (!weapon) return
    if (!spendAmmunition(entryId)) {
      toast.add({
        title: t('weapon_attack.no_ammunition.title', { ammunition: weapon.ammunition?.label }),
        description: t('weapon_attack.no_ammunition.description', { weapon: weapon.name }),
        color: 'warning',
      })
      return
    }
    roll?.(t('weapon_attack.roll.attack', { weapon: weapon.name }), weapon.attackBonus, 20, 1, {
      d20: { type: 'attack', weapon: true, strengthMelee: weapon.usesStrength, extra: weapon.attackRollSources },
    })
  }

  const rollDamage = (entryId: number) => {
    const weapon = weaponStatsByEntry.value.get(entryId)
    if (!weapon) return
    const { count, sides } = parseDice(weapon.damageDice)
    const label = weapon.usingTwoHanded
      ? t('weapon_attack.roll.damage_two_handed', { weapon: weapon.name })
      : t('weapon_attack.roll.damage', { weapon: weapon.name })
    roll?.(label, weapon.damageBonus, sides, count, { damage: { weaponDie: { melee: !weapon.isRanged } } })
  }

  const rollOffhandDamage = (entryId: number) => {
    const weapon = weaponStatsByEntry.value.get(entryId)
    if (!weapon) return
    const { count, sides } = parseDice(weapon.damageDice)
    roll?.(t('weapon_attack.roll.damage_offhand', { weapon: weapon.name }), weapon.damageBonusOffhand, sides, count, {
      damage: { weaponDie: { melee: !weapon.isRanged } },
    })
  }

  return { weaponStatsByEntry, rollAttack, rollDamage, rollOffhandDamage }
}
