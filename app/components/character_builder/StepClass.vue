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

      <!-- Faveur du Pacte (Occultiste niveau ≥ 3) -->
      <template v-if="needsPactBoon">
        <USeparator class="my-6" />
        <div class="rounded-xl border border-violet-500/40 bg-(--ui-bg-elevated) p-4">
          <p class="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">
            🌑 Don du Pacte — niveau 3
          </p>
          <div class="flex flex-col gap-2">
            <button
              v-for="option in PACT_BOON_OPTIONS"
              :key="option.id"
              type="button"
              class="text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer"
              :class="state.pactBoon === option.id
                ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-violet-500/40'"
              @click="state.pactBoon = option.id"
            >
              <div class="font-semibold">{{ option.name }}</div>
              <div class="text-muted font-normal mt-0.5 leading-snug">{{ option.hint }}</div>
            </button>
          </div>
        </div>
      </template>

      <!-- Points de vie -->
      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-3 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted flex-1">Points de vie</p>
          <span class="font-black font-mono text-xl text-amber-400">{{ hpMax ?? '—' }}</span>
          <span class="text-xs text-muted">PV max</span>
        </div>

        <!-- Sélecteur de mode -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="m in HP_MODES"
            :key="m.id"
            type="button"
            class="px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer"
            :class="state.hpMode === m.id
              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
              : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40'"
            @click="switchHpMode(m.id)"
          >
            {{ m.label }}
          </button>
        </div>

        <!-- Mode Moyenne -->
        <p v-if="state.hpMode === 'average'" class="text-xs text-muted">
          Niveau 1 : {{ classData.hitDie }} (maximum). Niveaux suivants : {{ Math.ceil(classData.hitDie / 2) + 1 }} par niveau.
        </p>

        <!-- Mode Jet de dés -->
        <template v-if="state.hpMode === 'roll'">
          <div v-if="state.level === 1" class="text-xs text-muted">
            Niveau 1 : toujours le maximum ({{ classData.hitDie }}).
          </div>
          <template v-else>
            <p class="text-xs text-muted mb-3">
              Niveau 1 : {{ classData.hitDie }} (max). Lancez 1d{{ classData.hitDie }} pour chaque niveau suivant.
            </p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="i in state.level - 1"
                :key="i"
                class="flex flex-col items-center gap-1"
              >
                <span class="text-xs text-muted">Niv.{{ i + 1 }}</span>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    :min="1"
                    :max="classData.hitDie"
                    :value="state.hpRolled?.[i - 1] ?? ''"
                    class="w-12 h-10 rounded-lg border border-(--ui-border) bg-(--ui-bg) text-center text-sm font-bold font-mono text-(--ui-text) focus:border-amber-500 focus:outline-none"
                    @change="setRolledHp(i - 1, ($event.target as HTMLInputElement).valueAsNumber)"
                  >
                </div>
              </div>
              <button
                type="button"
                class="self-end px-3 py-2 rounded-lg border border-amber-500 bg-amber-500/10 text-amber-400 text-xs font-semibold cursor-pointer hover:bg-amber-500/20 transition-colors"
                @click="rollAllHp"
              >
                🎲 Tout lancer
              </button>
            </div>
          </template>
        </template>

        <!-- Mode Manuel -->
        <div v-if="state.hpMode === 'manual'" class="flex items-center gap-3">
          <input
            type="number"
            :min="1"
            :value="state.hpManual ?? hpAverage"
            class="w-20 h-10 rounded-lg border border-(--ui-border) bg-(--ui-bg) text-center text-lg font-bold font-mono text-(--ui-text) focus:border-amber-500 focus:outline-none"
            @change="state.hpManual = ($event.target as HTMLInputElement).valueAsNumber || null"
          >
          <span class="text-xs text-muted">Saisissez votre total de PV max</span>
        </div>
      </div>

    </template>
  </div>
</template>

<script lang="ts" setup>
import {
  FIGHTING_STYLES,
  FIGHTING_STYLE_DESCRIPTIONS,
  type AbilityKey,
} from '~/data/character-builder'

const PACT_BOON_OPTIONS = [
  { id: 'chain' as const, name: 'Pacte de la Chaîne', hint: 'Apprend Appel de familier. Peut convoquer un familier spécial.' },
  { id: 'blade' as const, name: 'Pacte de la Lame', hint: 'Crée une arme magique à volonté. Vous choisirez une arme à l\'étape Équipement.' },
  { id: 'tome' as const, name: 'Pacte du Tome', hint: 'Livre des Ombres : 3 sorts mineurs de n\'importe quelle classe. Vous les choisirez à l\'étape Sorts.' },
]

const {
  state,
  classData,
  hpMax,
  profBonus,
  needsPactBoon,
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

const HP_MODES = [
  { id: 'average', label: 'Moyenne' },
  { id: 'roll', label: 'Jet de dés' },
  { id: 'manual', label: 'Manuel' },
] as const

const hpAverage = computed(() => {
  if (!classData.value) return 0
  const hitDie = classData.value.hitDie
  return hitDie + (state.value.level - 1) * (Math.ceil(hitDie / 2) + 1)
})

function switchHpMode(mode: 'average' | 'roll' | 'manual') {
  state.value.hpMode = mode
  if (mode === 'manual' && state.value.hpManual == null) {
    state.value.hpManual = hpAverage.value
  }
  if (mode !== 'roll') state.value.hpRolled = null
}

function setRolledHp(idx: number, value: number) {
  const hitDie = classData.value?.hitDie ?? 8
  const clamped = Math.max(1, Math.min(hitDie, value || 1))
  const arr = [...(state.value.hpRolled ?? Array(state.value.level - 1).fill(null))]
  arr[idx] = clamped
  state.value.hpRolled = arr
}

function rollAllHp() {
  const hitDie = classData.value?.hitDie ?? 8
  state.value.hpRolled = Array.from(
    { length: state.value.level - 1 },
    () => Math.floor(Math.random() * hitDie) + 1,
  )
}

function selectClass(id: string) {
  state.value.classId = id
  state.value.subclass = null
  state.value.skills = []
  state.value.fightingStyle = null
  state.value.hpMode = 'average'
  state.value.hpRolled = null
  state.value.hpManual = null
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
