<template>
  <div
    v-if="equippedWeaponStats.length > 0"
    class="space-y-2"
  >
    <h2 class="font-semibold text-sm text-muted uppercase tracking-wide">
      Combat
    </h2>

    <div class="rounded-lg bg-default ring ring-default overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default text-muted text-xs">
            <th class="text-left p-2 font-medium">
              Arme
            </th>
            <th class="text-center p-2 font-medium">
              Attaque
            </th>
            <th class="text-center p-2 font-medium">
              Dégâts
            </th>
            <th class="hidden sm:table-cell text-left p-2 font-medium">
              Propriétés
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="weapon in equippedWeaponStats"
            :key="weapon.entryId"
            class="border-b border-default last:border-0"
          >
            <td class="p-2">
              <div class="flex items-center gap-1.5">
                <span class="font-medium">{{ weapon.name }}</span>
                <span
                  v-if="weapon.magicBonus > 0"
                  class="text-xs text-primary font-semibold"
                >+{{ weapon.magicBonus }}</span>
                <UTooltip
                  v-if="!weapon.isProficient"
                  text="Arme non maîtrisée : pas de bonus de maîtrise à l'attaque"
                >
                  <UIcon
                    name="i-heroicons:exclamation-triangle"
                    class="size-3.5 text-warning"
                  />
                </UTooltip>
              </div>
            </td>

            <td class="p-2 text-center">
              <button
                class="font-mono font-semibold text-primary hover:underline cursor-pointer"
                @click="roll?.(`Attaque — ${weapon.name}`, weapon.attackBonus)"
              >
                {{ formatModifier(weapon.attackBonus) }}
              </button>
            </td>

            <td class="p-2 text-center">
              <div class="font-mono">
                <button
                  class="hover:text-primary cursor-pointer transition-colors"
                  @click="rollDamage(weapon)"
                >
                  <span>{{ weapon.damageDice }}</span>
                  <span v-if="weapon.damageBonus !== 0">{{ formatModifier(weapon.damageBonus) }}</span>
                </button>
                <span class="text-sm text-muted ml-1">{{ damageTypeLabel(weapon.damageType) }}</span>
              </div>
              <div
                v-if="weapon.versatileDamage"
                class="text-sm text-muted"
              >
                <button
                  class="font-mono hover:text-primary cursor-pointer transition-colors"
                  @click="rollVersatile(weapon)"
                >
                  {{ weapon.versatileDamage }}{{ weapon.damageBonus !== 0 ? formatModifier(weapon.damageBonus) : '' }}
                </button>
                <span class="ml-1">(deux mains)</span>
              </div>
            </td>

            <td class="hidden sm:table-cell p-2">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="prop in weapon.properties"
                  :key="prop"
                  :label="weaponPropertyLabels[prop] ?? prop"
                  variant="soft"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { weaponPropertyLabels } from '~~/shared/utils/item'

const props = defineProps<{
  characterSheet: CharacterSheet
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const { equippedWeaponStats } = useCharacterSheet(toRef(props, 'characterSheet'))

const damageTypeLabels: Record<string, string> = {
  acid: 'acide',
  bludgeoning: 'contondant',
  cold: 'froid',
  fire: 'feu',
  force: 'force',
  lightning: 'foudre',
  necrotic: 'nécrotique',
  piercing: 'perçant',
  poison: 'poison',
  psychic: 'psychique',
  radiant: 'radiant',
  slashing: 'tranchant',
  thunder: 'tonnerre',
}

const damageTypeLabel = (type: string) => damageTypeLabels[type] ?? type

type WeaponStat = typeof equippedWeaponStats.value[number]

const parseDice = (dice: string): { count: number, sides: number } => {
  const [c, s] = dice.split('d').map(Number)
  return { count: c || 1, sides: s || 6 }
}

const rollDamage = (weapon: WeaponStat) => {
  const { count, sides } = parseDice(weapon.damageDice)
  props.roll?.(`Dégâts — ${weapon.name}`, weapon.damageBonus, sides, count)
}

const rollVersatile = (weapon: WeaponStat) => {
  if (!weapon.versatileDamage) return
  const { count, sides } = parseDice(weapon.versatileDamage)
  props.roll?.(`Dégâts (2 mains) — ${weapon.name}`, weapon.damageBonus, sides, count)
}
</script>
