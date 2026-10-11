<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Run
      </h2>
      <p class="text-sm text-muted">
        Chaque entrée dans une salle retire la lumière et recharge l'Éther, puis ouvre un bloc qui garde les dés lancés : les blocs forment le chemin du Domaine. Les dés se lancent ici, ou se saisissent si vous avez lancé les vôtres. « Nouvelle entrée » tire la forme au D100 (1-25 un couloir, 26-100 une salle).
      </p>
    </template>

    <div class="space-y-6">
      <div class="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <UFormField label="Domaine">
          <USelect
            :model-value="run.current"
            :items="domainItems"
            class="w-full"
            @update:model-value="switchDomain"
          />
        </UFormField>
        <UFormField label="Nom du Domaine">
          <UInput
            :model-value="domain.name"
            :maxlength="100"
            class="w-full"
            @update:model-value="rename"
          />
        </UFormField>
        <UButton
          icon="i-heroicons:plus"
          variant="soft"
          :disabled="run.domains.length >= KN_RUN_BOUNDS.domains"
          @click="newDomain"
        >
          Nouveau Domaine
        </UButton>
      </div>

      <div class="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <KnNumberField
          v-model="domain.rooms"
          label="Salles explorées"
          :min="KN_RUN_BOUNDS.rooms.min"
          :max="KN_RUN_BOUNDS.rooms.max"
        />
        <div class="flex items-end gap-3">
          <KnNumberField
            v-model="character.run.lightRemaining"
            label="Lumière restante (salles)"
            :min="KN_RUN_BOUNDS.light.min"
            :max="KN_RUN_BOUNDS.light.max"
            class="w-40"
          />
          <UButton
            variant="soft"
            @click="character.run.lightRemaining = KN_LIGHT_ROOMS"
          >
            Nouvelle source ({{ KN_LIGHT_ROOMS }})
          </UButton>
          <UBadge
            v-if="run.lightRemaining === 0"
            color="warning"
            variant="subtle"
            label="Sans lumière"
          />
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <UFormField label="Dé de Tension">
          <USelect
            :model-value="run.tensionDie"
            :items="dieItems"
            class="w-full"
            @update:model-value="value => setDie('tension', value)"
          />
        </UFormField>
        <UFormField label="Dé de Lair">
          <div class="flex items-center gap-3">
            <USelect
              :model-value="domain.lairDie"
              :items="dieItems"
              :disabled="domain.lairFound"
              class="flex-1"
              @update:model-value="value => setDie('lair', value)"
            />
            <UCheckbox
              v-model="domain.lairFound"
              label="Trouvé"
            />
          </div>
        </UFormField>
        <UFormField label="Dé de Sortie">
          <div class="flex items-center gap-3">
            <USelect
              :model-value="domain.exitDie"
              :items="dieItems"
              :disabled="domain.exitFound"
              class="flex-1"
              @update:model-value="value => setDie('exit', value)"
            />
            <UCheckbox
              v-model="domain.exitFound"
              label="Trouvée"
            />
          </div>
        </UFormField>
      </div>

      <p
        v-if="!domain.lairFound && domain.rooms >= KN_OPTIONAL_LAIR_ROOMS"
        class="text-sm text-warning"
      >
        Règle optionnelle : {{ KN_OPTIONAL_LAIR_ROOMS }} salles explorées sans avoir trouvé le Lair, la salle suivante le contient.
      </p>

      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <UButton
            icon="i-heroicons:cube"
            @click="enterByShape"
          >
            Nouvelle entrée (forme au D100)
          </UButton>
          <UButton
            variant="soft"
            @click="enter('room')"
          >
            Nouvelle salle
          </UButton>
          <UButton
            variant="soft"
            @click="enter('corridor')"
          >
            Nouveau couloir
          </UButton>
          <UButton
            variant="outline"
            @click="enter('revisit')"
          >
            Retour dans une salle ou un couloir déjà explorés
          </UButton>
        </div>

        <p
          v-if="!domain.visits.length"
          class="text-sm text-muted"
        >
          Aucune entrée enregistrée dans ce Domaine.
        </p>

        <div
          v-else
          class="space-y-2"
        >
          <p class="text-xs font-medium text-muted">
            Chemin du Domaine, de la dernière entrée à la première
          </p>
          <KnVisitBlock
            v-for="(visit, index) in visitsNewestFirst"
            :key="domain.visits.length - index"
            :visit
            :position="domain.visits.length - index"
            :active="index === 0"
            :tension-die="run.tensionDie"
            :lair-die="domain.lairDie"
            :exit-die="domain.exitDie"
            :tables
            @tension="tension"
            @usage="usage"
            @draw="drawDarkness"
            @undo="undo"
            @table="tableRoll"
            @apply-scavenge="applyScavenge"
          />
        </div>
      </div>

      <KnDomainEditor v-model:domain="character.run.domains[character.run.current]" />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_DOOR_DIE, KN_ENCOUNTER_DIE, KN_SHAPE_DIE, knShapeKind, type KnVisitTable } from '~~/shared/ker-nethalas/exploration'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import {
  KN_LIGHT_ROOMS,
  KN_OPTIONAL_LAIR_ROOMS,
  KN_RUN_BOUNDS,
  KN_USAGE_DICE,
  knCurrentDomain,
  knCurrentVisit,
  knDrawGrowingDarkness,
  knMarkScavengeApplied,
  knNewDomain,
  knRecordDarkness,
  knRecordDescription,
  knRecordDoor,
  knRecordEncounter,
  knRecordEvent,
  knRecordScavenge,
  knRecordTension,
  knRecordUsage,
  knRollDie,
  knStartVisit,
  knSwitchDomain,
  knUndoLastVisit,
  type KnUsageDie,
  type KnVisitKind,
} from '~~/shared/ker-nethalas/run'
import { KN_EXPLORATION_TABLES, knApplyTableEffects, knTableEntry, type KnExplorationTableName, type KnRollTable } from '~~/shared/ker-nethalas/tables'
import { knResetUses } from '~~/shared/ker-nethalas/vitals'

const props = defineProps<{
  resolved: KnResolvedSheet
  tables: Partial<Record<KnExplorationTableName, KnRollTable | null>>
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()
const { t } = useI18n()

const run = computed(() => character.value.run)
const domain = computed(() => knCurrentDomain(character.value.run))
const visitsNewestFirst = computed(() => [...domain.value.visits].reverse())

const domainItems = computed<SelectItem[]>(() =>
  run.value.domains.map((d, index) => ({ label: d.name, value: index })),
)
const dieItems: SelectItem[] = KN_USAGE_DICE.map(die => ({ label: `D${die}`, value: die }))

const asDie = (value: unknown): KnUsageDie | undefined => KN_USAGE_DICE.find(die => die === value)

function setDie(which: 'tension' | 'lair' | 'exit', value: unknown) {
  const die = asDie(value)
  if (!die) return
  if (which === 'tension') character.value.run.tensionDie = die
  else if (which === 'lair') domain.value.lairDie = die
  else domain.value.exitDie = die
}

// Un nom vidé en cours de frappe n'est pas écrit : le schéma le refuserait et l'auto-save échouerait.
function rename(value: string | number | null | undefined) {
  if (typeof value === 'string' && value.trim() !== '') domain.value.name = value
}

function switchDomain(value: unknown) {
  if (typeof value === 'number') character.value.run = knSwitchDomain(character.value.run, value)
}

function newDomain() {
  character.value.run = knNewDomain(character.value.run)
}

// La forme tirée au D100 décide du type d'entrée : 1-25 un couloir, 26-100 une salle.
function enterByShape() {
  const roll = knRollDie(KN_SHAPE_DIE)
  enter(knShapeKind(roll), roll)
}

function enter(kind: KnVisitKind, shapeRoll?: number) {
  character.value.run = knStartVisit(character.value.run, kind, shapeRoll)
  character.value.status = knResetUses(character.value.status, ['room'])
  character.value.aetherCurrent = props.resolved.maxVitals.aether.effective
}

// Saisie manuelle : le bloc passe 1 ou 3, tirage automatique sinon.
function tension(manual?: number) {
  const roll = manual ?? knRollDie(character.value.run.tensionDie)
  character.value.run = knRecordTension(character.value.run, roll, manual !== undefined)
}

function usage(manual?: number) {
  const current = domain.value
  const visit = current.visits.at(-1)
  if (!visit?.usageKind) return
  const roll = manual ?? knRollDie(visit.usageKind === 'lair' ? current.lairDie : current.exitDie)
  character.value.run = knRecordUsage(character.value.run, roll, manual !== undefined)
}

function drawDarkness() {
  character.value.run = knRecordDarkness(character.value.run, knDrawGrowingDarkness())
}

const TABLE_RECORDS = {
  description: knRecordDescription,
  encounter: knRecordEncounter,
  event: knRecordEvent,
  door: knRecordDoor,
  scavenge: knRecordScavenge,
}

function tableDie(name: KnVisitTable) {
  if (name === 'encounter') return KN_ENCOUNTER_DIE
  if (name === 'door') return KN_DOOR_DIE
  if (name === 'event') return KN_EXPLORATION_TABLES.events.die
  if (name === 'scavenge') return KN_EXPLORATION_TABLES.scavenging.die
  return knCurrentVisit(character.value.run)?.kind === 'corridor'
    ? KN_EXPLORATION_TABLES.corridorDescriptions.die
    : KN_EXPLORATION_TABLES.roomDescriptions.die
}

function tableRoll(name: KnVisitTable, manual?: number) {
  const roll = manual ?? knRollDie(tableDie(name))
  character.value.run = TABLE_RECORDS[name](character.value.run, roll)
}

// Gains et pertes sans test d'un résultat de fouille : pièces, provisions, expérience, jauges.
function applyScavenge() {
  const c = character.value
  const visit = knCurrentVisit(c.run)
  const effects = knTableEntry(props.tables.scavenging ?? null, visit?.scavenge?.roll ?? 0)?.effects ?? []
  if (!visit?.scavenge || visit.scavenge.applied || !effects.length) return

  const { state, outcomes } = knApplyTableEffects(effects, {
    coins: c.coins,
    xp: c.xp,
    provisions: c.provisions,
    health: c.healthCurrent,
    toughness: c.toughnessCurrent,
    sanity: c.sanityCurrent,
    aether: c.aetherCurrent,
  }, {
    health: props.resolved.maxVitals.health.effective,
    toughness: props.resolved.maxVitals.toughness.effective,
    sanity: props.resolved.maxVitals.sanity.effective,
    aether: props.resolved.maxVitals.aether.effective,
  })

  c.coins = state.coins
  c.xp = state.xp
  c.provisions = state.provisions
  c.healthCurrent = state.health
  c.toughnessCurrent = state.toughness
  c.sanityCurrent = state.sanity
  c.aetherCurrent = state.aether
  c.run = knMarkScavengeApplied(c.run)

  const lines = outcomes.map(({ effect, roll }) => {
    if (effect.kind === 'coins') return `${roll.total} ₵`
    if (effect.kind === 'xp') return `${roll.total} XP`
    if (effect.kind === 'provision') return `${roll.total} ${t(`ker_nethalas.provisions.${effect.key}`)}`
    return `${effect.sign === 'gain' ? '+' : '−'}${roll.total} ${t(`ker_nethalas.vitals.${effect.vital}`).toLowerCase()}`
  })
  toast.add({ title: 'Fouille appliquée', description: lines.join(' · '), color: 'success' })
}

function undo() {
  character.value.run = knUndoLastVisit(character.value.run)
}
</script>
