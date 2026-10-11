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
        v-if="active"
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
        :active
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
          v-else-if="!active"
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
          v-else-if="!active"
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

    <div
      v-if="active && pending.darkness"
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
        v-if="visit.kind === 'revisit' || foundLair"
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
        :active
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
        :active
        @roll="manual => emit('table', 'event', manual)"
      />
      <li
        v-else-if="visit.kind === 'room' && !foundLair && !visit.encounter && active"
        class="text-muted"
      >
        Sans rencontre de combat, un événement se tire dans la table des Événements.
      </li>

      <KnTableRoll
        v-if="visit.kind !== 'revisit'"
        label="Porte ?"
        :die="KN_DOOR_DIE"
        :roll="visit.door?.roll"
        plain
        :active
        @roll="manual => emit('table', 'door', manual)"
      >
        <template #result>
          <p class="text-sm">
            {{ visit.door?.present ? 'Oui : verrous et pièges à vérifier (livre, p. 117).' : 'Non.' }}
          </p>
        </template>
      </KnTableRoll>

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
        </template>
      </KnTableRoll>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { KN_DOOR_DIE, KN_ENCOUNTER_DIE, KN_ENCOUNTER_THRESHOLD, type KnVisitTable } from '~~/shared/ker-nethalas/exploration'
import { knVisitFoundLair, knVisitPending, type KnDieResult, type KnGrowingDarknessDraw, type KnVisit } from '~~/shared/ker-nethalas/run'
import { KN_EXPLORATION_TABLES, knTableEntry, type KnExplorationTableName, type KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  visit: KnVisit
  position: number
  active?: boolean
  tensionDie: number
  lairDie: number
  exitDie: number
  tables: Partial<Record<KnExplorationTableName, KnRollTable | null>>
}>()

const emit = defineEmits<{
  tension: [manual?: number]
  usage: [manual?: number]
  draw: []
  undo: []
  table: [name: KnVisitTable, manual?: number]
  applyScavenge: []
}>()

const { labelText } = useKnLabels()

// « 1-2 » et « 3+ » valent 1 et 3 : seuls cas que les dés d'usage distinguent.
const LOW = 1
const HIGH = 3

const KIND_LABELS = { room: 'Salle', corridor: 'Couloir', revisit: 'Retour' }
const USAGE_NAMES = { lair: 'Lair', exit: 'Sortie' }

const foundLair = computed(() => knVisitFoundLair(props.visit))
const pending = computed(() => knVisitPending(props.visit))

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

const encounterText = computed(() => {
  if (props.visit.kind === 'revisit') return 'Ni rencontre de combat ni événement : la zone est déjà explorée.'
  if (foundLair.value) return 'Lair de l\'Overseer : pas de test de rencontre de combat.'
  return props.visit.kind === 'corridor'
    ? `Rencontre de combat (D20, ${KN_ENCOUNTER_THRESHOLD.corridor} ou plus dans un couloir)`
    : `Rencontre de combat (D20, ${KN_ENCOUNTER_THRESHOLD.room} ou plus dans une salle)`
})

const tableOf = (name: KnExplorationTableName) => ({ die: KN_EXPLORATION_TABLES[name].die, table: props.tables[name] ?? null })

const descriptionTable = computed(() => props.visit.kind === 'revisit' ? null : tableOf(props.visit.kind === 'corridor' ? 'corridorDescriptions' : 'roomDescriptions'))
const eventTable = computed(() => props.visit.kind === 'room' && !foundLair.value ? tableOf('events') : null)
const scavengeTable = computed(() => tableOf('scavenging'))

const scavengeEffects = computed(() => knTableEntry(props.tables.scavenging ?? null, props.visit.scavenge?.roll ?? 0)?.effects ?? [])
</script>
