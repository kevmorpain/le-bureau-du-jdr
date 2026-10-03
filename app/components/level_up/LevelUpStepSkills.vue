<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="state.isMulticlass"
      subtitle="Maîtrises gagnées à ce niveau"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">
      Maîtrises
    </h2>

    <template v-if="needed > 0">
      <p class="text-sm text-muted mb-5">
        En rejoignant la classe {{ pickedClass?.name ?? '' }}, vous gagnez
        <strong class="text-(--ui-text)">{{ needed }} compétence{{ needed > 1 ? 's' : '' }}</strong>
        au choix{{ poolIsAll ? '' : ' parmi la liste ci-dessous' }}.
      </p>

      <p class="text-xs text-muted mb-3">
        Sélectionné :
        <span :class="state.newSkills.length >= requiredMulticlassSkillPicks ? 'text-green-400' : 'text-amber-400'">
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
          <span
            v-if="alreadyProficient(sk.key)"
            class="ml-1 text-xs text-muted/50"
          >(déjà maîtrisé)</span>
        </button>
      </div>
    </template>

    <div
      v-if="newPickChoices.length"
      class="mt-6 space-y-3"
    >
      <ChoicePointPicker
        v-for="choice in newPickChoices"
        :key="choice.progressionId"
        v-model="state.choicePicks[choice.progressionId]"
        :kind="choice.kind"
        :count="choice.count"
        :options="choice.options.map(optionPickValue).filter((v): v is string | number => v != null)"
        :owned="ownedFor(choice)"
      />
    </div>

    <div
      v-if="replacementChoices.length"
      class="mt-6"
    >
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-1">
        Maîtrise en double
      </p>
      <p class="text-xs text-muted mb-3">
        Reçue de deux sources : <strong class="text-(--ui-text)">{{ duplicatedProficiencies.join(', ') }}</strong>. Vous pouvez choisir
        une autre maîtrise de même nature à la place.
      </p>
      <div class="space-y-3">
        <ChoicePointPicker
          v-for="choice in replacementChoices"
          :key="choice.progressionId"
          v-model="state.choicePicks[choice.progressionId]"
          :kind="choice.kind"
          :count="choice.count"
          :options="choice.options.map(optionPickValue).filter((v): v is string | number => v != null)"
          :owned="ownedFor(choice)"
          :title="choice.kind === 'skill' ? 'Compétence de remplacement' : 'Outil de remplacement'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { SKILL_KEYS } from '~~/shared/rules/skills'
import { optionPickValue } from '~~/shared/rules/resolve'

const {
  state,
  pickedClass,
  proficientSkills,
  multiclassSkills,
  requiredMulticlassSkillPicks,
  newPickChoices,
  replacementChoices,
  duplicatedProficiencies,
  ownedFor,
  SKILLS,
} = useLevelUp(inject('charSheet') as any)

const needed = computed(() => multiclassSkills.value.count)
const poolIsAll = computed(() => multiclassSkills.value.options.length === SKILL_KEYS.length)
const availableSkills = computed(() => {
  const pool = new Set<string>(multiclassSkills.value.options)
  return SKILLS.filter(s => pool.has(s.key))
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
