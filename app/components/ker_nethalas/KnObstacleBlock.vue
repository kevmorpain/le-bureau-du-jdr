<template>
  <div class="space-y-2 rounded-md border border-default p-2">
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-medium">{{ kind === 'door' ? 'Porte' : 'Contenant' }} n° {{ position }}</span>
      <UBadge
        v-if="state.trapped === true"
        :label="state.spotted ? 'Piège repéré' : 'Piégé, non repéré'"
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
        :label="state.locked ? 'Verrouillé' : 'Pas verrouillé'"
        :color="state.locked ? 'warning' : 'neutral'"
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
          class="flex gap-1"
        >
          <UButton
            size="sm"
            variant="soft"
            @click="emit('perception', 'passed')"
          >
            Réussi
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            @click="emit('perception', 'failed')"
          >
            Raté
          </UButton>
        </div>
      </li>

      <KnTableRoll
        v-if="obstacle.perception"
        :label="obstacle.perception === 'passed' ? 'Piégé ? (D10, 7 ou plus : le piège est repéré)' : 'Piégé ? (D10, 7 ou plus : il se déclenche si vous interagissez)'"
        :die="KN_TRAP_DIE"
        :roll="obstacle.trap?.roll"
        plain
        :active
        @roll="manual => emit('trap', manual)"
      />

      <KnTableRoll
        v-if="state.trapped"
        label="Type de piège"
        :die="KN_TRAP_DIE"
        :roll="obstacle.trapType?.roll"
        :table="traps"
        :active
        @roll="manual => emit('trapType', manual)"
      >
        <template #result>
          <p
            v-if="trapEntry?.skill"
            class="text-sm font-medium"
          >
            Test pour l'éviter : {{ $t(`ker_nethalas.skills.${trapEntry.skill}`) }}{{ state.spotted ? ' (+20, piège repéré)' : '' }}
          </p>
        </template>
      </KnTableRoll>

      <KnTableRoll
        v-if="obstacle.perception"
        :label="`Verrouillé ? (D20, ${lockThreshold} ou plus)`"
        :die="KN_LOCK_DIE"
        :roll="obstacle.lock?.roll"
        plain
        :active
        @roll="manual => emit('lock', manual)"
      />
    </ul>

    <details class="text-sm">
      <summary class="cursor-pointer text-muted">
        Résolution (rappel des règles)
      </summary>
      <ul class="mt-1 list-disc space-y-1 pl-5">
        <li>
          Piège repéré : le désamorcer (Larcin avec des Outils de voleur, difficulté aléatoire ; un échec le déclenche), le contourner
          s'il est dans la pièce (test d'évitement du piège, +20 ; une fois réussi, on peut repartir librement mais on ne fouille
          ni ne touche rien d'autre que les portes), ou le déclencher exprès (test d'évitement, +20 ; un échec en subit les effets).
        </li>
        <li>
          Piège déclenché sans l'avoir repéré : test d'évitement sans bonus. Repéré puis déclenché malgré tout : test
          d'évitement à +20. Une réussite annule toutes les conséquences, et un piège ne se déclenche qu'une fois.
        </li>
        <li>
          Verrou : le crocheter (Larcin avec un Crochet, difficulté aléatoire ; un échec brise le Crochet, on peut recommencer une
          difficulté plus bas) ou le forcer (Athlétisme, +20 à chaque tentative après la première). Chaque tentative de forcer fait un
          vacarme : test de Dé de Tension.
        </li>
      </ul>
      <div
        v-if="active"
        class="mt-2 flex flex-wrap items-center gap-2"
      >
        <span class="flex-1">Vacarme d'une tentative : Dé de Tension (D{{ tensionDie }})</span>
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
import { KN_LOCK_DIE, KN_LOCK_THRESHOLD, KN_TRAP_DIE } from '~~/shared/ker-nethalas/exploration'
import { knObstacleState, type KnObstacle } from '~~/shared/ker-nethalas/run'
import { knTableEntry, type KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  obstacle: KnObstacle
  position: number
  active?: boolean
  traps?: KnRollTable | null
  tensionDie: number
}>()

const emit = defineEmits<{
  perception: [result: 'passed' | 'failed']
  trap: [manual?: number]
  trapType: [manual?: number]
  lock: [manual?: number]
  noise: [manual?: number]
}>()

// Résultat saisi à la main : 1-2 et 3+ valent 1 et 3, les seuls cas que le Dé de Tension distingue.
const LOW = 1
const HIGH = 3

const kind = computed(() => props.obstacle.kind)
const state = computed(() => knObstacleState(props.obstacle))
const lockThreshold = computed(() => KN_LOCK_THRESHOLD[props.obstacle.kind])
const trapEntry = computed(() => props.obstacle.trapType ? knTableEntry(props.traps ?? null, props.obstacle.trapType.roll) : undefined)
</script>
