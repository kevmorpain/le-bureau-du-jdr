<template>
  <div>
    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Quelle voie suivre ?</h2>
    <p class="text-sm text-muted mb-5 leading-relaxed">
      Approfondissez une classe existante ou prenez un premier niveau dans une nouvelle classe
      (<em>multi-classage</em>). Les prérequis D&amp;D 5e 2014 sont indiqués à titre indicatif — le MJ a le dernier mot.
    </p>

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
          <span v-if="cc.subclassName" class="ml-1 opacity-70 text-xs">· {{ cc.subclassName }}</span>
        </span>
      </div>
      <span class="text-xs text-muted shrink-0">
        Total
        <strong class="font-mono text-amber-400 text-[13px] ml-0.5">{{ totalLevel }}</strong>
        <span class="text-muted"> → {{ totalLevel + 1 }}</span>
      </span>
    </div>

    <div class="text-xs font-bold tracking-[0.12em] uppercase text-amber-400 mb-2">
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
          <UBadge :color="cc.classId" variant="subtle" size="md">d{{ cc.hitDie }}</UBadge>
        </div>

        <div class="text-xs text-muted leading-snug">
          <template v-if="getFeaturesAt(cc.classId, cc.level + 1).length">
            <span :style="{ color: cc.color }" class="font-semibold">Débloque :</span>
            {{ getFeaturesAt(cc.classId, cc.level + 1).join(' · ') }}
          </template>
          <span v-else class="italic">Pas de nouvelle aptitude · +PV et progression.</span>
        </div>

        <div class="flex flex-wrap gap-1.5 mt-2.5">
          <UBadge v-if="isSubclassDue(cc)" color="warning" variant="subtle" size="md">⚡ Sous-classe</UBadge>
          <UBadge v-if="isAsiDue(cc.classId, cc.level + 1)" color="violet" variant="subtle" size="md">✦ ASI / Don</UBadge>
          <UBadge v-if="isFightingStyleDue(cc.classId, cc.level + 1)" color="error" variant="subtle" size="md">⚔ Style de combat</UBadge>
          <UBadge v-if="isExpertiseDue(cc.classId, cc.level + 1)" color="success" variant="subtle" size="md">★ Expertise</UBadge>
        </div>
      </button>
    </div>

    <div class="text-xs font-bold tracking-[0.12em] uppercase text-amber-400 mb-2">
      ② Nouvelle classe (multi-classage)
    </div>

    <div class="text-xs text-muted mb-3 px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated)">
      Le multi-classage exige les valeurs minimales de vos classes actuelles <strong>et</strong> de la nouvelle classe. Les prérequis sont affichés mais non bloquants.
      <div
        v-for="cc in currentClassesPrerequisites"
        :key="cc.className"
        class="flex flex-wrap items-center gap-1.5 mt-2"
      >
        <span class="font-semibold text-(--ui-text)">{{ cc.className }} :</span>
        <LevelUpPrerequisiteBadges
          :prerequisites="cc.prerequisites"
          :scores="finalAbilities"
        />
      </div>
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
            <div class="text-xs font-mono" :style="{ color: cls.color }">d{{ cls.hitDie }}</div>
          </div>
        </div>

        <div v-if="subclassLevelFor(cls.id) === 1" class="mb-1.5">
          <UBadge color="warning" variant="subtle" size="md">⚡ Sous-classe dès le niv.1</UBadge>
        </div>

        <LevelUpPrerequisiteBadges
          :prerequisites="multiclassPrerequisitesOf(cls.id)"
          :scores="finalAbilities"
        />
        <div
          v-if="!canMulticlassInto(cls.id)"
          class="text-xs text-red-400 mt-1.5"
        >
          ⚠️ Prérequis non remplis
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const {
  state,
  charClasses,
  totalLevel,
  finalAbilities,
  currentClassesPrerequisites,
  multiclassPrerequisitesOf,
  canMulticlassInto,
  subclassLevelFor,
  fightingStyleLevelFor,
  expertiseDueForClassLevel,
  asiDueForClassLevel,
  selectClass,
  CLASSES,
} = useLevelUp(inject('charSheet') as any)

const currentClassIds = computed(() => new Set(charClasses.value.map(c => c.classId)))
const otherClasses = computed(() => CLASSES.filter(c => !currentClassIds.value.has(c.id)))

function getFeaturesAt(classId: string, level: number): string[] {
  const cls = CLASSES.find(c => c.id === classId)
  const text = cls?.levelMilestones?.[level]
  return text ? text.split(/[,+]/).map(s => s.trim()).filter(Boolean) : []
}

function isSubclassDue(cc: { classId: string, level: number, subclassName: string | null }): boolean {
  // Niveau d'accès à la sous-classe lu dans le catalogue (subclassLevelFor) au lieu du blob.
  return subclassLevelFor(cc.classId) === cc.level + 1 && !cc.subclassName
}

function isAsiDue(classId: string, level: number): boolean {
  return asiDueForClassLevel(classId, level)
}

function isFightingStyleDue(classId: string, level: number): boolean {
  // Niveau d'accès au style de combat lu dans le catalogue (fightingStyleLevelFor) au lieu du blob.
  return fightingStyleLevelFor(classId) === level
}

function isExpertiseDue(classId: string, level: number): boolean {
  return expertiseDueForClassLevel(classId, level)
}

function isPickedContinue(classId: string) {
  return state.value.pickedClassId === classId && !state.value.isMulticlass
}

function isPickedMulticlass(classId: string) {
  return state.value.pickedClassId === classId && state.value.isMulticlass
}

function pickContinue(cc: { classId: string, level: number }) {
  selectClass(cc.classId, cc.level)
}

function pickMulticlass(cls: { id: string }) {
  selectClass(cls.id, 0)
}
</script>
