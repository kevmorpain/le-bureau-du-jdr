<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Run
      </h2>
      <p class="text-sm text-muted">
        Chaque entrée dans une salle retire la lumière et recharge l'Éther, puis ouvre un bloc qui garde les dés lancés : les blocs forment le chemin du Domaine. Les dés se lancent ici, ou se saisissent avec « 1-2 » et « 3+ » si vous avez lancé les vôtres.
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
          <UButton @click="enter('room')">
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
            @tension="tension"
            @usage="usage"
            @draw="drawDarkness"
            @undo="undo"
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
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import {
  KN_LIGHT_ROOMS,
  KN_OPTIONAL_LAIR_ROOMS,
  KN_RUN_BOUNDS,
  KN_USAGE_DICE,
  knCurrentDomain,
  knDrawGrowingDarkness,
  knNewDomain,
  knRecordDarkness,
  knRecordTension,
  knRecordUsage,
  knRollDie,
  knStartVisit,
  knSwitchDomain,
  knUndoLastVisit,
  type KnUsageDie,
  type KnVisitKind,
} from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

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

function enter(kind: KnVisitKind) {
  character.value.run = knStartVisit(character.value.run, kind)
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

function undo() {
  character.value.run = knUndoLastVisit(character.value.run)
}
</script>
