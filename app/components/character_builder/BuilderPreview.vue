<template>
  <div class="flex flex-col gap-3" :class="mobile ? 'py-2' : 'py-1'">
    <p v-if="!mobile" class="text-xs font-bold uppercase tracking-widest text-muted">
      Aperçu
    </p>

    <!-- Progression -->
    <div>
      <div class="flex justify-between text-xs text-muted mb-1">
        <span>Progression</span>
        <span class="text-amber-400">{{ completedCount }}/{{ activeSteps.length }}</span>
      </div>
      <UProgress
        :value="progressPercent"
        color="warning"
        size="xs"
        :animation="false"
      />
    </div>

    <!-- Identité -->
    <div class="rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <p class="font-bold text-sm" :class="state.name ? 'text-(--ui-text)' : 'text-muted italic'">
        {{ state.name || 'Nom à définir…' }}
      </p>
      <div class="flex flex-wrap gap-1 mt-1.5">
        <span
          v-if="raceName"
          class="text-xs px-1.5 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted"
        >
          {{ raceName }}
        </span>
        <span
          v-if="classData"
          class="text-xs px-1.5 py-0.5 rounded-full border"
          :style="{ background: `${classData.color}18`, borderColor: `${classData.color}40`, color: classData.color }"
        >
          {{ classData.name }} niv.{{ state.level }}
        </span>
        <span
          v-if="alignmentData"
          class="text-xs px-1.5 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted"
        >
          {{ alignmentData.short }}
        </span>
      </div>
      <p v-if="backgroundData" class="text-xs text-muted mt-1">
        {{ backgroundData.name }}
      </p>
      <p v-if="state.subclass" class="text-xs text-amber-400 mt-0.5">
        {{ state.subclass }}
      </p>
    </div>

    <!-- Stats clés -->
    <div v-if="classData" class="rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Stats</p>
      <div class="grid grid-cols-3 gap-1">
        <div
          v-for="stat in keyStats"
          :key="stat.label"
          class="text-center bg-(--ui-bg) rounded-md py-1.5"
        >
          <p class="font-bold font-mono text-sm leading-none">{{ stat.value }}</p>
          <p class="text-xs text-muted mt-0.5 leading-none">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Caractéristiques -->
    <div v-if="hasAbilities" class="rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Caractéristiques</p>
      <div class="grid grid-cols-3 gap-1">
        <div
          v-for="ab in ABILITIES"
          :key="ab"
          class="text-center bg-(--ui-bg) rounded-md py-1.5"
        >
          <p class="font-bold font-mono text-sm leading-none text-(--ui-text)">
            {{ finalAbilities[ab] ?? '—' }}
          </p>
          <p
            class="text-xs font-mono leading-none mt-0.5"
            :class="modColor(finalAbilities[ab])"
          >
            {{ finalAbilities[ab] != null ? formatMod(abilityMod(finalAbilities[ab]!)) : '' }}
          </p>
          <p class="text-xs text-muted mt-0.5 leading-none">{{ ABILITY_SHORT[ab] }}</p>
        </div>
      </div>
    </div>

    <!-- Compétences -->
    <div v-if="allSkills.length" class="rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Compétences</p>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="sk in allSkills"
          :key="sk"
          class="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400"
        >
          {{ SKILLS.find(s => s.key === sk)?.label ?? sk }}
        </span>
      </div>
    </div>

    <!-- Sorts -->
    <div
      v-if="selectedSpellNames.length > 0"
      class="rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) p-3"
    >
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Sorts</p>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="name in selectedSpellNames"
          :key="name"
          class="text-xs px-1.5 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted"
        >{{ name }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ mobile?: boolean }>()

const {
  state,
  activeSteps,
  isStepComplete,
  raceData,
  subraceData,
  classData,
  backgroundData,
  alignmentData,
  finalAbilities,
  hasAbilities,
  hpMax,
  baseAC,
  speed,
  initiative,
  profBonus,
  passivePerception,
  ABILITIES,
  ABILITY_SHORT,
  SKILLS,
  abilityMod,
  formatMod,
} = useCharacterBuilder()

const completedCount = computed(() =>
  activeSteps.value.filter(s => isStepComplete.value(s.id)).length,
)
const progressPercent = computed(() =>
  Math.round((completedCount.value / activeSteps.value.length) * 100),
)

const raceName = computed(() => {
  if (!raceData.value) return null
  return subraceData.value ? subraceData.value.name : raceData.value.name
})

const keyStats = computed(() => [
  { label: 'PV', value: hpMax.value != null ? String(hpMax.value) : '—' },
  { label: 'CA', value: String(baseAC.value) },
  { label: 'Vit.', value: `${speed.value}m` },
  { label: 'Prof.', value: formatMod(profBonus.value) },
  { label: 'Init.', value: formatMod(initiative.value) },
  { label: 'Perc.', value: String(passivePerception.value) },
])

const allSkills = computed(() => [
  ...new Set([
    ...state.value.skills,
    ...(backgroundData.value?.skillProficiencies ?? []),
  ]),
])

const spellNamesById = useState<Record<number, string>>('builder-spell-names', () => ({}))
const selectedSpellNames = computed(() => {
  const map = spellNamesById.value
  return [
    ...state.value.selectedCantrips.map(id => map[id]).filter(Boolean),
    ...state.value.selectedSpells.map(id => map[id]).filter(Boolean),
  ]
})

function modColor(score: number | null | undefined): string {
  if (score == null) return 'text-muted'
  return abilityMod(score) >= 0 ? 'text-amber-400' : 'text-red-400'
}
</script>
