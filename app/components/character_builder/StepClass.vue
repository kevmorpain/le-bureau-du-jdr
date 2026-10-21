<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">⚔️</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Classe</h2>
        <p class="text-sm text-muted mt-0.5">La classe définit votre rôle, votre dé de vie, vos aptitudes et votre style de jeu.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="cls in filteredClasses"
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
              <UBadge :color="cls.id" variant="subtle" size="md">{{ cls.role }}</UBadge>
              <UBadge :color="cls.id" variant="subtle" size="md">d{{ cls.hitDie }}</UBadge>
            </div>
          </div>
        </div>
        <div class="text-xs text-muted leading-relaxed mb-2">{{ cls.description }}</div>
        <div class="flex gap-3 text-xs">
          <span class="text-muted">
            JS : <span :style="`color: ${cls.color}`">{{ savingThrowsLabel(cls.dbName) }}</span>
          </span>
          <span v-if="cls.spellcasting" class="text-violet-400">
            Sorts {{ ABILITY_SHORT[cls.spellcasting.ability as AbilityKey] }}
          </span>
        </div>
      </button>
    </div>

    <template v-if="classData">

      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-2.5 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted flex-1">Niveau de départ</p>
          <span class="font-mono font-bold text-xl text-amber-400">{{ state.level }}</span>
          <span class="text-xs text-muted">· Maîtrise +{{ profBonus }}</span>
        </div>

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

      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-2 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">
            Compétences — choisissez {{ classSkillCount }}
          </p>
          <span
            class="text-xs font-semibold"
            :class="state.skills.length >= classSkillCount ? 'text-green-400' : 'text-amber-400'"
          >
            {{ state.skills.length }}/{{ classSkillCount }}
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
              : state.skills.length >= classSkillCount
                ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-40'
                : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40 cursor-pointer'"
            @click="toggleSkill(skill.key)"
          >
            {{ skill.label }}
            <span class="opacity-60 ml-1">{{ ABILITY_SHORT[skill.ability as AbilityKey] }}</span>
          </button>
        </div>
        <p
          v-if="classSkillConflicts.length"
          class="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
        >
          ⚠️ Déjà accordé par ailleurs : <strong>{{ classSkillConflictLabels }}</strong>. Ce doublon est gaspillé — change ton choix ci-dessus.
        </p>
      </div>

      <template v-if="classChoices.length">
        <USeparator class="my-6" />
        <div class="space-y-3">
          <ChoicePointPicker
            v-for="choice in classChoices"
            :key="choice.progressionId"
            v-model="state.choicePicks[choice.progressionId]"
            :kind="choice.kind"
            :count="choice.count"
            :options="optionValuesOf(choice)"
            :owned="ownedFor(choice)"
            :title="choiceTitle(choice)"
          />
        </div>
      </template>

      <template v-if="featurePickChoices.length">
        <USeparator class="my-6" />
        <div class="space-y-3">
          <template
            v-for="choice in featurePickChoices"
            :key="choice.progressionId"
          >
            <FeaturePickPicker
              v-model="state.featurePicks[choice.progressionId]"
              :title="choiceTitle(choice) ?? 'Choix'"
              :count="choice.count"
              :options="choice.options"
              :owner-level="choice.classLevel"
              :unlock-level="choice.ownerLevelRequired"
              :accent="choiceAccent(choice)"
              :excluded-ids="featurePicksElsewhere(choice.progressionId)"
              :projection="eligibility"
            />
            <p
              v-if="choice.kind === 'pact_boon' && pactBoon"
              class="rounded-xl border border-violet-500/30 bg-violet-500/5 px-3 py-2.5 text-xs text-muted"
            >
              {{ PACT_BOON_NOTES[pactBoon] }}
            </p>
          </template>
        </div>
      </template>

      <template v-if="needsExpertise">
        <USeparator class="my-6" />
        <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
          <div class="flex items-center gap-2 mb-1">
            <p class="text-xs font-bold uppercase tracking-widest text-muted">
              ★ Expertise — choisissez {{ expertiseExpected }}
            </p>
            <span
              class="text-xs font-semibold"
              :class="state.expertiseSkills.length >= expertiseExpected ? 'text-green-400' : 'text-amber-400'"
            >
              {{ state.expertiseSkills.length }}/{{ expertiseExpected }}
            </span>
          </div>
          <p class="text-xs text-muted mb-3">Doublez le bonus de maîtrise sur des compétences déjà maîtrisées.</p>
          <div v-if="eligibleExpertiseSkills.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="sk in eligibleExpertiseSkills"
              :key="sk.key"
              type="button"
              class="px-2.5 py-1 rounded-md border text-xs transition-all"
              :class="state.expertiseSkills.includes(sk.key)
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold cursor-pointer'
                : !state.expertiseSkills.includes(sk.key) && state.expertiseSkills.length >= expertiseExpected
                  ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-40'
                  : 'border-(--ui-border) bg-transparent text-muted hover:border-emerald-500/40 cursor-pointer'"
              :disabled="!state.expertiseSkills.includes(sk.key) && state.expertiseSkills.length >= expertiseExpected"
              @click="toggleExpertise(sk.key)"
            >
              {{ sk.label }}
            </button>
          </div>
          <p v-else class="text-xs italic text-muted">Choisissez d'abord vos compétences de classe ci-dessus.</p>
        </div>
      </template>

      <template v-if="subclassOptions.length">
        <USeparator class="my-6" />
        <template v-if="needsSubclass">
          <div class="rounded-xl border border-amber-500/40 bg-(--ui-bg-elevated) p-4">
            <p class="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
              {{ classData.subclassLabel }} — niveau {{ subclassLevel }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sub in subclassOptions"
                :key="sub.id"
                type="button"
                class="px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer"
                :class="state.subclass === sub.name
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-(--ui-border) bg-(--ui-bg) text-muted hover:border-amber-500/40'"
                @click="state.subclass = sub.name"
              >
                {{ sub.name }}
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
          au niveau {{ subclassLevel }}.
        </div>
      </template>

      <USeparator class="my-6" />
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-3 mb-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted flex-1">Points de vie</p>
          <span class="font-black font-mono text-xl text-amber-400">{{ hpMax ?? '—' }}</span>
          <span class="text-xs text-muted">PV max</span>
        </div>

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

        <p v-if="state.hpMode === 'average'" class="text-xs text-muted">
          Niveau 1 : {{ classData.hitDie }} (maximum). Niveaux suivants : {{ Math.ceil(classData.hitDie / 2) + 1 }} par niveau.
        </p>

        <template v-if="state.hpMode === 'roll'">
          <div v-if="state.level === 1" class="text-xs text-muted">
            Niveau 1 : toujours le maximum ({{ classData.hitDie }}).
          </div>
          <template v-else>
            <p class="text-xs text-muted mb-3">
              Niveau 1 : {{ classData.hitDie }} (max). Lancez 1d{{ classData.hitDie }} pour chaque niveau suivant ; un niveau non lancé compte pour la valeur moyenne ({{ Math.ceil(classData.hitDie / 2) + 1 }}).
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
import { type AbilityKey } from '~/data/character-builder'
import { isGatedSource } from '~~/shared/rules/source'
import { averageBaseHitPoints } from '~~/shared/rules/hitPoints'
import type { PactBoon } from '~~/shared/rules/pactBoon'

const PACT_BOON_NOTES: Record<PactBoon, string> = {
  chain: 'Le sort Appel de familier sera ajouté à votre grimoire.',
  blade: 'Vous choisirez votre arme de pacte à l\'étape Équipement.',
  tome: 'Vous choisirez vos 3 sorts mineurs du Tome à l\'étape Sorts.',
}

const {
  state,
  classData,
  conMod,
  hpMax,
  profBonus,
  classSkillCount,
  classSkillOptions,
  needsSubclass,
  subclassLevel,
  subclassOptions,
  needsExpertise,
  expertiseExpected,
  proficientSkills,
  classSkillConflicts,
  classSkillConflictLabels,
  classChoices,
  featurePickChoices,
  featurePicksElsewhere,
  pactBoon,
  ownedFor,
  optionValuesOf,
  CLASSES,
  SKILLS,
  ABILITY_SHORT,
} = useCharacterBuilder()

// Gating : les classes d'extension (source gatée) ne sont visibles qu'avec le toggle « Étendu ».
const { extended, extendedQuery } = useExtendedContent()
const filteredClasses = computed(() =>
  CLASSES.filter(c => !c.source || !isGatedSource(c.source) || extended.value),
)

const { resolveClassId, classProficienciesFor } = useBuilderEntities()
const savingThrowsLabel = (dbName: string) => classProficienciesFor(resolveClassId(dbName)).savingThrows
  .flatMap(e => e.type === 'saving_throw_proficiency' ? [ABILITY_SHORT[e.value.ability]] : [])
  .join('+')

const { data: allSpells } = useFetch<Array<{ id: number, name: string }>>('/api/spells', {
  query: extendedQuery,
})
const knownSpellNames = computed(() => {
  const ids = new Set<number>([
    ...state.value.selectedCantrips,
    ...state.value.selectedSpells,
    ...state.value.selectedPactBoonCantripIds,
  ])
  return (allSpells.value ?? []).filter(s => ids.has(s.id)).map(s => s.name)
})

// L'état du personnage qui décide des prérequis des manifestations (pacte, sorts connus).
const eligibility = computed(() => ({ pactBoon: pactBoon.value, knownSpellNames: knownSpellNames.value }))

const availableSkills = computed(() => SKILLS.filter(s => classSkillOptions.value.includes(s.key)))

const eligibleExpertiseSkills = computed(() => SKILLS.filter(s => proficientSkills.value.includes(s.key)))
function toggleExpertise(skillKey: string) {
  const idx = state.value.expertiseSkills.indexOf(skillKey)
  if (idx >= 0) state.value.expertiseSkills.splice(idx, 1)
  else if (state.value.expertiseSkills.length < expertiseExpected.value) state.value.expertiseSkills.push(skillKey)
}

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

// Maximum obtenu avec les valeurs fixes, CON comprise : ce que le mode manuel propose au départ.
const hpAverage = computed(() => {
  if (!classData.value) return 0
  return averageBaseHitPoints(classData.value.hitDie, state.value.level, conMod.value) + conMod.value * state.value.level
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
  state.value.featurePicks = {}
  state.value.expertiseSkills = []
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
  else if (list.length < classSkillCount.value) {
    list.push(key)
  }
}
</script>
