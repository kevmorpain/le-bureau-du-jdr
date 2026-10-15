<template>
  <UCard v-if="!visit">
    <template #header>
      <KnCardHeader title="Pièce" />
    </template>
    <p class="text-sm text-muted">
      Aucune entrée dans ce Domaine : lancez « Nouvelle entrée » dans la colonne Donjon.
    </p>
  </UCard>

  <KnVisitBlock
    v-else
    :visit
    :position="index + 1"
    :active="index === domain.visits.length - 1"
    :tension-die="run.tensionDie"
    :lair-die="domain.lairDie"
    :exit-die="domain.exitDie"
    :lockpicks="character.provisions.lockpicks"
    :level="character.level"
    :in-combat="!!run.combat"
    :bestiary
    :tables
    :intro="!!domain.intro"
    :trader-found="!!domain.traderFound"
    @tension="tension"
    @usage="usage"
    @draw="drawDarkness"
    @undo="undo"
    @table="tableRoll"
    @trader="here => character.run = knSetTrader(character.run, here)"
    @adjust-scavenge="adjustScavenge"
    @apply-scavenge="applyScavenge"
    @add-door="addDoor"
    @deep-search="deepSearch"
    @deep-search-content="deepSearchContent"
    @perception="perception"
    @obstacle-roll="obstacleRoll"
    @noise="noise"
    @extra-draw="extraDraw"
    @take="takeOutcome"
    @add-room-trap="addRoomTrap"
    @obstacle-act="obstacleAct"
    @draw-creature="drawCreature"
    @engage="creature => engageAndShow(creature)"
  />
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import {
  knCurrentDomain,
  knDrawGrowingDarkness,
  knRecordDarkness,
  knRecordTension,
  knRecordUsage,
  knRollDie,
  knSetTrader,
  knUndoLastVisit,
} from '~~/shared/ker-nethalas/run'
import type { KnExplorationTableName, KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  resolved: KnResolvedSheet
  tables: Partial<Record<KnExplorationTableName, KnRollTable | null>>
  bestiary: KnCreature[] | null
  selected: number | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })

const {
  tableRoll,
  adjustScavenge,
  applyScavenge,
  takeOutcome,
  addDoor,
  addRoomTrap,
  deepSearch,
  deepSearchContent,
  perception,
  obstacleRoll,
  noise,
  extraDraw,
  obstacleAct,
  drawCreature,
} = useKnExploration(character, () => props.resolved, () => props.tables)

const { engage } = useKnCombat(character, () => props.resolved, () => props.bestiary)

const run = computed(() => character.value.run)
const domain = computed(() => knCurrentDomain(character.value.run))
const index = computed(() => Math.min(props.selected ?? domain.value.visits.length - 1, domain.value.visits.length - 1))
const visit = computed(() => domain.value.visits[index.value])

// La carte de combat est dans cette colonne, plus bas : on y emmène le joueur.
async function engageAndShow(creature: KnCreature) {
  engage(creature)
  await nextTick()
  document.getElementById('kn-combat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Saisie manuelle : le bloc passe 1 ou 3, tirage automatique sinon.
function tension(manual?: number) {
  const roll = manual ?? knRollDie(character.value.run.tensionDie)
  character.value.run = knRecordTension(character.value.run, roll, manual !== undefined)
}

function usage(manual?: number) {
  const current = domain.value
  const last = current.visits.at(-1)
  if (!last?.usageKind) return
  const roll = manual ?? knRollDie(last.usageKind === 'lair' ? current.lairDie : current.exitDie)
  character.value.run = knRecordUsage(character.value.run, roll, manual !== undefined)
}

function drawDarkness() {
  character.value.run = knRecordDarkness(character.value.run, knDrawGrowingDarkness())
}

function undo() {
  character.value.run = knUndoLastVisit(character.value.run)
}
</script>
