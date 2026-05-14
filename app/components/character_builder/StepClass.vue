<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">⚔️</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Classe</h2>
        <p class="text-sm text-muted mt-0.5">Choisissez votre classe, votre niveau, vos compétences et votre style de combat.</p>
      </div>
    </div>

    <!-- Grille des classes -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <button
        v-for="cls in CLASSES"
        :key="cls.id"
        type="button"
        class="text-left rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-start"
        :class="state.classId === cls.id
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
        @click="selectClass(cls.id)"
      >
        <div class="flex items-start gap-2">
          <span class="text-2xl leading-none mt-0.5">{{ cls.emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-(--ui-text) text-sm">{{ cls.name }}</div>
            <div class="text-xs text-muted mt-0.5">{{ cls.role }}</div>
            <div class="text-xs font-semibold mt-1" :style="`color: ${cls.color}`">d{{ cls.hitDie }}</div>
          </div>
        </div>

        <!-- Expansion inline si sélectionnée -->
        <div v-if="state.classId === cls.id" class="mt-3 pt-3 border-t border-(--ui-border) w-full">
          <div class="flex flex-wrap gap-1 mb-2">
            <UBadge
              v-for="sv in cls.savingThrows"
              :key="sv"
              color="amber"
              variant="subtle"
              size="md"
            >
              JS {{ ABILITY_SHORT[sv as AbilityKey] }}
            </UBadge>
          </div>
          <div class="text-xs text-muted">{{ cls.armorProficiencies.join(', ') || '—' }}</div>
          <div class="text-xs text-muted mt-0.5">{{ cls.weaponProficiencies.join(', ') }}</div>
        </div>
      </button>
    </div>

    <!-- Sections post-sélection -->
    <template v-if="classData">

      <!-- Sélecteur de niveau -->
      <USeparator class="my-6" />
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Niveau</p>
      <div class="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        <button
          v-for="n in 20"
          :key="n"
          type="button"
          class="rounded-lg border text-center py-1.5 text-sm transition-colors cursor-pointer relative"
          :class="state.level === n
            ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
            : classData.levelMilestones[n]
              ? 'border-amber-500/40 text-(--ui-text) hover:border-amber-500/70'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
          @click="state.level = n"
        >
          {{ n }}
          <span
            v-if="classData.levelMilestones[n]"
            class="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500"
          />
        </button>
      </div>
      <div v-if="classData.levelMilestones[state.level]" class="mt-2 text-xs text-amber-400">
        Niv {{ state.level }} — {{ classData.levelMilestones[state.level] }}
      </div>

      <!-- Capacités de départ -->
      <USeparator class="my-6" />
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Capacités de départ</p>
      <ul class="space-y-2">
        <li v-for="feat in classData.features" :key="feat.name" class="text-sm">
          <span class="font-semibold text-(--ui-text)">{{ feat.name }}</span>
          <span class="text-amber-400 mx-1.5">·</span>
          <span class="text-muted">{{ feat.description }}</span>
        </li>
      </ul>

      <!-- Compétences -->
      <USeparator class="my-6" />
      <div class="flex items-center gap-2 mb-3">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">
          Compétences — choisissez {{ classData.skillChoices.count }}
        </p>
        <span
          class="text-xs font-semibold"
          :class="state.skills.length >= classData.skillChoices.count ? 'text-amber-400' : 'text-muted'"
        >
          ({{ state.skills.length }}/{{ classData.skillChoices.count }})
        </span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <button
          v-for="skill in availableSkills"
          :key="skill.key"
          type="button"
          class="text-left rounded-lg border px-3 py-1.5 text-xs transition-colors cursor-pointer"
          :class="state.skills.includes(skill.key)
            ? 'border-amber-500 bg-amber-500/10 text-(--ui-text) font-medium'
            : state.skills.length >= classData.skillChoices.count
              ? 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/40 cursor-not-allowed'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40'"
          @click="toggleSkill(skill.key)"
        >
          {{ skill.label }}
        </button>
      </div>

      <!-- Style de combat -->
      <template v-if="fightingStyleOptions">
        <USeparator class="my-6" />
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Style de combat</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="style in fightingStyleOptions"
            :key="style"
            type="button"
            class="text-left rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-start"
            :class="state.fightingStyle === style
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
            @click="state.fightingStyle = style"
          >
            <div class="font-semibold text-sm text-(--ui-text)">{{ style }}</div>
            <div class="text-xs text-muted mt-1">{{ FIGHTING_STYLE_DESCRIPTIONS[style] }}</div>
          </button>
        </div>
      </template>

      <!-- Sous-classe -->
      <template v-if="classData.subclasses.length">
        <USeparator class="my-6" />
        <div class="flex items-center gap-3 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">{{ classData.subclassLabel }}</p>
          <span v-if="state.level < classData.subclassLevel" class="text-xs text-muted italic">
            (déverrouillé au niveau {{ classData.subclassLevel }})
          </span>
        </div>
        <div v-if="state.level >= classData.subclassLevel" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            v-for="sub in classData.subclasses"
            :key="sub"
            type="button"
            class="text-left rounded-xl border p-4 transition-colors cursor-pointer flex flex-col justify-start"
            :class="state.subclass === sub
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
            @click="state.subclass = sub"
          >
            <div class="font-semibold text-sm text-(--ui-text)">{{ sub }}</div>
          </button>
        </div>
        <div v-else class="rounded-xl border border-dashed border-(--ui-border) p-4 text-center text-xs text-muted">
          Atteignez le niveau {{ classData.subclassLevel }} pour choisir votre {{ classData.subclassLabel.toLowerCase() }}.
        </div>
      </template>

    </template>
  </div>
</template>

<script lang="ts" setup>
import {
  FIGHTING_STYLES,
  FIGHTING_STYLE_DESCRIPTIONS,
  type AbilityKey,
} from '~/data/character-builder'

const {
  state,
  classData,
  CLASSES,
  SKILLS,
  ABILITY_SHORT,
} = useCharacterBuilder()

const fightingStyleOptions = computed(() =>
  state.value.classId ? FIGHTING_STYLES[state.value.classId] ?? null : null,
)

const availableSkills = computed(() => {
  if (!classData.value) return []
  const from = classData.value.skillChoices.from
  if (from === 'all') return SKILLS
  return SKILLS.filter(s => from.includes(s.key))
})

function selectClass(id: string) {
  state.value.classId = id
  state.value.subclass = null
  state.value.skills = []
  state.value.fightingStyle = null
}

function toggleSkill(key: string) {
  const list = state.value.skills
  const idx = list.indexOf(key)
  if (idx >= 0) {
    list.splice(idx, 1)
  }
  else if (classData.value && list.length < classData.value.skillChoices.count) {
    list.push(key)
  }
}
</script>
