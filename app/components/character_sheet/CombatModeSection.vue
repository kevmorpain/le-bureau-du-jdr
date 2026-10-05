<template>
  <div class="space-y-4">
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-3">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="text-sm font-bold text-primary">Ton tour</span>
        <UBadge
          v-if="initiative"
          color="primary"
          variant="soft"
          size="md"
          :label="`Initiative ${initiative.total}`"
        />
        <div class="flex items-center gap-1">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-heroicons:minus-16-solid"
            aria-label="Round précédent"
            :disabled="round <= 1"
            @click="previousRound"
          />
          <span class="text-xs font-mono">Round {{ round }}</span>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-heroicons:plus-16-solid"
            aria-label="Round suivant"
            @click="advanceRound"
          />
        </div>
        <UButton
          size="xs"
          variant="ghost"
          @click="newTurn"
        >
          Nouveau tour
        </UButton>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="action in actionTypes"
          :key="action.key"
          class="py-2 px-1 rounded-lg border-2 text-xs font-semibold transition-all text-center"
          :class="usedActions[action.key]
            ? 'line-through opacity-40 border-current/20 bg-current/5'
            : 'border-current hover:opacity-80'"
          :style="{ color: action.color, borderColor: usedActions[action.key] ? `${action.color}33` : action.color }"
          @click="usedActions[action.key] = !usedActions[action.key]"
        >
          <ActionTypeIcon
            :type="action.key"
            class="mx-auto mb-0.5"
          />
          {{ action.label }}
        </button>
      </div>

      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted">Déplacement</span>
          <span class="font-mono text-blue-400">{{ remainingMovement.toFixed(1) }}/{{ effectiveSpeed }}m</span>
        </div>
        <div class="h-2 rounded-full bg-elevated overflow-hidden">
          <div
            class="h-full rounded-full bg-blue-500 transition-all"
            :style="{ width: `${movementPercent}%` }"
          />
        </div>
        <div class="flex gap-1">
          <button
            class="flex-1 py-1 text-xs rounded border border-default hover:bg-elevated transition-colors"
            @click="moveBy(1.5)"
          >
            +1,5m
          </button>
          <button
            class="flex-1 py-1 text-xs rounded border border-default hover:bg-elevated transition-colors"
            @click="moveBy(-1.5)"
          >
            −1,5m
          </button>
          <button
            class="px-2 py-1 text-xs rounded border border-default hover:bg-elevated transition-colors text-muted"
            @click="movementUsed = 0"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">
          Actions disponibles
        </p>
        <UBadge
          v-if="classTraits.attacksPerAction > 1"
          :label="`${classTraits.attacksPerAction} attaques par action Attaquer`"
          color="primary"
          variant="soft"
          size="md"
        />
      </div>

      <div
        v-for="weapon in equippedWeaponStats"
        :key="weapon.entryId"
        class="p-2 rounded-lg border border-default"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <ActionTypeIcon type="action" />
          <UTooltip
            v-if="weapon.properties.length"
            :text="weapon.properties.map(p => weaponPropertyLabels[p] ?? p).join(', ')"
          >
            <span class="flex-1 text-sm font-medium cursor-help">{{ weapon.name }}</span>
          </UTooltip>
          <span
            v-else
            class="flex-1 text-sm font-medium"
          >{{ weapon.name }}</span>
          <UTooltip
            v-if="weapon.warnings.length"
            :text="weapon.warnings.join('\n')"
            :ui="{ text: 'whitespace-pre-line max-w-56', content: 'h-auto' }"
          >
            <UIcon
              name="i-heroicons:exclamation-triangle"
              class="size-4 text-rose-400"
            />
          </UTooltip>
          <div class="flex gap-1 flex-wrap">
            <UTooltip
              :text="bonusBreakdown(weapon.attackParts)"
              :disabled="!weapon.attackParts.length"
            >
              <RollButton
                size="sm"
                variant="soft"
                color="primary"
                @click="rollAttack(weapon)"
              >
                Attaque {{ formatModifier(weapon.attackBonus) }}
              </RollButton>
            </UTooltip>
            <UTooltip
              :text="bonusBreakdown([...(weapon.rageBonus ? [{ label: 'Rage', amount: weapon.rageBonus }] : []), ...weapon.damageParts])"
              :disabled="!weapon.rageBonus && !weapon.damageParts.length"
            >
              <RollButton
                size="sm"
                variant="soft"
                color="neutral"
                @click="rollDamage(weapon)"
              >
                Dégâts {{ weapon.damageDice }}{{ weapon.damageBonus !== 0 ? formatModifier(weapon.damageBonus) : '' }} {{ damageTypeLabels[weapon.damageType] ?? weapon.damageType }}
              </RollButton>
            </UTooltip>
            <UTooltip
              v-for="dice in weapon.extraDamageDice"
              :key="dice.name"
              :text="[dice.condition, dice.limit === 'once_per_turn' ? 'Une fois par tour' : 'À chaque attaque', extraDiceStatus(dice)?.hint].filter(Boolean).join(' — ')"
              :ui="{ text: 'whitespace-pre-line max-w-56', content: 'h-auto' }"
            >
              <RollButton
                size="sm"
                variant="soft"
                :color="extraDiceStatus(dice)?.color ?? 'warning'"
                @click="rollExtraDice(weapon, dice)"
              >
                + {{ dice.name }} {{ dice.count }}d{{ dice.sides }}{{ dice.damageType ? ` ${damageTypeLabels[dice.damageType] ?? dice.damageType}` : '' }}{{ extraDiceStatus(dice)?.mark }}
              </RollButton>
            </UTooltip>
            <UTooltip
              v-if="weapon.isLight"
              text="Dégâts main secondaire — sans modificateur de caractéristique (combat à deux armes)"
            >
              <RollButton
                size="sm"
                variant="soft"
                color="neutral"
                @click="rollOffhand(weapon)"
              >
                Main secondaire {{ weapon.damageDice }}{{ weapon.damageBonusOffhand !== 0 ? formatModifier(weapon.damageBonusOffhand) : '' }} {{ damageTypeLabels[weapon.damageType] ?? weapon.damageType }}
              </RollButton>
            </UTooltip>
          </div>
        </div>
      </div>

      <template
        v-for="actionType in ['action', 'bonus_action', 'reaction', 'free']"
        :key="actionType"
      >
        <div
          v-for="feature in featuresByActionType[actionType] ?? []"
          :key="feature.id"
          class="flex items-center gap-2 p-2 rounded-lg border border-default"
        >
          <ActionTypeIcon :type="(actionType as 'action' | 'bonus_action' | 'reaction' | 'free')" />
          <span class="flex-1 text-sm">{{ feature.name }}</span>
          <UButton
            v-if="feature.meta?.whileActive"
            size="xs"
            :color="feature.active ? 'error' : 'primary'"
            :variant="feature.active ? 'soft' : 'solid'"
            @click="setActive(feature.id, !feature.active, groupOf(feature))"
          >
            {{ feature.active ? 'Mettre fin' : 'Activer' }}
          </UButton>
          <span
            v-if="usesLeft(feature) !== null"
            class="text-xs text-muted"
          >
            {{ usesLeft(feature) }} restant{{ usesLeft(feature)! > 1 ? 's' : '' }}
          </span>
        </div>
      </template>

      <div
        v-for="smite in classTraits.slotDamage"
        :key="smite.name"
        class="p-2 rounded-lg border border-default space-y-1"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span class="flex-1 text-sm font-medium">{{ smite.name }}</span>
          <label
            v-if="smite.bonus"
            class="flex items-center gap-1 text-xs text-muted"
          >
            <UCheckbox v-model="smiteBonus" />
            {{ smite.bonus.when }}
          </label>
        </div>
        <div class="flex flex-wrap gap-1">
          <RollButton
            v-for="level in smiteLevels"
            :key="level"
            size="xs"
            variant="soft"
            color="warning"
            @click="rollSmite(smite, level)"
          >
            Niv. {{ level }} · {{ slotDamageDiceCount(smite, level, smiteBonus) }}d{{ smite.sides }}
          </RollButton>
          <span
            v-if="!smiteLevels.length"
            class="text-xs text-muted italic"
          >aucun emplacement disponible</span>
        </div>
      </div>

      <div
        v-if="preparedSpells.length"
        class="p-2 rounded-lg border border-default space-y-1"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="size-3 rounded-full bg-violet-500 shrink-0" />
          <span class="text-sm font-medium">Sorts préparés</span>
        </div>
        <div class="flex flex-wrap gap-1 pl-5">
          <UBadge
            v-for="spell in preparedSpells"
            :key="spell.id"
            variant="soft"
            color="info"
            size="md"
          >
            {{ spell.spell?.name ?? spell.id }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { weaponPropertyLabels } from '~~/shared/utils/item'
import { slotDamageDiceCount, type SlotDamage } from '~~/shared/rules/classResources'
import { useClassResources } from '~/composables/character/useClassResources'
import { useCombatTracker } from '~/composables/character/useCombatTracker'
import { rollEngineKey } from '~/composables/character/useCharacterRolls'
import { advantageEligibility } from '~~/shared/rules/rolls'
import type { RollFn } from '~/composables/useDiceRoller'

const props = defineProps<{
  characterSheet: CharacterSheet
  roll?: RollFn
}>()

const damageTypeLabels: Record<string, string> = {
  acid: 'acide', bludgeoning: 'contondant', cold: 'froid', fire: 'feu', force: 'force',
  lightning: 'foudre', necrotic: 'nécrotique', piercing: 'perçant', poison: 'poison',
  psychic: 'psychique', radiant: 'radiant', slashing: 'tranchant', thunder: 'tonnerre',
}

const bonusBreakdown = (parts: { label: string, amount: number }[]) =>
  `dont ${parts.map(p => `${formatModifier(p.amount)} ${p.label}`).join(', ')}`

const csRef = toRef(props, 'characterSheet')
const { equippedWeaponStats, resolvedFeatures, effectiveSpeed, characterSpells, classTraits, resourceGroups, elapseDurations } = useCharacterSheet(csRef)

const slots = inject<Ref<{ spellcasting: Record<number, { max: number, current: number, created?: number }>, pact_magic: Record<number, { max: number, current: number }> }>>('spellSlots')
const { setActive } = useClassResources(csRef, slots)

const groupOf = (feature: { id: number }) => resourceGroups.value.find(g => g.featureIds.includes(feature.id))

// Reste d'une capacité à usages : celui de sa réserve partagée s'il y en a une, sinon son propre compteur.
const usesLeft = (feature: { id: number, maxUses: number | null, currentUses: number }): number | null => {
  const group = groupOf(feature)
  if (group) return group.unlimited || group.max === null ? null : Math.max(0, group.max - group.spent)
  return feature.maxUses === null ? null : Math.max(0, feature.maxUses - feature.currentUses)
}

const actionTypes = [
  { key: 'action' as const, label: 'Action', color: '#22c55e' },
  { key: 'bonus_action' as const, label: 'Bonus', color: '#f97316' },
  { key: 'reaction' as const, label: 'Réaction', color: '#f472b6' },
]

const usedActions = ref({ action: false, bonus_action: false, reaction: false })

const { initiative, round, nextRound, previousRound } = useCombatTracker(props.characterSheet.id)

// Chaque round qui passe fait aussi avancer les durées des sorts, effets et états suivis.
const advanceRound = () => {
  nextRound()
  elapseDurations()
}

const newTurn = () => {
  usedActions.value = { action: false, bonus_action: false, reaction: false }
  movementUsed.value = 0
  advanceRound()
  for (const feature of resolvedFeatures.value) {
    if (feature.active && feature.meta?.endsOnNewTurn) setActive(feature.id, false, undefined)
  }
}

// Dés qui dépendent de l'avantage (Attaque sournoise) : le mode du dernier jet d'attaque dit si la condition est remplie.
const rollEngine = inject(rollEngineKey, null)
const ELIGIBILITY = {
  eligible: { color: 'success' as const, mark: ' ✓', hint: 'Avantage au dernier jet d\'attaque : conditions remplies' },
  blocked: { color: 'error' as const, mark: ' ✗', hint: 'Désavantage au dernier jet d\'attaque : pas d\'Attaque sournoise' },
  unconfirmed: { color: 'warning' as const, mark: ' ?', hint: 'Pas d\'avantage au dernier jet : il faut un ennemi de la cible à 1,50 m ou moins' },
}
const extraDiceStatus = (dice: { needsAdvantage?: boolean }) =>
  dice.needsAdvantage ? ELIGIBILITY[advantageEligibility(rollEngine?.pending.value.attackMode ?? null)] : null

const movementUsed = ref(0)
const remainingMovement = computed(() => Math.max(0, effectiveSpeed.value - movementUsed.value))
const movementPercent = computed(() =>
  effectiveSpeed.value > 0
    ? Math.min(100, (movementUsed.value / effectiveSpeed.value) * 100)
    : 0,
)

const moveBy = (delta: number) => {
  movementUsed.value = Math.max(0, Math.min(effectiveSpeed.value * 2, movementUsed.value + delta))
}

// Capacités triées par type d'action
const featuresByActionType = computed(() => {
  const map: Record<string, typeof resolvedFeatures.value> = {}
  for (const f of resolvedFeatures.value) {
    if (!f.actionType) continue
    if (usesLeft(f) === 0) continue
    ;(map[f.actionType] ??= []).push(f)
  }
  return map
})

const preparedSpells = computed(() => (characterSpells.value ?? []).filter(s => s.prepared))

// Roll dégâts arme
type WeaponStat = typeof equippedWeaponStats.value[number]

const parseDice = (dice: string) => {
  const [c, s] = dice.split('d').map(Number)
  return { count: c || 1, sides: s || 6 }
}

const rollAttack = (weapon: WeaponStat) => {
  props.roll?.(`Attaque — ${weapon.name}`, weapon.attackBonus, 20, 1, { d20: { type: 'attack', weapon: true, strengthMelee: weapon.usesStrength, extra: weapon.attackRollSources } })
}

const rollDamage = (weapon: WeaponStat) => {
  const { count, sides } = parseDice(weapon.damageDice)
  const label = weapon.usingTwoHanded ? `Dégâts (2 mains) — ${weapon.name}` : `Dégâts — ${weapon.name}`
  props.roll?.(label, weapon.damageBonus, sides, count, { damage: { weaponDie: { melee: !weapon.isRanged } } })
}

const rollExtraDice = (weapon: WeaponStat, dice: WeaponStat['extraDamageDice'][number]) => {
  props.roll?.(`${dice.name} — ${weapon.name}`, 0, dice.sides, dice.count, { damage: {} })
}

// Châtiment divin : emplacements de sort de n'importe quel niveau (paladin ou autre) ; l'emplacement est dépensé au jet.
const smiteBonus = ref(false)
const smiteLevels = computed(() =>
  Object.entries(slots?.value.spellcasting ?? {})
    .filter(([, s]) => s.current > 0)
    .map(([level]) => Number(level)),
)
const rollSmite = (smite: SlotDamage, level: number) => {
  const slot = slots?.value.spellcasting[level]
  if (!slot || slot.current < 1) return
  slot.current -= 1
  props.roll?.(`${smite.name} (niv. ${level})`, 0, smite.sides, slotDamageDiceCount(smite, level, smiteBonus.value), { damage: {} })
}

const rollOffhand = (weapon: WeaponStat) => {
  const { count, sides } = parseDice(weapon.damageDice)
  props.roll?.(`Dégâts main sec. — ${weapon.name}`, weapon.damageBonusOffhand, sides, count, { damage: { weaponDie: { melee: !weapon.isRanged } } })
}
</script>
