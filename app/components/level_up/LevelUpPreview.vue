<template>
  <div class="flex flex-col gap-3" :class="mobile ? 'py-2' : 'py-1'">
    <p v-if="!mobile" class="text-xs font-bold uppercase tracking-widest text-muted">Aperçu</p>

    <!-- Progression -->
    <div>
      <div class="flex justify-between text-xs text-muted mb-1">
        <span>Progression</span>
        <span class="text-amber-400">{{ completedCount }}/{{ activeSteps.length }}</span>
      </div>
      <UProgress
        :model-value="completedCount"
        :max="activeSteps.length"
        color="warning"
        size="xs"
      />
    </div>

    <!-- Identity -->
    <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <div class="flex items-center gap-2 mb-2">
        <span v-if="pickedClass" class="text-xl">{{ pickedClass.emoji }}</span>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm text-(--ui-text) truncate">
            {{ charSheet?.name ?? '—' }}
          </p>
          <p class="text-[10px] text-muted">
            {{ state.isMulticlass ? '✦ Multi-classage' : state.pickedClassId ? '▲ Niveau supérieur' : '' }}
          </p>
        </div>
      </div>

      <!-- New class list -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="cc in newClassesList"
          :key="cc.classId"
          class="text-[11px] px-2 py-0.5 rounded-lg font-semibold"
          :style="{
            background: `${cc.color}${cc.changed ? '28' : '14'}`,
            border: `1px solid ${cc.color}${cc.changed ? '60' : '30'}`,
            color: cc.color,
            boxShadow: cc.changed ? `0 0 8px ${cc.color}44` : 'none',
          }"
        >
          {{ cc.className }}
          <span class="font-mono">{{ cc.level }}</span>
          <span v-if="cc.changed" class="ml-1 text-[9px]">▲</span>
        </span>
      </div>

      <div class="mt-2 text-[10px] text-muted">
        Niveau total {{ totalLevel }} →
        <span class="text-amber-400 font-bold font-mono text-[11px]">{{ totalLevel + 1 }}</span>
      </div>
    </div>

    <!-- Stat changes -->
    <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <p class="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Changements</p>
      <div class="flex flex-col gap-1.5 text-[11px]">
        <!-- HP -->
        <div class="flex items-center gap-1">
          <span class="text-muted w-12 shrink-0">PV max</span>
          <span class="font-mono text-(--ui-text)">{{ currentHpMax }}</span>
          <span class="text-muted">→</span>
          <span class="font-mono font-bold text-green-400">{{ currentHpMax + (state.hpGained ?? 0) }}</span>
          <span v-if="state.hpGained" class="text-green-400 text-[10px]">+{{ state.hpGained }}</span>
        </div>
        <!-- Proficiency -->
        <div v-if="profBonusChanged" class="flex items-center gap-1">
          <span class="text-muted w-12 shrink-0">Maîtrise</span>
          <span class="font-mono text-(--ui-text)">+{{ oldProfBonus }}</span>
          <span class="text-muted">→</span>
          <span class="font-mono font-bold text-amber-400">+{{ newProfBonus }}</span>
        </div>
        <!-- Subclass -->
        <div v-if="state.newSubclassName">
          <span class="text-muted">Sous-classe : </span>
          <span class="text-amber-400 font-semibold">{{ state.newSubclassName }}</span>
        </div>
        <!-- Fighting style -->
        <div v-if="state.fightingStyle">
          <span class="text-muted">Style : </span>
          <span class="text-amber-400">{{ state.fightingStyle }}</span>
        </div>
        <!-- Feat -->
        <div v-if="state.asiChoice === 'feat' && state.featId">
          <span class="text-muted">Don : </span>
          <span class="text-amber-400">{{ LU_FEATS.find(f => f.id === state.featId)?.name }}</span>
        </div>
        <!-- ASI bonuses -->
        <div
          v-for="[ab, v] in abiChanges"
          :key="ab"
          class="flex items-center gap-1"
        >
          <span class="text-muted w-12 shrink-0">{{ ABILITY_SHORT[ab] }}</span>
          <span class="font-mono text-(--ui-text)">{{ finalAbilities[ab] }}</span>
          <span class="text-muted">→</span>
          <span class="font-mono font-bold text-amber-400">{{ (finalAbilities[ab] ?? 0) + v }}</span>
        </div>
      </div>
    </div>

    <!-- Abilities snapshot -->
    <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <p class="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Caractéristiques</p>
      <div class="grid grid-cols-3 gap-1">
        <div
          v-for="ab in ABILITIES"
          :key="ab"
          class="text-center py-1.5 rounded-lg"
          :class="(state.asiBonuses[ab] ?? 0) > 0 ? 'bg-amber-500/10' : 'bg-(--ui-bg)'"
        >
          <p class="font-bold font-mono text-sm leading-none" :class="(state.asiBonuses[ab] ?? 0) > 0 ? 'text-amber-400' : 'text-(--ui-text)'">
            {{ (finalAbilities[ab] ?? 10) + (state.asiBonuses[ab] ?? 0) }}
          </p>
          <p class="text-[9px] text-muted mt-0.5 uppercase tracking-wide">{{ ABILITY_SHORT[ab] }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LU_FEATS } from '~/composables/useLevelUp'
import type { AbilityKey } from '~/data/character-builder'

defineProps<{ mobile?: boolean }>()

const charSheet = inject('charSheet') as any
const {
  state,
  charClasses,
  totalLevel,
  pickedClass,
  finalAbilities,
  activeSteps,
  isStepComplete,
  ABILITIES,
  ABILITY_SHORT,
  profBonusAtLevel,
} = useLevelUp(charSheet)

const completedCount = computed(() =>
  activeSteps.value.filter(s => isStepComplete.value(s.id)).length,
)

const currentHpMax = computed(() => charSheet?.value?.maxHp ?? 0)

const oldProfBonus = computed(() => profBonusAtLevel(totalLevel.value))
const newProfBonus = computed(() => profBonusAtLevel(totalLevel.value + 1))
const profBonusChanged = computed(() => newProfBonus.value > oldProfBonus.value)

const abiChanges = computed(() =>
  (Object.entries(state.value.asiBonuses) as Array<[AbilityKey, number]>)
    .filter(([, v]) => v > 0),
)

// Projected classes list after level-up
const newClassesList = computed(() => {
  const s = state.value
  const list = charClasses.value.map(cc => ({
    ...cc,
    level: s.pickedClassId === cc.classId && !s.isMulticlass ? cc.level + 1 : cc.level,
    changed: s.pickedClassId === cc.classId && !s.isMulticlass,
  }))
  if (s.isMulticlass && pickedClass.value) {
    list.push({
      classId: pickedClass.value.id,
      className: pickedClass.value.name,
      level: 1,
      color: pickedClass.value.color,
      changed: true,
      dbClassId: 0,
      isMain: false,
      dbSubclassId: null,
      subclassName: null,
      hitDie: pickedClass.value.hitDie,
      emoji: pickedClass.value.emoji,
      data: pickedClass.value,
    })
  }
  return list
})
</script>
