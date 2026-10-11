<template>
  <div class="space-y-2 rounded-md border border-default p-2">
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-medium">{{ KIND_LABELS[obstacle.kind] }}{{ obstacle.kind === 'room' ? '' : ` n° ${position}` }}</span>
      <UBadge
        v-if="state.trapped === true"
        :label="trapBadge"
        color="warning"
        variant="subtle"
        size="md"
      />
      <UBadge
        v-else-if="state.trapped === false"
        label="Pas de piège"
        color="neutral"
        variant="subtle"
        size="md"
      />
      <UBadge
        v-if="state.locked !== undefined"
        :label="obstacle.lockOpen ? 'Verrou ouvert' : state.locked ? 'Verrouillé' : 'Pas verrouillé'"
        :color="state.locked && !obstacle.lockOpen ? 'warning' : 'neutral'"
        variant="subtle"
        size="md"
      />
    </div>

    <ul class="space-y-2 text-sm">
      <li class="flex flex-wrap items-center gap-2">
        <UIcon
          :name="obstacle.perception ? 'i-heroicons:check-circle' : 'i-heroicons:minus-circle'"
          class="size-5"
          :class="obstacle.perception ? 'text-success' : 'text-muted'"
        />
        <span class="flex-1">
          Test de Perception (difficulté aléatoire)
          <template v-if="obstacle.perception">
            · {{ obstacle.perception === 'passed' ? 'réussi' : 'raté' }}
          </template>
          <span
            v-else-if="!active"
            class="text-muted"
          >· non fait</span>
        </span>
        <div
          v-if="active && !obstacle.perception"
          class="flex flex-wrap gap-1"
        >
          <UButton
            size="sm"
            variant="outline"
            icon="i-heroicons:cube"
            @click="openCheck('perception', { id: 'skill:perception', difficulty: knRollDifficulty(), note: PERCEPTION_NOTES[obstacle.kind] })"
          >
            Tester
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('perception', true, 'soft')"
            @click="perceive('passed')"
          >
            Réussi
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('perception', false, 'outline')"
            @click="perceive('failed')"
          >
            Raté
          </UButton>
        </div>
      </li>

      <KnTableRoll
        v-if="obstacle.perception && obstacle.kind !== 'room'"
        :label="obstacle.perception === 'passed' ? 'Piégé ? (D10, 7 ou plus : le piège est repéré)' : 'Piégé ? (D10, 7 ou plus : il se déclenche si vous interagissez)'"
        :die="KN_TRAP_DIE"
        :roll="obstacle.trap?.roll"
        plain
        :active
        @roll="manual => emit('trap', manual)"
      />

      <KnTableRoll
        v-if="state.trapped && obstacle.perception"
        label="Type de piège"
        :die="KN_TRAP_DIE"
        :roll="obstacle.trapType?.roll"
        :table="traps"
        :active
        @roll="manual => emit('trapType', manual)"
      >
        <template #result>
          <p
            v-if="avoidSkill"
            class="text-sm font-medium"
          >
            Test pour l'éviter : {{ skillLabel(avoidSkill) }}{{ state.spotted ? ' (+20, piège repéré)' : '' }}
          </p>
        </template>
      </KnTableRoll>

      <li
        v-if="active && obstacle.trapType && obstacle.trapState === undefined && state.spotted"
        class="space-y-2 rounded-md bg-elevated p-2"
      >
        <p class="font-medium">
          Piège repéré : que faire ?
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <span class="flex-1">Le désamorcer (Larcin, Outils de voleur, difficulté aléatoire ; un échec le déclenche)</span>
          <UButton
            size="sm"
            variant="outline"
            icon="i-heroicons:cube"
            @click="openCheck('disarm', { id: 'skill:thievery', difficulty: knRollDifficulty(), note: 'Désamorcer le piège' })"
          >
            Tester
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('disarm', true, 'soft')"
            @click="act('disarmed')"
          >
            Réussi
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('disarm', false, 'outline')"
            @click="act('disarmFailed')"
          >
            Raté
          </UButton>
        </div>
        <div
          v-if="obstacle.kind === 'room'"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="flex-1">Le contourner (test d'évitement, +20 ; un échec le déclenche)</span>
          <UButton
            size="sm"
            variant="outline"
            icon="i-heroicons:cube"
            @click="avoidCheck('bypass', 'Contourner le piège')"
          >
            Tester
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('bypass', true, 'soft')"
            @click="act('bypassed')"
          >
            Réussi
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('bypass', false, 'outline')"
            @click="act('bypassFailed')"
          >
            Raté
          </UButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="flex-1">Le déclencher exprès (test d'évitement, +20)</span>
          <UButton
            size="sm"
            variant="outline"
            color="warning"
            @click="act('trigger')"
          >
            Déclencher
          </UButton>
        </div>
      </li>

      <li
        v-if="obstacle.trapType && obstacle.trapState === 'triggering'"
        class="space-y-2 rounded-md border border-warning p-2"
      >
        <p class="font-medium">
          Le piège se déclenche : test d'évitement{{ avoidSkill ? ` (${skillLabel(avoidSkill)}${state.spotted ? ', +20' : ''})` : '' }}
        </p>
        <div
          v-if="active"
          class="flex flex-wrap items-center gap-2"
        >
          <UButton
            v-if="avoidSkill"
            size="sm"
            variant="outline"
            icon="i-heroicons:cube"
            @click="avoidCheck('avoid', 'Éviter le piège')"
          >
            Tester
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('avoid', true, 'soft')"
            @click="act('avoided')"
          >
            Évité : aucune conséquence
          </UButton>
          <UButton
            size="sm"
            color="error"
            :variant="suggest('avoid', false, 'outline')"
            @click="act('suffered')"
          >
            Subi : appliquer {{ failureEffects || 'les conséquences' }}
          </UButton>
        </div>
      </li>

      <li
        v-else-if="obstacle.trapState && obstacle.trapType"
        class="text-muted"
      >
        {{ TRAP_STATE_TEXTS[obstacle.trapState] }}
      </li>

      <KnTableRoll
        v-if="obstacle.perception && obstacle.kind !== 'room'"
        :label="`Verrouillé ? (D20, ${lockThreshold} ou plus)`"
        :die="KN_LOCK_DIE"
        :roll="obstacle.lock?.roll"
        plain
        :active
        @roll="manual => emit('lock', manual)"
      />

      <li
        v-if="active && state.canWorkLock"
        class="space-y-2 rounded-md bg-elevated p-2"
      >
        <p class="font-medium">
          Verrou : l'ouvrir
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <span class="flex-1">
            Le crocheter (Larcin, un Crochet ; {{ pickText }})
          </span>
          <UButton
            size="sm"
            variant="outline"
            icon="i-heroicons:cube"
            :disabled="lockpicks <= 0"
            @click="pickCheck"
          >
            Tester
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('pick', true, 'soft')"
            :disabled="!obstacle.pick"
            @click="act('pickOpened')"
          >
            Ouvert
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('pick', false, 'outline')"
            :disabled="!obstacle.pick"
            @click="act('pickFailed')"
          >
            Raté : Crochet brisé
          </UButton>
        </div>
        <p
          v-if="lockpicks <= 0"
          class="text-xs text-warning"
        >
          Aucun Crochet dans les provisions.
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <span class="flex-1">
            Le forcer (Athlétisme{{ forceBonus ? `, +${forceBonus} après ${obstacle.forced} échec${(obstacle.forced ?? 0) > 1 ? 's' : ''}` : '' }} ; chaque tentative fait du bruit : un test de Dé de Tension)
          </span>
          <UButton
            size="sm"
            variant="outline"
            icon="i-heroicons:cube"
            @click="openCheck('force', { id: 'skill:athletics', difficulty: 'normal', bonus: forceBonus, note: forceBonus ? `Forcer le verrou, +${forceBonus} après les échecs` : 'Forcer le verrou' })"
          >
            Tester
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('force', true, 'soft')"
            @click="act('forceOpened')"
          >
            Ouvert
          </UButton>
          <UButton
            size="sm"
            :variant="suggest('force', false, 'outline')"
            @click="act('forceFailed')"
          >
            Raté
          </UButton>
        </div>
      </li>

      <li v-if="active && check">
        <KnInlineCheck
          :key="`${check.purpose}-${check.request.difficulty}-${check.request.bonus ?? 0}`"
          :request="check.request"
          @rolled="success => result = { purpose: check!.purpose, success }"
          @close="check = null"
        />
      </li>
    </ul>

    <details
      v-if="active"
      class="text-sm"
    >
      <summary class="cursor-pointer text-muted">
        Vacarme supplémentaire
      </summary>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span class="flex-1">Test de Dé de Tension à ajouter à la main (D{{ tensionDie }})</span>
        <KnDieActions
          @roll="emit('noise')"
          @low="emit('noise', LOW)"
          @high="emit('noise', HIGH)"
        />
      </div>
    </details>
  </div>
</template>

<script lang="ts" setup>
import { KN_LOCK_DIE, KN_LOCK_THRESHOLD, KN_TRAP_DIE, type KnObstacleAct } from '~~/shared/ker-nethalas/exploration'
import { knEasierDifficulty, knRollDifficulty, type KnRollRequest } from '~~/shared/ker-nethalas/roll'
import { KN_RESISTANCE_KEYS } from '~~/shared/ker-nethalas/skills'
import { knForceBonus, knObstacleState, type KnObstacle } from '~~/shared/ker-nethalas/run'
import { knCheckId, knTableEntry, type KnCheckKey, type KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  obstacle: KnObstacle
  position: number
  active?: boolean
  traps?: KnRollTable | null
  tensionDie: number
  lockpicks: number
}>()

const emit = defineEmits<{
  perception: [result: 'passed' | 'failed']
  trap: [manual?: number]
  trapType: [manual?: number]
  lock: [manual?: number]
  noise: [manual?: number]
  act: [action: KnObstacleAct]
}>()

type Purpose = 'perception' | 'disarm' | 'bypass' | 'avoid' | 'pick' | 'force'

// Le test ouvert dans le bloc et son résultat : le bouton « réussi » ou « raté » qui y correspond est mis en avant.
const check = ref<{ purpose: Purpose, request: KnRollRequest } | null>(null)
const result = ref<{ purpose: Purpose, success: boolean } | null>(null)

function openCheck(purpose: Purpose, request: KnRollRequest) {
  if (check.value?.purpose === purpose) {
    check.value = null
    return
  }
  check.value = { purpose, request }
  result.value = null
}

const suggest = (purpose: Purpose, success: boolean, fallback: 'soft' | 'outline') =>
  result.value?.purpose === purpose && result.value.success === success ? 'solid' : fallback

function settle() {
  check.value = null
  result.value = null
}

function act(action: KnObstacleAct) {
  settle()
  emit('act', action)
}

function perceive(perception: 'passed' | 'failed') {
  settle()
  emit('perception', perception)
}

const { t } = useI18n()
const { effectsText } = useKnEffectText()

// Résultat saisi à la main : 1-2 et 3+ valent 1 et 3, les seuls cas que le Dé de Tension distingue.
const LOW = 1
const HIGH = 3

const KIND_LABELS = { door: 'Porte', container: 'Contenant', room: 'Piège de la pièce' }
const PERCEPTION_NOTES = { door: 'Chercher un piège sur la porte', container: 'Chercher un piège sur le contenant', room: 'Chercher le piège de la pièce' }
const TRAP_STATE_TEXTS = {
  disarmed: 'Piège désamorcé.',
  bypassed: 'Piège contourné : on peut repartir librement, sans fouiller ni toucher à autre chose que les portes.',
  triggering: '',
  avoided: 'Piège déclenché, évité : aucune conséquence.',
  suffered: 'Piège déclenché, subi : conséquences appliquées.',
}

const state = computed(() => knObstacleState(props.obstacle))
const lockThreshold = computed(() => props.obstacle.kind === 'room' ? 0 : KN_LOCK_THRESHOLD[props.obstacle.kind])
const trapEntry = computed(() => props.obstacle.trapType ? knTableEntry(props.traps ?? null, props.obstacle.trapType.roll) : undefined)
const avoidSkill = computed<KnCheckKey | undefined>(() => trapEntry.value?.checks?.[0]?.skill)
const failureEffects = computed(() => {
  const outcomes = (trapEntry.value?.outcomes ?? []).filter(outcome => outcome.when === 'failure')
  return effectsText(outcomes.flatMap(outcome => outcome.effects))
})
const forceBonus = computed(() => knForceBonus(props.obstacle))
const skillLabel = (key: KnCheckKey) => t(`ker_nethalas.${(KN_RESISTANCE_KEYS as readonly string[]).includes(key) ? 'resistances' : 'skills'}.${key}`)

const trapBadge = computed(() => {
  const { trapState } = props.obstacle
  if (trapState === 'disarmed') return 'Piège désamorcé'
  if (trapState === 'bypassed') return 'Piège contourné'
  if (trapState === 'triggering') return 'Piège déclenché'
  if (trapState === 'avoided' || trapState === 'suffered') return 'Piège déclenché, réglé'
  return state.value.spotted ? 'Piège repéré' : 'Piégé, non repéré'
})

const pickDifficulty = computed(() => props.obstacle.pick ? knEasierDifficulty(props.obstacle.pick.difficulty, props.obstacle.pick.failures) : undefined)
const pickText = computed(() => {
  if (!pickDifficulty.value) return 'difficulté tirée au premier essai'
  const failures = props.obstacle.pick!.failures
  return `difficulté ${t(`ker_nethalas.difficulties.${pickDifficulty.value}`)}${failures ? `, un cran plus bas après ${failures} Crochet${failures > 1 ? 's' : ''} brisé${failures > 1 ? 's' : ''}` : ''}`
})

// Test d'évitement du piège : +20 si on l'a repéré, que ce soit pour le contourner, le déclencher ou l'éviter.
function avoidCheck(purpose: Purpose, note: string) {
  if (!avoidSkill.value) return
  openCheck(purpose, { id: knCheckId(avoidSkill.value), difficulty: 'normal', bonus: state.value.spotted ? 20 : 0, note })
}

function pickCheck() {
  if (check.value?.purpose === 'pick') {
    check.value = null
    return
  }
  const difficulty = pickDifficulty.value ?? knRollDifficulty()
  if (!props.obstacle.pick) emit('act', `startPick:${difficulty}`)
  openCheck('pick', { id: 'skill:thievery', difficulty, note: 'Crocheter le verrou' })
}
</script>
