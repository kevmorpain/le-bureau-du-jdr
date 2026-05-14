<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">⚔️</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Classe</h2>
        <p class="text-sm text-muted mt-0.5">La classe définit votre rôle, votre dé de vie, vos aptitudes et votre style de jeu.</p>
      </div>
    </div>

    <!-- Grille des classes -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        <div class="flex items-center gap-2.5 mb-2">
          <span class="text-2xl leading-none">{{ cls.emoji }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-(--ui-text) text-sm">{{ cls.name }}</div>
            <div class="flex gap-1.5 mt-1 flex-wrap">
              <span
                class="text-xs px-1.5 py-0.5 rounded-full border"
                :style="`background: ${cls.color}18; border-color: ${cls.color}40; color: ${cls.color}`"
              >{{ cls.role }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded-full border border-(--ui-border) bg-(--ui-bg) text-muted">d{{ cls.hitDie }}</span>
            </div>
          </div>
        </div>
        <div class="text-xs text-muted leading-relaxed mb-2">{{ cls.description }}</div>
        <div class="flex gap-3 text-xs">
          <span class="text-muted">
            JS : <span :style="`color: ${cls.color}`">{{ cls.savingThrows.map(s => ABILITY_SHORT[s as AbilityKey]).join('+') }}</span>
          </span>
          <span v-if="cls.spellcasting" class="text-violet-400">
            Sorts {{ ABILITY_SHORT[cls.spellcasting.ability as AbilityKey] }}
          </span>
        </div>
      </button>
    </div>

    <!-- Sections post-sélection -->
    <template v-if="classData">

      <!-- Sélecteur de niveau -->
      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-2.5 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted flex-1">Niveau de départ</p>
          <span class="font-mono font-bold text-xl text-amber-400">{{ state.level }}</span>
          <span class="text-xs text-muted">· Maîtrise +{{ profBonus }}</span>
        </div>

        <!-- Grille niveaux -->
        <div class="flex flex-wrap gap-1.5 mb-3">
          <button
            v-for="n in 20"
            :key="n"
            type="button"
            class="w-8 h-8 rounded-md border text-xs font-bold transition-all cursor-pointer relative"
            :class="state.level === n
              ? 'bg-amber-500 border-amber-500 text-zinc-900'
              : classData.levelMilestones[n]
                ? 'border-amber-500/40 bg-amber-500/8 text-amber-400 hover:border-amber-500/70'
                : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
            @click="state.level = n"
          >
            {{ n }}
            <span
              v-if="classData.levelMilestones[n] && state.level !== n"
              class="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-500"
            />
          </button>
        </div>

        <!-- Liste cumulée des jalons jusqu'au niveau actuel -->
        <div v-if="milestonesUpToLevel.length" class="flex flex-col gap-1 mb-3">
          <div v-for="[lv, feat] in milestonesUpToLevel" :key="lv" class="flex gap-2 text-xs">
            <span class="font-mono text-amber-400 w-5 shrink-0">{{ lv }}</span>
            <span class="text-muted">{{ feat }}</span>
          </div>
        </div>

        <p class="text-xs text-muted/60">
          Niveaux courants de campagne :
          <span class="text-amber-400">1</span> (débutant) ·
          <span class="text-amber-400">3</span> (sous-classe) ·
          <span class="text-amber-400">5</span> (attaque supp.) ·
          <span class="text-amber-400">11</span> (niveau épique)
        </p>
      </div>

      <!-- Capacités de départ -->
      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Capacités de classe</p>
        <ul class="space-y-3">
          <li
            v-for="(feat, i) in classData.features"
            :key="feat.name"
            :class="i < classData.features.length - 1 ? 'pb-3 border-b border-(--ui-border)' : ''"
          >
            <div class="font-bold text-sm text-(--ui-text) mb-1">{{ feat.name }}</div>
            <div class="text-xs text-muted leading-relaxed">{{ feat.description }}</div>
          </li>
        </ul>
      </div>

      <!-- Compétences -->
      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-2 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">
            Compétences — choisissez {{ classData.skillChoices.count }}
          </p>
          <span
            class="text-xs font-semibold"
            :class="state.skills.length >= classData.skillChoices.count ? 'text-green-400' : 'text-amber-400'"
          >
            {{ state.skills.length }}/{{ classData.skillChoices.count }}
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="skill in availableSkills"
            :key="skill.key"
            type="button"
            class="px-2.5 py-1 rounded-md border text-xs transition-all"
            :class="state.skills.includes(skill.key)
              ? 'border-amber-500 bg-amber-500/10 text-amber-400 cursor-pointer'
              : state.skills.length >= classData.skillChoices.count
                ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-40'
                : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40 cursor-pointer'"
            @click="toggleSkill(skill.key)"
          >
            {{ skill.label }}
            <span class="opacity-60 ml-1">{{ ABILITY_SHORT[skill.ability as AbilityKey] }}</span>
          </button>
        </div>
      </div>

      <!-- Style de combat -->
      <template v-if="fightingStyleOptions">
        <USeparator class="my-6" />
        <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
          <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Style de combat</p>
          <div class="flex flex-col gap-2">
            <button
              v-for="style in fightingStyleOptions"
              :key="style"
              type="button"
              class="text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer"
              :class="state.fightingStyle === style
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
            >
              <div class="font-bold text-sm mb-0.5" @click="state.fightingStyle = style">{{ style }}</div>
              <div class="text-xs text-muted" @click="state.fightingStyle = style">{{ FIGHTING_STYLE_DESCRIPTIONS[style] }}</div>
            </button>
          </div>
        </div>
      </template>

      <!-- Sous-classe -->
      <template v-if="classData.subclasses.length">
        <USeparator class="my-6" />
        <template v-if="state.level >= classData.subclassLevel">
          <div class="rounded-xl border border-amber-500/40 bg-(--ui-bg-elevated) p-4">
            <p class="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
              {{ classData.subclassLabel }} — niveau {{ classData.subclassLevel }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sub in classData.subclasses"
                :key="sub"
                type="button"
                class="px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer"
                :class="state.subclass === sub
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
                @click="state.subclass = sub"
              >
                {{ sub }}
              </button>
            </div>
          </div>
        </template>
        <div
          v-else
          class="rounded-xl border p-3 text-xs text-muted"
          :style="`background: ${classData.color}0f; border-color: ${classData.color}25`"
        >
          Vous choisirez votre
          <strong :style="`color: ${classData.color}`">{{ classData.subclassLabel }}</strong>
          au niveau {{ classData.subclassLevel }}.
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
  profBonus,
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

const milestonesUpToLevel = computed(() => {
  if (!classData.value) return []
  return Object.entries(classData.value.levelMilestones)
    .filter(([lv]) => parseInt(lv) <= state.value.level)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
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
