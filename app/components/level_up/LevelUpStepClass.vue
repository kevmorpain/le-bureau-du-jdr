<template>
  <div>
    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Quelle voie suivre ?</h2>
    <p class="text-sm text-muted mb-5 leading-relaxed">
      Approfondissez une classe existante ou prenez un premier niveau dans une nouvelle classe
      (<em>multi-classage</em>). Les prérequis D&amp;D 5e 2014 sont indiqués à titre indicatif — le MJ a le dernier mot.
    </p>

    <!-- Niveau actuel -->
    <div class="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">État actuel</span>
      <div class="flex flex-wrap gap-2 flex-1">
        <span
          v-for="cc in charClasses"
          :key="cc.classId"
          class="text-xs font-semibold px-2.5 py-1 rounded-lg"
          :style="{ background: `${cc.color}18`, border: `1px solid ${cc.color}40`, color: cc.color }"
        >
          {{ cc.className }}
          <span class="font-mono">{{ cc.level }}</span>
          <span v-if="cc.subclassName" class="ml-1 opacity-70 text-[10px]">· {{ cc.subclassName }}</span>
        </span>
      </div>
      <span class="text-xs text-muted shrink-0">
        Total
        <strong class="font-mono text-amber-400 text-[13px] ml-0.5">{{ totalLevel }}</strong>
        <span class="text-muted"> → {{ totalLevel + 1 }}</span>
      </span>
    </div>

    <!-- Continuer une classe -->
    <div class="text-[10px] font-bold tracking-[0.12em] uppercase text-amber-400 mb-2">
      ① Continuer une classe existante
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
      <button
        v-for="cc in charClasses"
        :key="cc.classId"
        class="text-left rounded-xl p-3.5 transition-all border"
        :class="isPickedContinue(cc.classId)
          ? `border-[${cc.color}] bg-[${cc.color}]/10`
          : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-strong)'"
        :style="isPickedContinue(cc.classId)
          ? { borderColor: cc.color, background: `${cc.color}18`, boxShadow: `0 0 12px ${cc.color}30` }
          : {}"
        @click="pickContinue(cc)"
      >
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">{{ cc.emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-(--ui-text)">{{ cc.className }}</div>
            <div class="text-xs font-mono mt-0.5" :style="{ color: cc.color }">
              niv. {{ cc.level }} → {{ cc.level + 1 }}
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-md font-mono" :style="{ background: `${cc.color}18`, border: `1px solid ${cc.color}40`, color: cc.color }">
            d{{ cc.hitDie }}
          </span>
        </div>

        <!-- Features at next level -->
        <div class="text-xs text-muted leading-snug">
          <template v-if="getFeaturesAt(cc.classId, cc.level + 1).length">
            <span :style="{ color: cc.color }" class="font-semibold">Débloque :</span>
            {{ getFeaturesAt(cc.classId, cc.level + 1).join(' · ') }}
          </template>
          <span v-else class="italic">Pas de nouvelle aptitude · +PV et progression.</span>
        </div>

        <!-- Badges -->
        <div class="flex flex-wrap gap-1.5 mt-2.5">
          <span
            v-if="isSubclassDue(cc)"
            class="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold"
          >⚡ Sous-classe</span>
          <span
            v-if="isAsiDue(cc.classId, cc.level + 1)"
            class="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/30 text-violet-400 font-semibold"
          >✦ ASI / Don</span>
          <span
            v-if="isFightingStyleDue(cc.classId, cc.level + 1)"
            class="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-semibold"
          >⚔ Style de combat</span>
          <span
            v-if="isExpertiseDue(cc.classId, cc.level + 1)"
            class="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
          >★ Expertise</span>
        </div>
      </button>
    </div>

    <!-- Multiclassage -->
    <div class="text-[10px] font-bold tracking-[0.12em] uppercase text-amber-400 mb-2">
      ② Nouvelle classe (multi-classage)
    </div>

    <!-- Prereq info -->
    <div class="text-xs text-muted mb-3 px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated)">
      Le multi-classage nécessite une caractéristique minimale de 13 dans l'aptitude principale de la nouvelle classe. Les prérequis sont affichés mais non bloquants.
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      <button
        v-for="cls in otherClasses"
        :key="cls.id"
        class="text-left rounded-xl p-3 transition-all border"
        :style="isPickedMulticlass(cls.id)
          ? { borderColor: cls.color, background: `${cls.color}18`, boxShadow: `0 0 10px ${cls.color}28` }
          : {}"
        :class="!isPickedMulticlass(cls.id) ? 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-strong)' : ''"
        @click="pickMulticlass(cls)"
      >
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xl">{{ cls.emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-sm text-(--ui-text)">{{ cls.name }}</div>
            <div class="text-[10px] font-mono" :style="{ color: cls.color }">d{{ cls.hitDie }}</div>
          </div>
        </div>

        <!-- Badge sous-classe au niv.1 -->
        <div v-if="cls.subclassLevel === 1" class="mb-1.5">
          <span class="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
            ⚡ Sous-classe dès le niv.1
          </span>
        </div>

        <!-- Prereqs -->
        <div v-if="getPrereqs(cls.id)" class="flex flex-wrap gap-1">
          <template v-for="(req, idx) in getPrereqs(cls.id)" :key="idx">
            <span
              class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
              :class="req.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'"
            >
              {{ req.label }}
            </span>
          </template>
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  LU_ASI_LEVELS,
  LU_FIGHTING_STYLE_LEVELS,
  LU_EXPERTISE_LEVELS,
  LU_MULTICLASS_PREREQS,
} from '~/composables/useLevelUp'
import { ABILITY_SHORT, type AbilityKey } from '~/data/character-builder'

const {
  state,
  charClasses,
  totalLevel,
  finalAbilities,
  pickedClass,
  CLASSES,
} = useLevelUp(inject('charSheet') as any)

const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

const currentClassIds = computed(() => new Set(charClasses.value.map(c => c.classId)))
const otherClasses = computed(() => CLASSES.filter(c => !currentClassIds.value.has(c.id)))

function getFeaturesAt(classId: string, level: number): string[] {
  const cls = CLASSES.find(c => c.id === classId)
  const text = cls?.levelMilestones?.[level]
  return text ? text.split(/[,+]/).map(s => s.trim()).filter(Boolean) : []
}

function isSubclassDue(cc: { classId: string, level: number, subclassName: string | null }): boolean {
  const cls = CLASSES.find(c => c.id === cc.classId)
  return !!cls && cc.level + 1 === cls.subclassLevel && !cc.subclassName
}

function isAsiDue(classId: string, level: number): boolean {
  return (LU_ASI_LEVELS[classId] ?? DEFAULT_ASI_LEVELS).includes(level)
}

function isFightingStyleDue(classId: string, level: number): boolean {
  return (LU_FIGHTING_STYLE_LEVELS[classId] ?? []).includes(level)
}

function isExpertiseDue(classId: string, level: number): boolean {
  return (LU_EXPERTISE_LEVELS[classId] ?? []).includes(level)
}

function getPrereqs(classId: string): Array<{ label: string, ok: boolean }> | null {
  const req = LU_MULTICLASS_PREREQS[classId]
  if (!req) return null
  const abilities = finalAbilities.value

  if (req.or) {
    return (req.or as Array<Partial<Record<AbilityKey, number>>>).flatMap(group =>
      Object.entries(group).map(([ab, min]) => ({
        label: `${ABILITY_SHORT[ab as AbilityKey]} ≥${min} (${abilities[ab as AbilityKey]})`,
        ok: (abilities[ab as AbilityKey] ?? 0) >= (min as number),
      })),
    )
  }

  return Object.entries(req)
    .filter(([k]) => k !== 'or')
    .map(([ab, min]) => ({
      label: `${ABILITY_SHORT[ab as AbilityKey]} ≥${min} (${abilities[ab as AbilityKey]})`,
      ok: (abilities[ab as AbilityKey] ?? 0) >= (min as number),
    }))
}

function isPickedContinue(classId: string) {
  return state.value.pickedClassId === classId && !state.value.isMulticlass
}

function isPickedMulticlass(classId: string) {
  return state.value.pickedClassId === classId && state.value.isMulticlass
}

function pickContinue(cc: { classId: string, level: number }) {
  state.value.pickedClassId = cc.classId
  state.value.isMulticlass = false
  state.value.fromLevel = cc.level
  state.value.toLevel = cc.level + 1
  // Reset dependent fields
  state.value.newSubclassId = null
  state.value.newSubclassName = null
  state.value.fightingStyle = null
  state.value.expertiseSkills = []
  state.value.asiChoice = null
  state.value.asiBonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  state.value.featId = null
  state.value.newCantripIds = []
  state.value.newSpellIds = []
}

function pickMulticlass(cls: { id: string }) {
  state.value.pickedClassId = cls.id
  state.value.isMulticlass = true
  state.value.fromLevel = 0
  state.value.toLevel = 1
  state.value.newSubclassId = null
  state.value.newSubclassName = null
  state.value.fightingStyle = null
  state.value.expertiseSkills = []
  state.value.asiChoice = null
  state.value.asiBonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  state.value.featId = null
  state.value.newCantripIds = []
  state.value.newSpellIds = []
}
</script>
