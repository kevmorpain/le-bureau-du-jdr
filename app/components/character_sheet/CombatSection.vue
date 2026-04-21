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
              <span class="font-mono font-semibold">{{ formatModifier(weapon.attackBonus) }}</span>
            </td>

            <td class="p-2 text-center">
              <div class="font-mono">
                <span>{{ weapon.damageDice }}</span>
                <span v-if="weapon.damageBonus !== 0">{{ formatModifier(weapon.damageBonus) }}</span>
                <span class="text-sm text-muted ml-1">{{ damageTypeLabel(weapon.damageType) }}</span>
              </div>
              <div
                v-if="weapon.versatileDamage"
                class="text-sm text-muted"
              >
                <span class="font-mono">{{ weapon.versatileDamage }}{{ weapon.damageBonus !== 0 ? formatModifier(weapon.damageBonus) : '' }}</span>
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
</script>
