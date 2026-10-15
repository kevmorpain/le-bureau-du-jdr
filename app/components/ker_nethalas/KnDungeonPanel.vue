<template>
  <UCard>
    <template #header>
      <KnCardHeader title="Donjon">
        Chaque entrée dans une salle retire la lumière et recharge l'Éther. Les entrées forment le chemin du Domaine ; en choisir une affiche son contenu à droite. « Nouvelle entrée » tire la forme au D100 (1-25 un couloir, 26-100 une salle).
      </KnCardHeader>
    </template>

    <div class="space-y-6">
      <div class="space-y-3">
        <UFormField label="Domaine">
          <USelect
            :model-value="run.current"
            :items="domainItems"
            class="w-full"
            @update:model-value="switchDomain"
          />
        </UFormField>
        <div class="grid items-end gap-3 @sm:grid-cols-[1fr_auto]">
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
      </div>

      <div class="grid gap-3 @sm:grid-cols-[8rem_1fr]">
        <KnNumberField
          v-model="domain.rooms"
          label="Salles explorées"
          :min="KN_RUN_BOUNDS.rooms.min"
          :max="KN_RUN_BOUNDS.rooms.max"
        />
        <div class="flex flex-wrap items-end gap-3">
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

      <div class="grid gap-3 @2xl:grid-cols-3">
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

      <ul
        v-if="!domain.overseer"
        class="text-sm"
      >
        <KnTableRoll
          label="Overseer du Domaine (une fois en y entrant)"
          :die="KN_OVERSEER_DIE"
          plain
          active
          @roll="drawOverseer"
        />
      </ul>
      <KnCreatureCard
        v-else
        :creature="overseer.creature"
        :name="overseer.name"
        :level="character.level"
        :source="`Overseer du Domaine · D10 ${domain.overseer.roll}`"
        :can-engage="!run.combat"
        @engage="creature => engageAndShow(creature, true)"
      />

      <KnDomainEditor v-model:domain="character.run.domains[character.run.current]" />

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
          <button
            v-for="(visit, index) in visitsNewestFirst"
            :key="domain.visits.length - index"
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left hover:bg-elevated"
            :class="domain.visits.length - 1 - index === shown ? 'border-primary' : 'border-default'"
            :aria-pressed="domain.visits.length - 1 - index === shown"
            @click="selected = index === 0 ? null : domain.visits.length - 1 - index"
          >
            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold">
              {{ domain.visits.length - index }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-medium">{{ KIND_LABELS[visit.kind] }}</span>
              <span class="block text-xs text-muted">{{ summary(visit) }}</span>
            </span>
            <UBadge
              v-if="index === 0"
              color="primary"
              variant="subtle"
              size="md"
              label="En cours"
            />
          </button>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_OVERSEER_DIE, knFindCreature, type KnCreature } from '~~/shared/ker-nethalas/creatures'
import { KN_SHAPE_DIE, knShapeKind } from '~~/shared/ker-nethalas/exploration'
import { knReturnableDomains } from '~~/shared/ker-nethalas/firstDomain'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import {
  KN_LIGHT_ROOMS,
  KN_OPTIONAL_LAIR_ROOMS,
  KN_RUN_BOUNDS,
  KN_USAGE_DICE,
  knCurrentDomain,
  knRollDie,
  knSwitchDomain,
  knVisitFoundLair,
  type KnUsageDie,
  type KnVisit,
  type KnVisitKind,
} from '~~/shared/ker-nethalas/run'
import { knTableEntry, type KnExplorationTableName, type KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  resolved: KnResolvedSheet
  tables: Partial<Record<KnExplorationTableName, KnRollTable | null>>
  bestiary: KnCreature[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })
const selected = defineModel<number | null>('selected', { required: true })

provideKnCheckContext({ character, resolved: computed(() => props.resolved) })

const { newDomain, drawOverseer } = useKnExploration(character, () => props.resolved, () => props.tables)
const { engage } = useKnCombat(character, () => props.resolved, () => props.bestiary)
const { enter } = useKnVisitEntry(character, () => props.resolved)

const KIND_LABELS: Record<KnVisitKind, string> = { room: 'Salle', corridor: 'Couloir', revisit: 'Retour' }

const run = computed(() => character.value.run)
const domain = computed(() => knCurrentDomain(character.value.run))
const visitsNewestFirst = computed(() => [...domain.value.visits].reverse())
const shown = computed(() => Math.min(selected.value ?? domain.value.visits.length - 1, domain.value.visits.length - 1))

const overseer = computed(() => {
  const roll = knCurrentDomain(character.value.run).overseer?.roll
  const entry = roll === undefined ? undefined : knTableEntry(props.tables.overseers ?? null, roll)
  return { name: entry?.text ?? 'Overseer inconnu', creature: knFindCreature(props.bestiary, entry?.ref) }
})

const domainItems = computed<SelectItem[]>(() =>
  knReturnableDomains(run.value).map(index => ({ label: run.value.domains[index]!.name, value: index })),
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

// La forme tirée au D100 décide du type d'entrée : 1-25 un couloir, 26-100 une salle.
function enterByShape() {
  const roll = knRollDie(KN_SHAPE_DIE)
  enter(knShapeKind(roll), roll)
}

// La carte de combat est dans la colonne de droite : on y emmène le joueur.
async function engageAndShow(creature: KnCreature, overseer = false) {
  engage(creature, overseer)
  await nextTick()
  document.getElementById('kn-combat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function summary(visit: KnVisit) {
  const parts: string[] = []
  if (knVisitFoundLair(visit)) parts.push('Lair trouvé')
  else if (visit.usageKind === 'exit' && visit.usage?.triggered) parts.push('Sortie trouvée')
  if (visit.creatures?.length) parts.push(`${visit.creatures.length} créature${visit.creatures.length > 1 ? 's' : ''}`)
  if (visit.event) parts.push('événement')
  if (visit.trader) parts.push('marchand')
  if (visit.obstacles?.length) parts.push(`${visit.obstacles.length} obstacle${visit.obstacles.length > 1 ? 's' : ''}`)
  return parts.length ? parts.join(' · ') : 'rien de notable'
}
</script>
