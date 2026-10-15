<template>
  <UCard v-if="!blocks.length">
    <template #header>
      <KnCardHeader title="Pièce" />
    </template>
    <p class="text-sm text-muted">
      Aucune entrée dans ce Domaine : lancez « Nouvelle entrée » dans la colonne Donjon.
    </p>
  </UCard>

  <template v-else>
    <KnVisitBlock
      v-for="block in blocks"
      :key="block.index"
      :visit="block.visit"
      :position="block.index + 1"
      :active="block.active"
      :retracing="block.retracing"
      :return-to="block.returnTo"
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
      @resume="resume"
    />
  </template>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import {
  knCurrentDomain,
  knDrawGrowingDarkness,
  knLocationIndex,
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
const { resume } = useKnFlee(character, () => props.resolved, () => props.bestiary)

const run = computed(() => character.value.run)
const domain = computed(() => knCurrentDomain(character.value.run))

// Ce qui s'affiche : l'entrée choisie ; en suivant la dernière, le retour puis la pièce où il ramène, car c'est elle qu'on joue.
const blocks = computed(() => {
  const visits = domain.value.visits
  const last = visits.length - 1
  const location = knLocationIndex(domain.value)
  const retracing = location !== last
  const shown = props.selected === null ? (retracing ? [last, location] : [last]) : [Math.min(props.selected, last)]
  return shown.flatMap((index) => {
    const visit = visits[index]
    if (!visit) return []
    const target = visit.kind === 'revisit' && visit.of !== undefined ? visits.findIndex(entry => entry.id === visit.of) : -1
    const targeted = target >= 0 ? visits[target] : undefined
    return [{
      index,
      visit,
      active: index === last || index === location,
      retracing: retracing && index === location,
      returnTo: targeted && targeted.kind !== 'revisit' ? { position: target + 1, kind: targeted.kind } : undefined,
    }]
  })
})

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
