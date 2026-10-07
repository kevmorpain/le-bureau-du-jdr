<template>
  <UCard id="kn-roll">
    <template #header>
      <h2 class="font-semibold">
        Jet de dés
      </h2>
      <p class="text-sm text-muted">
        Choisissez le test : la cible vient du score effectif, la difficulté s'y ajoute, l'Avantage et le Désavantage de la fiche sont lus sur le D100.
      </p>
    </template>

    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <UFormField label="Test">
          <USelect
            :model-value="current.id"
            :items="checkItems"
            class="w-full"
            @update:model-value="select"
          />
        </UFormField>
        <UFormField label="Difficulté">
          <div class="flex gap-2">
            <USelect
              v-model="difficulty"
              :items="difficultyItems"
              class="flex-1"
            />
            <UButton
              variant="soft"
              aria-label="Tirer la difficulté au D8"
              @click="difficulty = knRollDifficulty()"
            >
              D8
            </UButton>
          </div>
        </UFormField>
        <UFormField label="Lecture du dé">
          <USelect
            v-model="modeChoice"
            :items="modeItems"
            class="w-full"
          />
        </UFormField>
      </div>

      <p class="text-sm">
        Cible :
        <span class="font-semibold tabular-nums">{{ target }}</span>
        <span class="text-muted">
          (score effectif {{ current.check.effective }}{{ difficultyModifier ? ` ${signed(difficultyModifier)} ${$t(`ker_nethalas.difficulties.${difficulty}`)}` : '' }})
        </span>
        <UBadge
          v-if="mode !== 'normal'"
          :color="mode === 'advantage' ? 'success' : mode === 'disadvantage' ? 'error' : 'warning'"
          variant="subtle"
          size="md"
          class="ml-2"
          :label="MODE_LABELS[mode]"
        />
      </p>
      <p
        v-if="mode === 'both'"
        class="text-xs text-warning"
      >
        Avantage et Désavantage s'appliquent : le livre ne dit pas comment les combiner, le dé est lu normalement. Choisissez une lecture pour en décider autrement.
      </p>

      <div class="flex flex-wrap items-end gap-3">
        <UButton @click="roll()">
          Lancer le D100
        </UButton>
        <UFormField label="Ou saisir le résultat du dé">
          <div class="flex gap-2">
            <UInputNumber
              v-model="manual"
              :min="1"
              :max="100"
              :increment="false"
              :decrement="false"
              aria-label="Résultat du D100 saisi"
              class="w-28"
            />
            <UButton
              variant="soft"
              :disabled="manual === null"
              @click="manual !== null && roll(manual)"
            >
              Valider
            </UButton>
          </div>
        </UFormField>
      </div>

      <div
        v-if="result"
        class="space-y-2 rounded-md border p-3"
        :class="resultBorder"
      >
        <p class="font-medium">
          {{ result.name }} :
          <span :class="result.check.success ? 'text-success' : 'text-error'">{{ result.check.success ? 'réussi' : 'raté' }}</span>
          <template v-if="result.check.critical">
            , <span class="font-bold">{{ result.check.critical === 'success' ? 'réussite critique' : 'échec critique' }}</span>
          </template>
        </p>
        <p class="text-sm text-muted">
          D100 : {{ result.check.roll }}<template v-if="result.check.swapped">
            lu {{ result.check.value }} ({{ MODE_LABELS[result.check.mode] }})
          </template>
          · cible {{ result.check.target }}
          <template v-if="result.manual">
            · saisi
          </template>
        </p>
        <p
          v-if="criticalText"
          class="text-sm"
        >
          {{ criticalText }}
        </p>
        <div
          v-if="result.effects.length"
          class="space-y-2 rounded-md bg-elevated p-2"
        >
          <p class="text-xs font-medium text-muted">
            Effets chiffrés à appliquer à la fiche
          </p>
          <ul class="space-y-0.5 text-sm">
            <li
              v-for="(effect, index) in result.effects"
              :key="index"
            >
              {{ effectText(effect) }}
            </li>
          </ul>
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              size="sm"
              :disabled="result.applied"
              @click="applyEffects"
            >
              {{ result.applied ? 'Appliqué' : 'Appliquer à la fiche' }}
            </UButton>
            <p
              v-if="result.note"
              class="text-sm text-warning"
            >
              {{ result.note }}
            </p>
          </div>
        </div>
        <p
          v-if="result.fumble"
          class="text-sm"
        >
          <span class="font-medium">Maladresse (D10 : {{ result.fumble }})</span> : {{ $t(`ker_nethalas.fumbles.f${result.fumble}`) }}
        </p>
        <p
          v-if="result.check.critical && result.kind !== 'weapon'"
          class="text-xs text-muted"
        >
          Les effets d'un critique hors combat ne touchent que les personnages joueurs.
        </p>
      </div>

      <div
        v-if="history.length > 1"
        class="space-y-1"
      >
        <p class="text-xs font-medium text-muted">
          Derniers jets (non conservés)
        </p>
        <ul class="space-y-0.5 text-xs text-muted">
          <li
            v-for="(line, index) in history.slice(1)"
            :key="index"
          >
            {{ line }}
          </li>
        </ul>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnResolvedCheck, KnResolvedSheet, KnRollMode } from '~~/shared/ker-nethalas/resolve'
import {
  KN_DIFFICULTIES,
  KN_DIFFICULTY_KEYS,
  knApplyCriticalEffects,
  knCriticalEffects,
  knCriticalKind,
  knD100Check,
  knRollDifficulty,
  knRollFumble,
  type KnCriticalEffect,
  type KnCriticalKind,
  type KnD100Result,
  type KnDifficultyKey,
} from '~~/shared/ker-nethalas/roll'
import { knRaiseUsageDie, knRollDie, knUsageDieRaise } from '~~/shared/ker-nethalas/run'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'

const props = defineProps<{
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const selected = defineModel<string>('selected', { default: `skill:${KN_SKILL_KEYS[0]}` })

const { t } = useI18n()
const { signed } = useKnLabels()

const MODE_LABELS = { normal: 'Normal', advantage: 'Avantage', disadvantage: 'Désavantage', both: 'Av. + Dés.' } as const

interface Choice {
  id: string
  key: string | undefined
  label: string
  check: KnResolvedCheck
}

const choices = computed<Choice[]>(() => [
  ...KN_SKILL_KEYS.map(key => ({ id: `skill:${key}`, key, label: t(`ker_nethalas.skills.${key}`), check: props.resolved.skills[key] })),
  ...character.value.extraSkills.map((extra, index) => ({
    id: `extra:${index}`,
    key: undefined,
    label: extra.name,
    check: props.resolved.extraSkills[index]!,
  })),
  ...KN_RESISTANCE_KEYS.map(key => ({ id: `resistance:${key}`, key, label: t(`ker_nethalas.resistances.${key}`), check: props.resolved.resistances[key] })),
])

const current = computed(() => choices.value.find(choice => choice.id === selected.value) ?? choices.value[0]!)
const checkItems = computed<SelectItem[]>(() => choices.value.map(choice => ({ label: choice.label, value: choice.id })))

function select(value: unknown) {
  if (typeof value === 'string') selected.value = value
}

const difficulty = ref<KnDifficultyKey>('normal')
const difficultyModifier = computed(() => KN_DIFFICULTIES[difficulty.value])
const difficultyItems = computed<SelectItem[]>(() =>
  KN_DIFFICULTY_KEYS.map(key => ({ label: `${t(`ker_nethalas.difficulties.${key}`)} (${signed(KN_DIFFICULTIES[key])})`, value: key })),
)

type ModeChoice = 'auto' | Exclude<KnRollMode, 'both'>
const modeChoice = ref<ModeChoice>('auto')
const modeItems: SelectItem[] = [
  { label: 'Selon la fiche', value: 'auto' },
  { label: 'Normal', value: 'normal' },
  { label: 'Avantage', value: 'advantage' },
  { label: 'Désavantage', value: 'disadvantage' },
]
const mode = computed<KnRollMode>(() => modeChoice.value === 'auto' ? current.value.check.rollMode : modeChoice.value)

const target = computed(() => Math.max(0, current.value.check.effective + difficultyModifier.value))

const manual = ref<number | null>(null)

interface RollOutcome {
  name: string
  kind: KnCriticalKind
  criticalKey: string | undefined
  check: KnD100Result
  fumble: number | undefined
  manual: boolean
  effects: KnCriticalEffect[]
  applied: boolean
  note?: string
}

const result = ref<RollOutcome | null>(null)
const history = ref<string[]>([])
const HISTORY_SIZE = 6

function roll(entered?: number) {
  const choice = current.value
  const check = knD100Check({
    roll: entered ?? knRollDie(100),
    score: choice.check.effective,
    difficulty: difficultyModifier.value,
    mode: mode.value,
  })
  const kind = knCriticalKind(choice.key)
  result.value = {
    name: choice.label,
    kind,
    criticalKey: kind === 'weapon' ? 'weapon' : choice.key,
    check,
    fumble: check.critical === 'failure' && kind === 'weapon' ? knRollFumble() : undefined,
    manual: entered !== undefined,
    effects: check.critical && kind === 'table' ? knCriticalEffects(choice.key, check.critical) : [],
    applied: false,
  }

  const outcome = `${check.success ? 'réussi' : 'raté'}${check.critical ? (check.critical === 'success' ? ' (critique)' : ' (échec critique)') : ''}`
  history.value = [`${choice.label} : ${check.value} pour ${check.target}, ${outcome}`, ...history.value].slice(0, HISTORY_SIZE)
}

const EFFECT_LABELS = { exhaustion: 'Épuisement', health: 'Santé', toughness: 'Robustesse', sanity: 'Santé mentale' } as const

function effectText(effect: KnCriticalEffect) {
  if (effect.type === 'usageDieUp') {
    const raise = knUsageDieRaise(character.value.run)
    if (!raise) return 'Aucun dé de Lair ou de Sortie à augmenter'
    return `Dé de ${raise.which === 'lair' ? 'Lair' : 'Sortie'} : D${raise.from} → D${raise.to}`
  }
  if (effect.type === 'damage') return `${effect.amount} dégâts contondants (${effect.dice}), retirés à la Robustesse puis à la Santé`
  return `${EFFECT_LABELS[effect.type]} ${signed(effect.amount)}${effect.dice ? ` (${effect.dice})` : ''}`
}

function applyEffects() {
  const outcome = result.value
  if (!outcome || outcome.applied) return
  const c = character.value
  const next = knApplyCriticalEffects(outcome.effects, {
    toughness: c.toughnessCurrent,
    toughnessMax: props.resolved.maxVitals.toughness.effective,
    health: c.healthCurrent,
    healthMax: props.resolved.maxVitals.health.effective,
    sanity: c.sanityCurrent,
    sanityMax: props.resolved.maxVitals.sanity.effective,
    exhaustion: c.exhaustion,
    exhaustionMax: KN_BOUNDS.exhaustion.max,
  })
  c.toughnessCurrent = next.toughness
  c.healthCurrent = next.health
  c.sanityCurrent = next.sanity
  c.exhaustion = next.exhaustion
  if (outcome.effects.some(effect => effect.type === 'usageDieUp')) c.run = knRaiseUsageDie(c.run)

  outcome.applied = true
  outcome.note = next.health === 0 ? 'La Santé tombe à 0 : le survivant meurt.' : undefined
}

const criticalText = computed(() => {
  const outcome = result.value
  if (!outcome?.check.critical || !outcome.criticalKey) return undefined
  return t(`ker_nethalas.criticals.${outcome.criticalKey}.${outcome.check.critical === 'success' ? 'success' : 'failure'}`)
})

const resultBorder = computed(() => {
  const critical = result.value?.check.critical
  if (critical === 'success') return 'border-success'
  if (critical === 'failure') return 'border-error'
  return 'border-default'
})
</script>
