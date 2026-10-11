<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Maîtrises
      </h2>
      <p class="text-sm text-muted">
        Un point d'Aptitude par niveau (deux au niveau 1) : on débloque les aptitudes d'une Maîtrise du palier 1 au palier 5 ;
        les paliers à venir restent lisibles, grisés. Points à dépenser : <span class="font-semibold">{{ unspent }}</span>.
      </p>
    </template>

    <p
      v-if="!masteries"
      class="text-sm text-muted"
    >
      Le contenu des Maîtrises n'est pas chargé : elles se choisissent ici une fois chargé, en attendant elles se notent
      dans les notes libres.
    </p>

    <div
      v-else
      class="space-y-6"
    >
      <article
        v-for="entry in entries"
        :key="entry.key"
        class="space-y-3 rounded-md border border-default p-3"
      >
        <template v-if="find(entry.key)">
          <header class="flex flex-wrap items-center gap-3">
            <h3 class="flex-1 text-lg font-semibold">
              {{ find(entry.key)!.name }}
              <UBadge
                v-if="entry.amulet"
                label="Amulette"
                color="warning"
                variant="subtle"
                size="md"
                class="ml-2 align-middle"
              />
              <UBadge
                :label="`${entry.tiers} / ${KN_MASTERY_TIERS}`"
                variant="subtle"
                size="md"
                class="ml-2 align-middle"
              />
            </h3>
            <UButton
              size="sm"
              :disabled="unspent < 1 || entry.tiers >= KN_MASTERY_TIERS"
              @click="unlock(entry)"
            >
              Débloquer le palier {{ entry.tiers + 1 }}
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              :disabled="entry.tiers === 0"
              :aria-label="`Reprendre le dernier palier de ${find(entry.key)!.name}`"
              @click="lock(entry)"
            >
              Reprendre un palier
            </UButton>
          </header>

          <p class="text-sm text-muted">
            {{ find(entry.key)!.summary }}
          </p>

          <p class="rounded-md bg-elevated p-2 text-sm">
            <span class="font-medium">{{ find(entry.key)!.feature.name }}.</span> {{ find(entry.key)!.feature.text }}
          </p>

          <ul class="space-y-3">
            <li
              v-for="ability in find(entry.key)!.abilities"
              :key="ability.tier"
              :class="ability.tier <= entry.tiers ? '' : 'opacity-50'"
            >
              <p class="flex flex-wrap items-center gap-2 text-sm font-medium">
                <UIcon
                  :name="ability.tier <= entry.tiers ? 'i-heroicons:lock-open' : 'i-heroicons:lock-closed'"
                  class="size-4"
                  :class="ability.tier <= entry.tiers ? 'text-success' : 'text-muted'"
                />
                Palier {{ ability.tier }} — {{ ability.name }}
                <UBadge
                  v-if="ability.magical"
                  label="Magique"
                  color="info"
                  variant="subtle"
                  size="md"
                />
                <UBadge
                  v-if="ability.sustained"
                  label="Maintenu"
                  color="warning"
                  variant="subtle"
                  size="md"
                />
              </p>
              <p class="text-xs text-muted">
                {{ ability.action }}{{ ability.cost ? ` · ${ability.cost}` : '' }}
              </p>
              <p class="text-sm">
                {{ ability.text }}
              </p>
              <KnAbilityUse
                v-if="ability.tier <= entry.tiers"
                v-model:character="character"
                :ability
                :mastery-key="entry.key"
                :resolved
              />
              <details
                v-if="ability.summons && ability.tier <= entry.tiers"
                class="mt-2 text-sm"
              >
                <summary class="cursor-pointer text-muted">
                  Fiche du sbire
                </summary>
                <KnCreatureCard
                  class="mt-2"
                  :creature="minion(ability.summons)"
                  :name="ability.summons"
                  :level="character.level"
                />
                <UButton
                  v-if="minion(ability.summons)"
                  class="mt-2"
                  size="xs"
                  variant="soft"
                  icon="i-heroicons:user-plus"
                  @click="addMinion(minion(ability.summons)!)"
                >
                  Ajouter à l'équipe ({{ teamSize }}/6)
                </UButton>
              </details>
            </li>
          </ul>
        </template>
        <p
          v-else
          class="text-sm text-warning"
        >
          La Maîtrise « {{ entry.key }} » n'est plus dans le contenu chargé.
        </p>
      </article>

      <div
        v-if="character.masteryPicks.length < KN_MAX_TRAINED_MASTERIES"
        class="space-y-2"
      >
        <p class="text-sm font-medium">
          Choisir une Maîtrise
        </p>
        <KnAddPicker
          :items="availableItems"
          placeholder="Choisir une Maîtrise (1 point)"
          class="w-full sm:w-96"
          :disabled="unspent < 1"
          @pick="pickMastery"
        />
        <p
          v-if="unspent < 1"
          class="text-xs text-muted"
        >
          Aucun point d'Aptitude à dépenser.
        </p>
      </div>

      <KnAmuletsPanel
        v-model:character="character"
        :masteries
      />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knLockAmuletTier, knMasteryEntries, knUnlockAmuletTier, type KnMasteryEntry } from '~~/shared/ker-nethalas/amulets'
import {
  KN_MASTERY_TIERS,
  KN_MAX_TRAINED_MASTERIES,
  knAbilityPointsUnspent,
  knLockMastery,
  knUnlockMastery,
  type KnMastery,
} from '~~/shared/ker-nethalas/masteries'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

type Entry = KnMasteryEntry

const props = defineProps<{
  masteries: KnMastery[] | null
  bestiary: KnCreature[] | null
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const find = (key: string) => props.masteries?.find(mastery => mastery.key === key)

const { minions: team, addMinion } = useKnCombat(character, () => props.resolved, () => props.bestiary)
const teamSize = computed(() => team.value.length)

const minion = (key: string) => props.bestiary?.find(creature => creature.key === key)

const unspent = computed(() => knAbilityPointsUnspent(character.value.level, character.value.masteryPicks, character.value.amulets.tiers))

const entries = computed(() => knMasteryEntries(character.value.masteryPicks, character.value.amulets))

const availableItems = computed<SelectItem[]>(() =>
  (props.masteries ?? [])
    .filter(mastery => !character.value.masteryPicks.some(pick => pick.key === mastery.key))
    .map(mastery => ({ label: mastery.name, value: mastery.key })),
)

function unlock(entry: Entry) {
  const { level, masteryPicks, amulets } = character.value
  if (entry.amulet) character.value.amulets = knUnlockAmuletTier(amulets, masteryPicks, level)
  else character.value.masteryPicks = knUnlockMastery(masteryPicks, entry.key, level, amulets.tiers)
}

function lock(entry: Entry) {
  if (entry.amulet) character.value.amulets = knLockAmuletTier(character.value.amulets)
  else character.value.masteryPicks = knLockMastery(character.value.masteryPicks, entry.key)
}

function pickMastery(key: string | number) {
  if (typeof key === 'string' && find(key)) unlock({ key, tiers: 0, amulet: false })
}
</script>
