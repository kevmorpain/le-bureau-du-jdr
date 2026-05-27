<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="true"
      subtitle="Compétences gagnées en rejoignant cette classe"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Compétences</h2>
    <p class="text-sm text-muted mb-5">
      En rejoignant la classe {{ pickedClass?.name ?? '' }}, vous gagnez
      <strong class="text-(--ui-text)">{{ needed }} compétence{{ needed > 1 ? 's' : '' }}</strong>
      au choix{{ poolIsAll ? '' : ' parmi la liste ci-dessous' }}.
    </p>

    <p class="text-xs text-muted mb-3">
      Sélectionné :
      <span :class="state.newSkills.length >= needed ? 'text-green-400' : 'text-amber-400'">
        {{ state.newSkills.length }}/{{ needed }}
      </span>
    </p>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button
        v-for="sk in availableSkills"
        :key="sk.key"
        class="text-left px-3 py-2 rounded-xl border text-sm transition-all"
        :class="state.newSkills.includes(sk.key)
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 font-semibold'
          : alreadyProficient(sk.key)
            ? 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/40 cursor-not-allowed'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-(--ui-border-strong)'"
        :disabled="!state.newSkills.includes(sk.key) && (state.newSkills.length >= needed || alreadyProficient(sk.key))"
        @click="toggle(sk.key)"
      >
        <span>{{ sk.label }}</span>
        <span v-if="alreadyProficient(sk.key)" class="ml-1 text-xs text-muted/50">(déjà maîtrisé)</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { LU_MULTICLASS_SKILL_COUNT, LU_MULTICLASS_SKILL_POOL } from '~/composables/useLevelUp'

const {
  state,
  pickedClass,
  proficientSkills,
  SKILLS,
} = useLevelUp(inject('charSheet') as any)

const clsId = computed(() => state.value.pickedClassId ?? '')
const needed = computed(() => LU_MULTICLASS_SKILL_COUNT[clsId.value] ?? 1)
const poolKeys = computed(() => LU_MULTICLASS_SKILL_POOL[clsId.value])
const poolIsAll = computed(() => poolKeys.value === null)

const availableSkills = computed(() => {
  const pool = poolKeys.value
  if (!pool) return SKILLS
  return SKILLS.filter(s => pool.includes(s.key))
})

function alreadyProficient(key: string) {
  return proficientSkills.value.includes(key)
}

function toggle(key: string) {
  const idx = state.value.newSkills.indexOf(key)
  if (idx >= 0) {
    state.value.newSkills.splice(idx, 1)
  } else if (state.value.newSkills.length < needed.value) {
    state.value.newSkills.push(key)
  }
}
</script>
