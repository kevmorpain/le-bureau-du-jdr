<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="state.isMulticlass"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Aptitudes</h2>

    <!-- Features unlocked -->
    <div class="mb-5">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Nouvelles aptitudes</p>
      <template v-if="newFeatures.length">
        <div class="flex flex-col gap-2">
          <div
            v-for="feat in newFeatures"
            :key="feat"
            class="flex items-start gap-3 px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated)"
          >
            <span class="text-amber-400 mt-0.5 shrink-0">✦</span>
            <span class="text-sm text-(--ui-text) font-medium">{{ feat }}</span>
          </div>
        </div>
      </template>
      <div v-else class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm text-muted italic">
        Pas de nouvelle aptitude à ce niveau — vous gagnez néanmoins +PV et la progression continue.
      </div>
    </div>

    <!-- Proficiency bonus change -->
    <div
      v-if="profBonusChange"
      class="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8 text-sm"
    >
      <span class="text-amber-400 text-lg">⬆</span>
      <span class="text-amber-400 font-semibold">Bonus de maîtrise :</span>
      <span class="text-muted">{{ formatMod(oldProfBonus) }} → </span>
      <span class="text-amber-400 font-bold font-mono">{{ formatMod(profBonusChange) }}</span>
    </div>

    <!-- Subclass choice -->
    <div v-if="isSubclassLevel && subclasses.length" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">
        ⚡ Choisissez votre {{ pickedClass?.subclassLabel ?? 'sous-classe' }}
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="sub in subclasses"
          :key="sub.id"
          class="text-left px-4 py-3 rounded-xl border transition-all"
          :class="state.newSubclassId === sub.id
            ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-strong) text-(--ui-text)'"
          @click="selectSubclass(sub)"
        >
          <div class="font-semibold text-sm">{{ sub.name }}</div>
          <div v-if="sub.description" class="text-xs text-muted mt-0.5 leading-snug line-clamp-2">{{ sub.description }}</div>
        </button>
      </div>
    </div>

    <!-- Fighting style -->
    <div v-if="needsFightingStyle" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">
        ⚔ Style de combat
      </p>
      <div class="flex flex-col gap-2">
        <button
          v-for="style in availableStyles"
          :key="style"
          class="text-left px-4 py-3 rounded-xl border transition-all"
          :class="state.fightingStyle === style
            ? 'border-red-500/60 bg-red-500/10 text-red-400'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-strong) text-(--ui-text)'"
          @click="state.fightingStyle = style"
        >
          <div class="font-semibold text-sm">{{ style }}</div>
          <div class="text-xs text-muted mt-0.5">{{ FIGHTING_STYLE_DESCRIPTIONS[style] }}</div>
        </button>
      </div>
    </div>

    <!-- Expertise -->
    <div v-if="needsExpertise" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">
        ★ Expertise
        <span class="ml-1 text-muted/60 normal-case font-normal tracking-normal">
          — Choisissez 2 compétences sur lesquelles doubler le bonus de maîtrise
        </span>
      </p>
      <p class="text-xs text-muted mb-3">
        Sélectionné : <span :class="state.expertiseSkills.length >= 2 ? 'text-green-400' : 'text-amber-400'">{{ state.expertiseSkills.length }}/2</span>
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <button
          v-for="sk in eligibleSkills"
          :key="sk.key"
          class="text-left px-3 py-2 rounded-lg border text-xs transition-all"
          :class="state.expertiseSkills.includes(sk.key)
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-semibold'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-(--ui-border-strong)'"
          :disabled="!state.expertiseSkills.includes(sk.key) && state.expertiseSkills.length >= 2"
          @click="toggleExpertise(sk.key)"
        >
          {{ sk.label }}
        </button>
      </div>
    </div>

    <!-- No choices required -->
    <div
      v-if="!isSubclassLevel && !needsFightingStyle && !needsExpertise"
      class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-muted"
    >
      Aucun choix requis à cette étape. Cliquez sur Suivant pour continuer.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LU_EXPERTISE_LEVELS, LU_FIGHTING_STYLE_LEVELS } from '~/composables/useLevelUp'

const {
  state,
  pickedClass,
  pickedCharClass,
  isSubclassLevel,
  needsFightingStyle,
  needsExpertise,
  proficientSkills,
  CLASSES,
  SKILLS,
  FIGHTING_STYLES,
  FIGHTING_STYLE_DESCRIPTIONS,
  profBonusAtLevel,
  formatMod,
  totalLevel,
} = useLevelUp(inject('charSheet') as any)

const charSheet = inject('charSheet') as any

// Features unlocked at the new level
const newFeatures = computed<string[]>(() => {
  if (!pickedClass.value) return []
  const lvl = state.value.toLevel
  const text = pickedClass.value.levelMilestones?.[lvl]
  return text ? text.split(/[,+]/).map((s: string) => s.trim()).filter(Boolean) : []
})

// Proficiency bonus change
const oldProfBonus = computed(() => profBonusAtLevel(totalLevel.value))
const newProfBonus = computed(() => profBonusAtLevel(totalLevel.value + 1))
const profBonusChange = computed(() =>
  newProfBonus.value > oldProfBonus.value ? newProfBonus.value : null,
)

// Subclasses from API
const { data: subclassesData } = useFetch(
  () => pickedClass.value ? `/api/classes/${encodeURIComponent(pickedClass.value!.dbName)}/subclasses` : '',
  { watch: [pickedClass], immediate: true },
)
const subclasses = computed(() => (subclassesData.value ?? []) as Array<{ id: number, name: string, description?: string | null }>)

// Available fighting styles for this class
const availableStyles = computed(() => {
  const clsId = state.value.pickedClassId
  if (!clsId) return []
  return FIGHTING_STYLES[clsId] ?? []
})

// Skills eligible for expertise (must already be proficient)
const eligibleSkills = computed(() => {
  const prof = proficientSkills.value
  return SKILLS.filter(s => prof.includes(s.key))
})

function selectSubclass(sub: { id: number, name: string }) {
  state.value.newSubclassId = sub.id
  state.value.newSubclassName = sub.name
}

function toggleExpertise(skillKey: string) {
  const idx = state.value.expertiseSkills.indexOf(skillKey)
  if (idx >= 0) {
    state.value.expertiseSkills.splice(idx, 1)
  } else if (state.value.expertiseSkills.length < 2) {
    state.value.expertiseSkills.push(skillKey)
  }
}
</script>
