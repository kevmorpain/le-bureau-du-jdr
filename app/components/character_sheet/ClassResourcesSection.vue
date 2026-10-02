<template>
  <ul class="space-y-2">
    <li
      v-for="group in resourceGroups"
      :key="group.key"
      class="rounded-lg bg-default ring ring-default p-3 space-y-2"
    >
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="font-semibold">
          {{ group.name }}
        </h3>
        <UBadge
          v-if="rechargeLabel(group.rechargeType)"
          :label="rechargeLabel(group.rechargeType)"
          variant="soft"
          size="md"
        />
        <UBadge
          v-if="classTraits.resourceDie[group.key]"
          :label="`d${classTraits.resourceDie[group.key]}`"
          color="info"
          variant="soft"
          size="md"
        />
        <UBadge
          v-if="saveDc(group) !== null"
          :label="`DD ${saveDc(group)}`"
          color="neutral"
          variant="soft"
          size="md"
        />
      </div>

      <div
        v-if="group.unlimited"
        class="text-sm text-muted"
      >
        Utilisations illimitées
      </div>

      <div
        v-else-if="group.max !== null && group.pool"
        class="space-y-1.5"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-mono text-lg">
            {{ remaining(group) }}<span class="text-muted text-sm"> / {{ group.max }}</span>
          </span>
          <div class="flex items-center gap-1">
            <UInputNumber
              v-model="amounts[group.key]"
              :min="1"
              :max="group.max"
              :increment="false"
              :decrement="false"
              size="xs"
              class="w-16"
              :aria-label="`Quantité — ${group.name}`"
            />
            <UButton
              size="xs"
              variant="soft"
              :disabled="!canSpend(group, amountOf(group))"
              @click="spend(group, amountOf(group))"
            >
              Dépenser
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              :disabled="group.spent === 0"
              @click="regain(group, amountOf(group))"
            >
              Regagner
            </UButton>
          </div>
        </div>
        <UProgress
          :model-value="remaining(group) ?? 0"
          :max="group.max"
          size="xs"
        />
      </div>

      <div
        v-else-if="group.max !== null"
        class="flex items-center gap-1 flex-wrap"
      >
        <button
          v-for="i in group.max"
          :key="i"
          type="button"
          class="size-4 rounded-full border-2 transition-colors"
          :class="i <= group.spent
            ? 'bg-primary/60 border-primary hover:bg-primary/80'
            : 'bg-transparent border-muted'"
          :aria-label="i <= group.spent ? 'Utilisation dépensée' : 'Utilisation disponible'"
          @click="setSpent(group, i <= group.spent ? i - 1 : i)"
        />
        <span class="text-xs text-muted font-mono ml-1">{{ remaining(group) }}/{{ group.max }}</span>
      </div>

      <div
        v-if="activatable(group)"
        class="flex items-center gap-2 flex-wrap"
      >
        <UButton
          size="sm"
          :color="activatable(group)!.active ? 'error' : 'primary'"
          :variant="activatable(group)!.active ? 'soft' : 'solid'"
          @click="setActive(activatable(group)!.id, !activatable(group)!.active, group)"
        >
          {{ activatable(group)!.active ? 'Mettre fin' : `Activer ${activatable(group)!.name}` }}
        </UButton>
        <span
          v-if="activatable(group)!.active && suspended(activatable(group)!)"
          class="text-xs text-rose-400"
        >
          Armure lourde : avantages suspendus
        </span>
        <span
          v-else-if="activatable(group)!.active"
          class="text-xs text-muted"
        >
          {{ activeSummary(activatable(group)!) }}
        </span>
      </div>

      <div
        v-if="group.spends.length"
        class="flex flex-wrap gap-1"
      >
        <UButton
          v-for="s in group.spends"
          :key="s.label"
          size="xs"
          variant="soft"
          color="neutral"
          :disabled="!canSpend(group, s.amount)"
          @click="spend(group, s.amount)"
        >
          {{ s.label }} ({{ s.amount }})
        </UButton>
      </div>

      <template v-if="group.key === 'sorcery_points'">
        <div
          v-if="group.costs.length"
          class="space-y-1"
        >
          <div class="flex items-center gap-2">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Métamagie
            </p>
            <label class="flex items-center gap-1 text-xs text-muted">
              niveau du sort
              <UInputNumber
                v-model="spellLevel"
                :min="0"
                :max="9"
                :increment="false"
                :decrement="false"
                size="xs"
                class="w-14"
              />
            </label>
          </div>
          <div class="flex flex-wrap gap-1">
            <UButton
              v-for="c in group.costs"
              :key="c.featureId"
              size="xs"
              variant="soft"
              color="neutral"
              :disabled="!canSpend(group, costOf(c.amount))"
              @click="spend(group, costOf(c.amount))"
            >
              {{ c.name }} ({{ c.amount === 'spell_level' ? `= niv. ${costOf(c.amount)}` : c.amount }})
            </UButton>
          </div>
        </div>

        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Flexibilité des sorts
          </p>
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-xs text-muted">Emplacement → points</span>
            <UButton
              v-for="level in convertibleLevels"
              :key="`to-${level}`"
              size="xs"
              variant="soft"
              color="neutral"
              @click="convertSlotToPoints(group, level)"
            >
              Niv. {{ level }} (+{{ level }})
            </UButton>
            <span
              v-if="!convertibleLevels.length"
              class="text-xs text-muted italic"
            >aucun emplacement disponible</span>
          </div>
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-xs text-muted">Points → emplacement</span>
            <UButton
              v-for="level in creatableLevels"
              :key="`from-${level}`"
              size="xs"
              variant="soft"
              color="neutral"
              :disabled="!canSpend(group, slotCreationCost(level)!)"
              @click="createSlot(group, level)"
            >
              Niv. {{ level }} (−{{ slotCreationCost(level) }})
            </UButton>
          </div>
        </div>
      </template>

      <p
        v-if="group.key === 'wild_shape' && classTraits.beastShape"
        class="text-xs text-muted"
      >
        Bêtes : FP {{ formatChallenge(classTraits.beastShape.maxChallenge) }} max
        · {{ classTraits.beastShape.flying ? 'vol permis' : 'sans vitesse de vol' }}
        · {{ classTraits.beastShape.swimming ? 'nage permise' : 'sans vitesse de nage' }}
        · {{ classTraits.beastShape.hours }} h
      </p>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Effect } from '~~/server/db/schema/effects'
import { useClassResources } from '~/composables/character/useClassResources'
import type { ResourceGroup } from '~~/shared/rules/classResources'
import { SORCERY_MAX_CREATED_SLOT_LEVEL, metamagicCost, slotCreationCost } from '~~/shared/rules/sorcery'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const sheetRef = toRef(props, 'characterSheet')
const {
  resourceGroups, classTraits, resolvedFeatures, proficiencyBonus, abilityModifiers, wearsHeavyArmor,
} = useCharacterSheet(sheetRef)

const slots = inject<Ref<{ spellcasting: Record<number, { max: number, current: number, created?: number }>, pact_magic: Record<number, { max: number, current: number }> }>>('spellSlots')
const { remaining, canSpend, spend, regain, setSpent, setActive, convertSlotToPoints, createSlot } = useClassResources(sheetRef, slots)

const RECHARGE_LABELS = { short_rest: 'Repos court', long_rest: 'Repos long', dawn: 'À l\'aube' } as const
const rechargeLabel = (type: ResourceGroup['rechargeType']) => (type ? RECHARGE_LABELS[type] : '')

const amounts = reactive<Record<string, number>>({})
const amountOf = (group: ResourceGroup) => amounts[group.key] ?? 1

const spellLevel = ref(1)
const costOf = (amount: number | 'spell_level') => metamagicCost(amount, spellLevel.value)

const saveDc = (group: ResourceGroup): number | null =>
  group.saveDcAbility ? 8 + proficiencyBonus.value + (abilityModifiers.value[group.saveDcAbility] ?? 0) : null

const activatable = (group: ResourceGroup) =>
  resolvedFeatures.value.find(f => group.featureIds.includes(f.id) && f.meta?.whileActive)

const activeSummary = (feature: { meta?: { whileActive?: Effect[] } | null }) => [
  ...(feature.meta?.whileActive ?? []).filter(e => e.type === 'damage_resistance').map(effectLabel),
  ...(classTraits.value.meleeStrengthDamageBonus ? [`dégâts ${formatModifier(classTraits.value.meleeStrengthDamageBonus)} (corps à corps, Force)`] : []),
].join(' · ')

const suspended = (feature: { meta?: { suspendedByHeavyArmor?: boolean } | null }) =>
  Boolean(feature.meta?.suspendedByHeavyArmor) && wearsHeavyArmor.value

const convertibleLevels = computed(() =>
  Object.entries(slots?.value.spellcasting ?? {})
    .filter(([, s]) => s.current > 0)
    .map(([level]) => Number(level)),
)

const creatableLevels = computed(() =>
  Array.from({ length: SORCERY_MAX_CREATED_SLOT_LEVEL }, (_, i) => i + 1),
)
</script>
