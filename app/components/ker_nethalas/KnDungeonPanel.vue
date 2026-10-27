<template>
  <KnCard storage-key="dungeon">
    <template #summary>
      {{ domain.name }} · {{ settingsSummary }}
    </template>
    <template #header>
      <KnCardHeader title="Donjon">
        Chaque entrée dans une salle retire la lumière et recharge l'Éther. Les entrées forment le chemin du Domaine ; en choisir une affiche son contenu à droite. « Nouvelle entrée » tire la forme au D100 (1-25 un couloir, 26-100 une salle).
      </KnCardHeader>
    </template>

    <div class="space-y-6">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium">{{ domain.name }}</span>
        <span class="text-muted">{{ settingsSummary }}</span>
        <UButton
          class="ml-auto"
          size="xs"
          variant="ghost"
          color="neutral"
          :icon="settingsOpen ? 'i-heroicons:chevron-up' : 'i-heroicons:cog-6-tooth'"
          :aria-expanded="settingsOpen"
          @click="settingsOpen = !settingsOpen"
        >
          Réglages du Domaine
        </UButton>
      </div>

      <template v-if="settingsOpen">
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
      </template>

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
      <div
        v-else
        class="space-y-2 rounded-md border border-default p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold">Overseer : {{ overseer.name }}</span>
          <span class="text-xs text-muted">D10 {{ domain.overseer.roll }}{{ domain.overseerDefeated ? ' · vaincu' : '' }}</span>
          <div class="ml-auto flex gap-2">
            <UButton
              v-if="overseer.creature && !run.combat"
              size="xs"
              icon="i-heroicons:bolt"
              @click="engageAndShow(overseer.creature, true)"
            >
              Engager le combat
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              :aria-expanded="overseerOpen"
              @click="overseerOpen = !overseerOpen"
            >
              {{ overseerOpen ? 'Masquer la fiche' : 'Voir la fiche' }}
            </UButton>
          </div>
        </div>
        <KnCreatureCard
          v-if="overseerOpen"
          :creature="overseer.creature"
          :name="overseer.name"
          :level="character.level"
          :source="`Overseer du Domaine · D10 ${domain.overseer.roll}`"
          :can-engage="!run.combat"
          @engage="creature => engageAndShow(creature, true)"
        />
      </div>

      <ul
        v-if="!domain.overseerDefeated && (!domain.overseerInfluences.length || pendingResistances)"
        class="text-sm"
      >
        <KnTableRoll
          v-if="!domain.overseerInfluences.length"
          label="Influence de l'Overseer (une fois en entrant dans le Domaine)"
          :die="KN_OVERSEER_INFLUENCE_DIE"
          plain
          active
          @roll="drawInfluence"
        />
        <KnTableRoll
          v-if="pendingResistances"
          label="Résistant : type de dégâts"
          :die="KN_DAMAGE_TYPE_DIE"
          plain
          active
          @roll="drawResistance"
        />
      </ul>
      <div
        v-if="influences.length"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span class="text-xs text-muted">Influences{{ domain.overseerDefeated ? ' (Overseer vaincu)' : '' }} :</span>
        <UTooltip
          v-for="(entry, index) in influences"
          :key="index"
          :text="influenceTitle(entry)"
          :ui="{ content: 'h-auto max-w-xs' }"
        >
          <UBadge
            color="error"
            variant="subtle"
            size="md"
            :class="{ 'line-through opacity-50': domain.overseerDefeated }"
          >
            {{ influenceLabel(entry) }}
            <button
              type="button"
              class="-mr-1 cursor-pointer rounded-full hover:bg-error/20"
              :aria-label="`Retirer l'influence : ${influenceTitle(entry)}`"
              @click="removeInfluence(index)"
            >
              <UIcon
                name="i-heroicons:x-mark"
                class="size-3.5"
              />
            </button>
          </UBadge>
        </UTooltip>
      </div>

      <KnDomainEditor
        v-if="settingsOpen"
        v-model:domain="character.run.domains[character.run.current]"
      />

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
          <div
            v-for="entry in entriesNewestFirst"
            :key="entry.index"
            class="flex items-center gap-2 rounded-lg border pr-2 hover:bg-elevated"
            :class="entry.index === shown ? 'border-primary' : 'border-default'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2 text-left"
              :aria-pressed="entry.index === shown"
              @click="selected = entry.index === lastIndex ? null : entry.index"
            >
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-semibold">
                {{ entry.index + 1 }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-medium">{{ entryLabel(entry.visit) }}</span>
                <span class="mt-1 flex flex-wrap gap-1">
                  <UBadge
                    v-for="tag in tags(entry.visit)"
                    :key="tag.label"
                    :label="tag.label"
                    :color="tag.color"
                    variant="subtle"
                    size="md"
                  />
                  <span
                    v-if="!tags(entry.visit).length"
                    class="text-xs text-muted"
                  >rien de notable</span>
                </span>
              </span>
              <UBadge
                v-if="entry.index === lastIndex"
                color="primary"
                variant="subtle"
                size="md"
                label="En cours"
              />
              <UBadge
                v-else-if="entry.index === location"
                color="info"
                variant="subtle"
                size="md"
                label="Vous êtes ici"
              />
            </button>
            <UButton
              v-if="entry.visit.kind !== 'revisit' && entry.index !== location"
              size="xs"
              variant="outline"
              icon="i-heroicons:arrow-uturn-left"
              :aria-label="`Retourner dans ${entryLabel(entry.visit).toLowerCase()} n° ${entry.index + 1}`"
              @click="enter('revisit', undefined, undefined, entry.index)"
            >
              Y retourner
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_DAMAGE_TYPE_DIE } from '~~/shared/ker-nethalas/catalog/damageTypes'
import {
  KN_OVERSEER_INFLUENCE_DIE,
  knOverseerInfluenceEntries,
  knPendingResistances,
  knRemoveInfluence,
  type KnOverseerInfluenceEntry,
} from '~~/shared/ker-nethalas/catalog/overseerInfluence'
import { KN_OVERSEER_DIE, knFindCreature, type KnCreature } from '~~/shared/ker-nethalas/creatures'
import { KN_SHAPE_DIE, knShapeKind } from '~~/shared/ker-nethalas/exploration'
import { knReturnableDomains } from '~~/shared/ker-nethalas/firstDomain'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knSetTensionStart } from '~~/shared/ker-nethalas/run'
import {
  KN_LIGHT_ROOMS,
  KN_OPTIONAL_LAIR_ROOMS,
  KN_RUN_BOUNDS,
  KN_USAGE_DICE,
  knCurrentDomain,
  knLocationIndex,
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

const { newDomain, drawOverseer, drawInfluence, drawResistance } = useKnExploration(character, () => props.resolved, () => props.tables)
const permanent = useKnPermanent(character)
watch(() => permanent.value.tensionStart, (die) => {
  character.value.run = knSetTensionStart(character.value.run, die)
}, { immediate: true })
const { engage } = useKnCombat(character, () => props.resolved, () => props.bestiary)
const { enter } = useKnVisitEntry(character, () => props.resolved)

const KIND_LABELS: Record<KnVisitKind, string> = { room: 'Salle', corridor: 'Couloir', revisit: 'Retour' }

const run = computed(() => character.value.run)
const domain = computed(() => knCurrentDomain(character.value.run))
const settingsOpen = ref(false)
const overseerOpen = ref(false)

const { t } = useI18n()
const influences = computed(() => knOverseerInfluenceEntries(domain.value.overseerInfluences, domain.value.overseerResistances))
const pendingResistances = computed(() => knPendingResistances(domain.value.overseerInfluences, domain.value.overseerResistances))

function removeInfluence(index: number) {
  const target = character.value.run.domains[character.value.run.current]!
  const next = knRemoveInfluence(target.overseerInfluences, index, target.overseerResistances)
  target.overseerInfluences = next.keys
  target.overseerResistances = next.resistances
}

function influenceTitle({ key, damageType }: KnOverseerInfluenceEntry) {
  return damageType
    ? t('ker_nethalas.overseer.resistant_typed', { type: t(`ker_nethalas.damageTypes.${damageType}`) })
    : t(`ker_nethalas.overseer.${key}`)
}

function influenceLabel({ key, damageType }: KnOverseerInfluenceEntry) {
  const name = t(`ker_nethalas.overseer.${key}`).split(' :')[0]
  return damageType ? `${name} · ${t(`ker_nethalas.damageTypes.${damageType}`)}` : name
}

const settingsSummary = computed(() => {
  const d = domain.value
  const dice = [`Tension D${run.value.tensionDie}`, d.lairFound ? 'Lair trouvé' : `Lair D${d.lairDie}`, d.exitFound ? 'Sortie trouvée' : `Sortie D${d.exitDie}`]
  return `${d.rooms} salle${d.rooms > 1 ? 's' : ''} · lumière ${run.value.lightRemaining} · ${dice.join(' · ')}`
})

const entriesNewestFirst = computed(() => domain.value.visits.map((visit, index) => ({ visit, index })).reverse())
const lastIndex = computed(() => domain.value.visits.length - 1)
const location = computed(() => knLocationIndex(domain.value))
const shown = computed(() => Math.min(selected.value ?? lastIndex.value, lastIndex.value))

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

// Un retour dit où il retourne ; une ancienne entrée de retour, sans cible, reste « Retour ».
function entryLabel(visit: KnVisit) {
  if (visit.kind !== 'revisit' || visit.of === undefined) return KIND_LABELS[visit.kind]
  const target = domain.value.visits.findIndex(entry => entry.id === visit.of)
  return target < 0 ? 'Retour' : `Retour · ${domain.value.visits[target]!.kind === 'corridor' ? 'couloir' : 'salle'} n° ${target + 1}`
}

type BadgeColor = 'error' | 'warning' | 'success' | 'info' | 'neutral'

// Les repères d'une pièce sur sa ligne du chemin : ce qui s'y est passé ou s'y trouve.
function tags(visit: KnVisit): { label: string, color: BadgeColor }[] {
  const out: { label: string, color: BadgeColor }[] = []
  if (visit.fled) out.push({ label: 'combat fui', color: 'warning' })
  else if (visit.creatures?.length || visit.encounter?.triggered) out.push({ label: 'combat', color: 'error' })
  if (visit.scavenge || visit.deepSearch) out.push({ label: 'butin', color: 'warning' })
  if (visit.trader) out.push({ label: 'marchand', color: 'success' })
  if (knVisitFoundLair(visit)) out.push({ label: 'Lair', color: 'warning' })
  else if (visit.usageKind === 'exit' && visit.usage?.triggered) out.push({ label: 'Sortie', color: 'success' })
  if (visit.event) out.push({ label: 'événement', color: 'neutral' })
  if (visit.obstacles?.length) out.push({ label: `${visit.obstacles.length} obstacle${visit.obstacles.length > 1 ? 's' : ''}`, color: 'neutral' })
  if (visit.rest?.length) out.push({ label: visit.rest.includes('camp') ? 'camp' : 'souffle', color: 'info' })
  return out
}
</script>
