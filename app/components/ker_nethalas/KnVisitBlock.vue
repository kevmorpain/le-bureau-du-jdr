<template>
  <div
    class="space-y-2 rounded-md border p-3"
    :class="active ? 'border-primary' : 'border-default'"
  >
    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        :label="KIND_LABELS[visit.kind]"
        :color="active ? 'primary' : 'neutral'"
        variant="subtle"
        size="md"
      />
      <span class="text-sm text-muted">n° {{ position }}</span>
      <span
        v-if="returnTo"
        class="text-sm text-muted"
      >· dans {{ returnTo.kind === 'corridor' ? 'le couloir' : 'la salle' }} n° {{ returnTo.position }}</span>
      <UBadge
        v-if="retracing"
        label="De retour ici"
        color="info"
        variant="subtle"
        size="md"
      />
      <UBadge
        v-if="foundLair"
        label="Lair de l'Overseer"
        color="warning"
        variant="subtle"
        size="md"
      />
      <UBadge
        v-if="visit.usageKind === 'exit' && visit.usage?.triggered"
        label="Sortie du Domaine"
        color="success"
        variant="subtle"
        size="md"
      />
      <UButton
        v-if="active && !retracing"
        class="ml-auto"
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-heroicons:arrow-uturn-left"
        @click="emit('undo')"
      >
        Annuler cette entrée
      </UButton>
    </div>

    <div
      v-if="active && entryPending"
      class="flex flex-wrap items-center gap-3 rounded-md bg-elevated p-2"
    >
      <UButton
        icon="i-heroicons:cube"
        @click="emit('rollEntry')"
      >
        Lancer les dés d'entrée
      </UButton>
      <UButton
        size="xs"
        variant="link"
        color="neutral"
        :aria-expanded="manual"
        @click="manual = !manual"
      >
        {{ manual ? 'Masquer la saisie' : 'Saisir mes propres dés' }}
      </UButton>
    </div>

    <ul class="space-y-2 text-sm">
      <li
        v-if="visit.shape"
        class="flex flex-wrap items-center gap-2"
      >
        <UIcon
          name="i-heroicons:check-circle"
          class="size-5 text-success"
        />
        <span class="flex-1">
          Forme : D100 → {{ visit.shape.roll }}, {{ visit.kind === 'corridor' ? 'un couloir' : 'une salle' }}
        </span>
      </li>

      <KnTableRoll
        v-if="descriptionTable"
        :label="visit.kind === 'corridor' ? 'Description du couloir (décor)' : 'Description de la salle (décor)'"
        :die="descriptionTable.die"
        :roll="visit.description?.roll"
        :table="descriptionTable.table"
        :active="active && !retracing"
        @roll="manual => emit('table', 'description', manual)"
      />

      <li class="flex flex-wrap items-center gap-2">
        <UIcon
          :name="visit.tension ? 'i-heroicons:check-circle' : 'i-heroicons:minus-circle'"
          class="size-5"
          :class="visit.tension ? 'text-success' : 'text-muted'"
        />
        <template v-if="visit.tension">
          <span class="flex-1">
            Dé de Tension : {{ dieHead(visit.tension) }} ·
            <span :class="outcome(visit.tension, 'tension').class">{{ outcome(visit.tension, 'tension').text }}</span>
          </span>
        </template>
        <span
          v-else-if="!active || retracing || !manual"
          class="flex-1 text-muted"
        >
          Dé de Tension : non lancé
        </span>
        <template v-else>
          <span class="flex-1">Dé de Tension (D{{ tensionDie }})</span>
          <KnDieActions
            @roll="emit('tension')"
            @low="emit('tension', LOW)"
            @high="emit('tension', HIGH)"
          />
        </template>
      </li>

      <li
        v-if="visit.usageKind"
        class="flex flex-wrap items-center gap-2"
      >
        <UIcon
          :name="visit.usage ? 'i-heroicons:check-circle' : 'i-heroicons:minus-circle'"
          class="size-5"
          :class="visit.usage ? 'text-success' : 'text-muted'"
        />
        <template v-if="visit.usage">
          <span class="flex-1">
            Dé de {{ USAGE_NAMES[visit.usageKind] }} : {{ dieHead(visit.usage) }} ·
            <span :class="outcome(visit.usage, visit.usageKind).class">{{ outcome(visit.usage, visit.usageKind).text }}</span>
          </span>
        </template>
        <span
          v-else-if="!active || retracing || !manual"
          class="flex-1 text-muted"
        >
          Dé de {{ USAGE_NAMES[visit.usageKind] }} : non lancé
        </span>
        <template v-else>
          <span class="flex-1">Dé de {{ USAGE_NAMES[visit.usageKind] }} (D{{ visit.usageKind === 'lair' ? lairDie : exitDie }})</span>
          <KnDieActions
            @roll="emit('usage')"
            @low="emit('usage', LOW)"
            @high="emit('usage', HIGH)"
          />
        </template>
      </li>

      <li
        v-if="visit.darkness"
        class="flex items-start gap-2"
      >
        <UIcon
          name="i-heroicons:exclamation-triangle"
          class="mt-0.5 size-5 shrink-0 text-warning"
        />
        <span>
          Obscurité Grandissante {{ visit.darkness.roll }} : {{ darknessText(visit.darkness) }}
          <template v-if="visit.darkness.influence">
            Influence tirée ({{ visit.darkness.influence.roll }}) : {{ $t(`ker_nethalas.overseer.${visit.darkness.influence.key}`) }}.
          </template>
        </span>
      </li>
    </ul>

    <p
      v-if="restText"
      class="text-sm text-muted"
    >
      Repos pris ici : {{ restText }}.
    </p>

    <div
      v-if="visit.fled"
      class="flex flex-wrap items-center gap-3 rounded-md border border-error p-3"
    >
      <p class="flex-1 text-sm">
        Un combat a été fui ici : {{ visit.fled.creatures.map(creature => creature.name).join(', ') }} {{ visit.fled.creatures.length > 1 ? 'attendent' : 'attend' }},
        la Santé remise à fond.
      </p>
      <UButton
        v-if="active && !inCombat"
        color="error"
        @click="emit('resume')"
      >
        Reprendre le combat
      </UButton>
    </div>

    <div
      v-if="active && !retracing && pending.darkness"
      class="flex flex-wrap items-center gap-3 rounded-md border border-warning p-3"
    >
      <p class="flex-1 text-sm">
        Le Dé de Tension s'est déclenché : un événement de l'Obscurité Grandissante est à tirer.
      </p>
      <UButton
        color="warning"
        @click="emit('draw')"
      >
        Tirer l'événement
      </UButton>
    </div>

    <ul class="space-y-2 text-sm">
      <li
        v-if="encounterLocked"
        class="text-muted"
      >
        {{ encounterText }}
      </li>

      <KnTableRoll
        v-else
        :label="encounterText"
        :die="KN_ENCOUNTER_DIE"
        :roll="visit.encounter?.roll"
        plain
        :active="active && !retracing && manual"
        @roll="manual => emit('table', 'encounter', manual)"
      >
        <template #result>
          <p
            class="text-sm"
            :class="visit.encounter?.triggered ? 'font-bold text-error' : 'text-muted'"
          >
            {{ visit.encounter?.triggered ? 'Rencontre de combat : tirez dans la table des Rencontres.' : 'Pas de rencontre de combat.' }}
          </p>
        </template>
      </KnTableRoll>

      <KnTableRoll
        v-if="eventTable && (visit.encounter?.triggered === false || visit.event)"
        label="Événement"
        :die="eventTable.die"
        :roll="visit.event?.roll"
        :table="eventTable.table"
        :active="active && !retracing && manual"
        @roll="manual => emit('table', 'event', manual)"
      >
        <template #result>
          <div class="mt-1 space-y-2">
            <UButton
              v-if="active && eventEntry?.roomTrap && !visit.obstacles?.some(obstacle => obstacle.kind === 'room')"
              size="xs"
              variant="soft"
              @click="emit('addRoomTrap')"
            >
              Vérifier le piège
            </UButton>
            <KnOutcomePanel
              :entry="eventEntry"
              :taken="visit.event?.taken ?? []"
              :active
              event
              @take="index => emit('take', 'event', index)"
            />
          </div>
        </template>
      </KnTableRoll>
      <li
        v-else-if="visit.noEvent && visit.kind === 'room' && !visit.noEncounter"
        class="text-muted"
      >
        Pas d'événement dans cette salle du Domaine d'introduction, même sans rencontre de combat.
      </li>
      <li
        v-else-if="visit.kind === 'room' && !foundLair && !visit.encounter && active && !retracing"
        class="text-muted"
      >
        Sans rencontre de combat, un événement se tire dans la table des Événements.
      </li>

      <KnTableRoll
        v-if="visit.kind !== 'revisit' && !intro"
        label="Porte ?"
        :die="KN_DOOR_DIE"
        :roll="visit.door?.roll"
        plain
        :active="active && manual"
        @roll="manual => emit('table', 'door', manual)"
      >
        <template #result>
          <p class="text-sm">
            {{ visit.door?.present ? 'Oui : verrous et pièges à vérifier (livre, p. 117).' : 'Non.' }}
          </p>
        </template>
      </KnTableRoll>

      <li
        v-if="visit.kind !== 'revisit' && active && !visit.scavenge"
        class="space-y-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UIcon
            name="i-heroicons:minus-circle"
            class="size-5 text-muted"
          />
          <span class="flex-1">Test de Fouille (une fois par salle ou couloir)</span>
          <UButton
            size="sm"
            :variant="scavengeCheckOpen ? 'solid' : 'outline'"
            icon="i-heroicons:cube"
            @click="scavengeCheckOpen = !scavengeCheckOpen"
          >
            Tester
          </UButton>
        </div>
        <KnInlineCheck
          v-if="scavengeCheckOpen"
          :request="{ id: 'skill:scavenge', difficulty: 'normal', note: 'Fouiller la pièce' }"
          @close="scavengeCheckOpen = false"
        />
      </li>

      <KnTableRoll
        v-if="visit.kind !== 'revisit' && scavengeTable"
        label="Fouille (après un test de Fouille réussi)"
        :die="scavengeTable.die"
        :roll="visit.scavenge?.roll"
        :table="scavengeTable.table"
        :active
        @roll="manual => emit('table', 'scavenge', manual)"
      >
        <template #result>
          <div
            v-if="canAdjustScavenge"
            class="mt-1 flex flex-wrap items-center gap-2"
          >
            <UButton
              size="xs"
              variant="outline"
              icon="i-heroicons:cube"
              @click="scavengerRoll = knRollDie(KN_SCAVENGER_DIE)"
            >
              Fouille ajustable : lancer le D4
            </UButton>
            <template v-if="scavengerRoll">
              <span class="text-sm">D4 : {{ scavengerRoll }}</span>
              <UButton
                size="xs"
                @click="adjustScavenge(scavengerRoll)"
              >
                +{{ scavengerRoll }}
              </UButton>
              <UButton
                size="xs"
                @click="adjustScavenge(-scavengerRoll)"
              >
                −{{ scavengerRoll }}
              </UButton>
            </template>
          </div>
          <UButton
            v-if="scavengeEffects.length && !visit.scavenge?.applied"
            size="xs"
            variant="soft"
            class="mt-1"
            @click="emit('applyScavenge')"
          >
            Appliquer le résultat
          </UButton>
          <p
            v-else-if="scavengeEffects.length"
            class="text-xs text-muted"
          >
            Résultat appliqué à la fiche.
          </p>
          <KnOutcomePanel
            :entry="scavengeEntry"
            :taken="visit.scavenge?.taken ?? []"
            :active
            class="mt-1"
            @take="index => emit('take', 'scavenge', index)"
          />
        </template>
      </KnTableRoll>
    </ul>

    <div
      v-if="visit.kind !== 'revisit'"
      class="space-y-2"
    >
      <KnCreatureCard
        v-for="(draw, index) in encounters"
        :key="index"
        :creature="draw.creature"
        :name="draw.name"
        :level
        :source="draw.source"
        :can-engage="active && !inCombat"
        @engage="creature => emit('engage', creature)"
      />
      <KnCreatureDraw
        v-if="active && (visit.creatures?.length ?? 0) < KN_RUN_BOUNDS.creatures"
        :single="intro"
        @draw="(d6, d20) => emit('drawCreature', d6, d20)"
      />

      <div
        v-if="active"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <template v-if="visit.trader">
          <span class="flex-1">Le marchand est ici : sa carte est dans la section Marchand.</span>
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            @click="emit('trader', false)"
          >
            Il n'est pas là
          </UButton>
        </template>
        <UButton
          v-else
          size="sm"
          variant="soft"
          icon="i-heroicons:shopping-bag"
          @click="emit('trader', true)"
        >
          {{ traderFound ? 'Retourner voir le marchand' : 'Un marchand est ici' }}
        </UButton>
      </div>

      <div
        v-if="active && canAddDoor"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <UButton
          size="sm"
          variant="soft"
          @click="emit('addDoor')"
        >
          Vérifier une porte
        </UButton>
      </div>

      <div
        v-if="active && canSearch"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <span class="flex-1">
          Fouille approfondie d'un contenant : Dé de Tension (D{{ tensionDie }}) tout de suite, puis +{{ KN_DEEP_SEARCH_EXHAUSTION }} Épuisement
        </span>
        <KnDieActions
          @roll="emit('deepSearch')"
          @low="emit('deepSearch', LOW)"
          @high="emit('deepSearch', HIGH)"
        />
      </div>

      <KnObstacleBlock
        v-for="(obstacle, index) in visit.obstacles ?? []"
        :key="index"
        :obstacle
        :position="obstaclePosition(index)"
        :active
        :traps="tables.traps"
        :tension-die="tensionDie"
        :lockpicks
        @perception="result => emit('perception', index, result)"
        @trap="manual => emit('obstacleRoll', index, 'trap', manual)"
        @trap-type="manual => emit('obstacleRoll', index, 'trapType', manual)"
        @lock="manual => emit('obstacleRoll', index, 'lock', manual)"
        @noise="manual => emit('noise', manual)"
        @act="act => emit('obstacleAct', index, act)"
      />

      <ul
        v-if="visit.deepSearch"
        class="space-y-2 text-sm"
      >
        <KnTableRoll
          label="Contenu du contenant ouvert (D10)"
          :die="KN_DEEP_SEARCH_DIE"
          :roll="visit.deepSearch.content?.roll"
          plain
          :active
          @roll="manual => emit('deepSearchContent', manual)"
        >
          <template #result>
            <p class="text-sm">
              {{ knDeepSearchEmpty(visit.deepSearch.content?.roll ?? 0) ? 'Vide.' : 'Du butin : tirez dans la table du Butin des contenants (livre, p. 220).' }}
            </p>
          </template>
        </KnTableRoll>
      </ul>

      <ul
        v-if="visit.extraTension?.length"
        class="space-y-2 text-sm"
      >
        <li
          v-for="(check, index) in visit.extraTension"
          :key="index"
          class="flex flex-wrap items-center gap-2"
        >
          <UIcon
            name="i-heroicons:check-circle"
            class="size-5 text-success"
          />
          <span class="flex-1">
            Dé de Tension ({{ check.source === 'search' ? 'fouille approfondie' : 'vacarme' }}) : {{ dieHead(check) }} ·
            <span :class="outcome(check, 'tension').class">{{ outcome(check, 'tension').text }}</span>
            <template v-if="check.darkness">
              · Obscurité Grandissante {{ check.darkness.roll }} : {{ darknessText(check.darkness) }}
              <template v-if="check.darkness.influence">
                Influence tirée ({{ check.darkness.influence.roll }}) : {{ $t(`ker_nethalas.overseer.${check.darkness.influence.key}`) }}.
              </template>
            </template>
          </span>
          <UButton
            v-if="active && check.triggered && !check.darkness"
            size="sm"
            color="warning"
            @click="emit('extraDraw', index)"
          >
            Tirer l'événement
          </UButton>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  KN_DEEP_SEARCH_DIE,
  KN_DEEP_SEARCH_EXHAUSTION,
  KN_DOOR_DIE,
  KN_ENCOUNTER_DIE,
  KN_ENCOUNTER_THRESHOLD,
  knDeepSearchEmpty,
  type KnObstacleAct,
  type KnVisitTable,
} from '~~/shared/ker-nethalas/exploration'
import {
  KN_RUN_BOUNDS,
  knRollDie,
  knVisitCanSearch,
  knVisitFoundLair,
  knVisitPending,
  type KnDieResult,
  type KnGrowingDarknessDraw,
  type KnVisit,
} from '~~/shared/ker-nethalas/run'
import { knEntryPending } from '~~/shared/ker-nethalas/entryRolls'
import { knHasActivePerk } from '~~/shared/ker-nethalas/goalEffects'
import { KN_SCAVENGER_DIE } from '~~/shared/ker-nethalas/perks'
import { knEncounterTable, knFindCreature, type KnCreature } from '~~/shared/ker-nethalas/creatures'
import { KN_EXPLORATION_TABLES, knTableEntry, type KnExplorationTableName, type KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  visit: KnVisit
  position: number
  active?: boolean
  tensionDie: number
  lairDie: number
  exitDie: number
  lockpicks: number
  level: number
  inCombat?: boolean
  bestiary: KnCreature[] | null
  tables: Partial<Record<KnExplorationTableName, KnRollTable | null>>
  // Le Domaine d'introduction : portes déjà marquées, une seule table de rencontres.
  intro?: boolean
  // Un marchand a déjà été trouvé dans ce Domaine.
  traderFound?: boolean
  // La pièce où l'on est revenu : ni description, ni rencontre de combat, ni événement à tirer, et ses Dés de Tension, de Lair et de
  // Sortie sont ceux du retour.
  retracing?: boolean
  // Pour une entrée de retour : la pièce ou le couloir qu'elle revisite.
  returnTo?: { position: number, kind: 'room' | 'corridor' }
}>()

const emit = defineEmits<{
  tension: [manual?: number]
  usage: [manual?: number]
  draw: []
  undo: []
  table: [name: KnVisitTable, manual?: number]
  trader: [here: boolean]
  adjustScavenge: [delta: number]
  applyScavenge: []
  addDoor: []
  deepSearch: [manual?: number]
  deepSearchContent: [manual?: number]
  perception: [index: number, result: 'passed' | 'failed']
  obstacleRoll: [index: number, step: 'trap' | 'trapType' | 'lock', manual?: number]
  noise: [manual?: number]
  extraDraw: [index: number]
  take: [target: 'event' | 'scavenge', index: number]
  addRoomTrap: []
  obstacleAct: [index: number, act: KnObstacleAct]
  drawCreature: [d6: number, d20: number]
  engage: [creature: KnCreature]
  resume: []
  rollEntry: []
}>()

// Les dés d'entrée se lancent d'un bouton ; saisir ses propres dés rend leurs champs.
const manual = ref(false)
const entryPending = computed(() => knEntryPending(props.visit, !!props.intro, !!props.retracing))

const { labelText } = useKnLabels()

// « 1-2 » et « 3+ » valent 1 et 3 : seuls cas que les dés d'usage distinguent.
const LOW = 1
const HIGH = 3

const KIND_LABELS = { room: 'Salle', corridor: 'Couloir', revisit: 'Retour' }
const USAGE_NAMES = { lair: 'Lair', exit: 'Sortie' }

const restText = computed(() => {
  const breathers = (props.visit.rest ?? []).filter(kind => kind === 'breather').length
  const camps = (props.visit.rest ?? []).filter(kind => kind === 'camp').length
  return [
    breathers ? `${breathers} souffle${breathers > 1 ? 's' : ''}` : '',
    camps ? `${camps} camp${camps > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ')
})

const foundLair = computed(() => knVisitFoundLair(props.visit))
const pending = computed(() => knVisitPending(props.visit))

const scavengeCheckOpen = ref(false)

const { character } = useKnCheckContext()
const scavengerRoll = ref<number | null>(null)
const canAdjustScavenge = computed(() => {
  const scavenge = props.visit.scavenge
  return props.active && !!scavenge && !scavenge.adjusted && !scavenge.applied && !scavenge.taken?.length
    && knHasActivePerk(character.value, 'scavenger')
})

function adjustScavenge(delta: number) {
  emit('adjustScavenge', delta)
  scavengerRoll.value = null
}

const rollText = (result: KnDieResult) => result.manual ? (result.roll <= 2 ? '1-2' : '3+') : String(result.roll)

const dieHead = (result: KnDieResult) => `D${result.die} → ${rollText(result)}`

function outcome(result: KnDieResult, kind: 'tension' | 'lair' | 'exit') {
  if (result.triggered) {
    return kind === 'tension'
      ? { text: 'se déclenche, retour à D8', class: 'font-bold text-error' }
      : { text: kind === 'lair' ? 'Lair trouvé' : 'Sortie trouvée', class: 'font-bold text-success' }
  }
  return result.next === result.die
    ? { text: `reste à D${result.die}`, class: 'text-muted' }
    : { text: `descend à D${result.next}`, class: 'font-semibold text-warning' }
}

const darknessText = (draw: KnGrowingDarknessDraw) => labelText({
  key: `ker_nethalas.growing_darkness.${draw.entry.key}`,
  params: { value: draw.entry.value ?? 0, skill: draw.entry.skill ? `ker_nethalas.skills.${draw.entry.skill}` : 'ker_nethalas.reminders.noSkillChosen' },
})

// Retour dans une pièce : rien à tirer si elle n'a pas déjà eu sa rencontre.
const encounterLocked = computed(() =>
  props.visit.kind === 'revisit' || foundLair.value || !!props.visit.noEncounter || (!!props.retracing && !props.visit.encounter))

const encounterText = computed(() => {
  if (props.visit.kind === 'revisit' || props.retracing) return 'Ni rencontre de combat ni événement : la zone est déjà explorée.'
  if (props.visit.noEncounter) return 'Cette salle du Domaine d\'introduction n\'a ni rencontre de combat ni événement.'
  if (foundLair.value) return 'Lair de l\'Overseer : pas de test de rencontre de combat.'
  return props.visit.kind === 'corridor'
    ? `Rencontre de combat (D20, ${KN_ENCOUNTER_THRESHOLD.corridor} ou plus dans un couloir)`
    : `Rencontre de combat (D20, ${KN_ENCOUNTER_THRESHOLD.room} ou plus dans une salle)`
})

const tableOf = (name: KnExplorationTableName) => ({ die: KN_EXPLORATION_TABLES[name].die, table: props.tables[name] ?? null })

const descriptionTable = computed(() => props.visit.kind === 'revisit' ? null : tableOf(props.visit.kind === 'corridor' ? 'corridorDescriptions' : 'roomDescriptions'))
const eventTable = computed(() => props.visit.kind === 'room' && !foundLair.value && !props.visit.noEvent ? tableOf('events') : null)
const scavengeTable = computed(() => tableOf('scavenging'))

const canAddDoor = computed(() => (props.intro ? props.visit.kind !== 'revisit' : !!props.visit.door?.present) && (props.visit.obstacles?.length ?? 0) < KN_RUN_BOUNDS.obstacles)
const canSearch = computed(() => knVisitCanSearch(props.visit) && (props.visit.obstacles?.length ?? 0) < KN_RUN_BOUNDS.obstacles)

// Numéro d'un obstacle parmi ceux de sa sorte (porte n° 2, contenant n° 1).
const obstaclePosition = (index: number) =>
  (props.visit.obstacles ?? []).slice(0, index + 1).filter(obstacle => obstacle.kind === props.visit.obstacles![index]!.kind).length

// Chaque créature tirée : la table (D6) donne A ou B, le D20 la ligne, et la ligne désigne la fiche du bestiaire.
const encounters = computed(() => (props.visit.creatures ?? []).map(({ d6, d20 }) => {
  if (props.intro) {
    const entry = knTableEntry(props.tables.encountersFirstDomain ?? null, d20)
    return { name: entry?.text ?? 'Créature inconnue', creature: knFindCreature(props.bestiary, entry?.ref), source: `Table du Domaine d'introduction · D20 ${d20}` }
  }
  const table = knEncounterTable(d6)
  const entry = knTableEntry(props.tables[table === 'A' ? 'encountersA' : 'encountersB'] ?? null, d20)
  return {
    name: entry?.text ?? 'Créature inconnue',
    creature: knFindCreature(props.bestiary, entry?.ref),
    source: `Table ${table} · D6 ${d6}, D20 ${d20}`,
  }
}))

const eventEntry = computed(() => props.visit.event ? knTableEntry(props.tables.events ?? null, props.visit.event.roll) : undefined)
const scavengeEntry = computed(() => props.visit.scavenge ? knTableEntry(props.tables.scavenging ?? null, props.visit.scavenge.roll) : undefined)

const scavengeEffects = computed(() => knTableEntry(props.tables.scavenging ?? null, props.visit.scavenge?.roll ?? 0)?.effects ?? [])
</script>
