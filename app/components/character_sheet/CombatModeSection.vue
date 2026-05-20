<template>
  <div class="space-y-4">
    <!-- Économie d'action -->
    <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-primary">Ton tour</span>
        <UButton
          size="xs"
          variant="ghost"
          @click="resetTurn"
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

      <!-- Déplacement -->
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

    <!-- Actions disponibles ce tour -->
    <div class="space-y-2">
      <p class="text-xs font-bold uppercase tracking-widest text-muted">
        Actions disponibles
      </p>

      <!-- Armes équipées -->
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
            <UButton
              size="sm"
              variant="soft"
              color="primary"
              @click="roll?.(`Attaque — ${weapon.name}`, weapon.attackBonus)"
            >
              Attaque {{ formatModifier(weapon.attackBonus) }}
            </UButton>
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              @click="rollDamage(weapon)"
            >
              Dégâts {{ weapon.damageDice }}{{ weapon.damageBonus !== 0 ? formatModifier(weapon.damageBonus) : '' }} {{ damageTypeLabels[weapon.damageType] ?? weapon.damageType }}
            </UButton>
            <UTooltip
              v-if="weapon.isLight"
              text="Dégâts main secondaire — sans modificateur de caractéristique (combat à deux armes)"
            >
              <UButton
                size="sm"
                variant="soft"
                color="neutral"
                @click="rollOffhand(weapon)"
              >
                Main secondaire {{ weapon.damageDice }}{{ weapon.damageBonusOffhand !== 0 ? formatModifier(weapon.damageBonusOffhand) : '' }} {{ damageTypeLabels[weapon.damageType] ?? weapon.damageType }}
              </UButton>
            </UTooltip>
          </div>
        </div>
      </div>

      <!-- Capacités avec type d'action -->
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
          <span
            v-if="feature.maxUses !== null"
            class="text-xs text-muted"
          >
            {{ (feature.maxUses ?? 0) - feature.currentUses }} restant{{ (feature.maxUses ?? 0) - feature.currentUses > 1 ? 's' : '' }}
          </span>
        </div>
      </template>

      <!-- Sorts préparés disponibles -->
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
            size="sm"
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

const props = defineProps<{
  characterSheet: CharacterSheet
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const damageTypeLabels: Record<string, string> = {
  acid: 'acide', bludgeoning: 'contondant', cold: 'froid', fire: 'feu', force: 'force',
  lightning: 'foudre', necrotic: 'nécrotique', piercing: 'perçant', poison: 'poison',
  psychic: 'psychique', radiant: 'radiant', slashing: 'tranchant', thunder: 'tonnerre',
}

const csRef = toRef(props, 'characterSheet')
const { equippedWeaponStats, resolvedFeatures, effectiveSpeed, characterSpells } = useCharacterSheet(csRef)

// ── Économie d'action ────────────────────────────────────────────────────────
const actionTypes = [
  { key: 'action' as const, label: 'Action', color: '#22c55e' },
  { key: 'bonus_action' as const, label: 'Bonus', color: '#f97316' },
  { key: 'reaction' as const, label: 'Réaction', color: '#f472b6' },
]

const usedActions = ref({ action: false, bonus_action: false, reaction: false })

const resetTurn = () => {
  usedActions.value = { action: false, bonus_action: false, reaction: false }
  movementUsed.value = 0
}

// ── Déplacement ──────────────────────────────────────────────────────────────
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

// ── Capacités triées par type d'action ──────────────────────────────────────
const featuresByActionType = computed(() => {
  const map: Record<string, typeof resolvedFeatures.value> = {}
  for (const f of resolvedFeatures.value) {
    if (!f.actionType) continue
    if (f.maxUses !== null && f.currentUses >= (f.maxUses ?? 0)) continue
    ;(map[f.actionType] ??= []).push(f)
  }
  return map
})

// ── Sorts préparés ───────────────────────────────────────────────────────────
const preparedSpells = computed(() => characterSpells.value.filter(s => s.prepared))

// ── Roll dégâts arme ────────────────────────────────────────────────────────
type WeaponStat = typeof equippedWeaponStats.value[number]

const parseDice = (dice: string) => {
  const [c, s] = dice.split('d').map(Number)
  return { count: c || 1, sides: s || 6 }
}

const rollDamage = (weapon: WeaponStat) => {
  const { count, sides } = parseDice(weapon.damageDice)
  const label = weapon.usingTwoHanded ? `Dégâts (2 mains) — ${weapon.name}` : `Dégâts — ${weapon.name}`
  props.roll?.(label, weapon.damageBonus, sides, count)
}

const rollOffhand = (weapon: WeaponStat) => {
  const { count, sides } = parseDice(weapon.damageDice)
  props.roll?.(`Dégâts main sec. — ${weapon.name}`, weapon.damageBonusOffhand, sides, count)
}
</script>
