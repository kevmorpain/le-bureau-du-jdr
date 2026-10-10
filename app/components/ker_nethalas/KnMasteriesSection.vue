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
        v-for="pick in character.masteryPicks"
        :key="pick.key"
        class="space-y-3 rounded-md border border-default p-3"
      >
        <template v-if="find(pick.key)">
          <header class="flex flex-wrap items-center gap-3">
            <h3 class="flex-1 text-lg font-semibold">
              {{ find(pick.key)!.name }}
              <UBadge
                v-if="pick.amulet"
                label="Amulette"
                color="warning"
                variant="subtle"
                size="md"
                class="ml-2 align-middle"
              />
              <UBadge
                :label="`${pick.tiers} / ${KN_MASTERY_TIERS}`"
                variant="subtle"
                size="md"
                class="ml-2 align-middle"
              />
            </h3>
            <UButton
              size="sm"
              :disabled="unspent < 1 || pick.tiers >= KN_MASTERY_TIERS"
              @click="unlock(pick.key)"
            >
              Débloquer le palier {{ pick.tiers + 1 }}
            </UButton>
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              :disabled="pick.amulet && pick.tiers === 0"
              :aria-label="`Reprendre le dernier palier de ${find(pick.key)!.name}`"
              @click="lock(pick.key)"
            >
              Reprendre un palier
            </UButton>
          </header>

          <p class="text-sm text-muted">
            {{ find(pick.key)!.summary }}
          </p>

          <p class="rounded-md bg-elevated p-2 text-sm">
            <span class="font-medium">{{ find(pick.key)!.feature.name }}.</span> {{ find(pick.key)!.feature.text }}
          </p>

          <ul class="space-y-3">
            <li
              v-for="ability in find(pick.key)!.abilities"
              :key="ability.tier"
              :class="ability.tier <= pick.tiers ? '' : 'opacity-50'"
            >
              <p class="flex flex-wrap items-center gap-2 text-sm font-medium">
                <UIcon
                  :name="ability.tier <= pick.tiers ? 'i-heroicons:lock-open' : 'i-heroicons:lock-closed'"
                  class="size-4"
                  :class="ability.tier <= pick.tiers ? 'text-success' : 'text-muted'"
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
            </li>
          </ul>
        </template>
        <p
          v-else
          class="text-sm text-warning"
        >
          La Maîtrise « {{ pick.key }} » n'est plus dans le contenu chargé.
        </p>
      </article>

      <div
        v-if="trainedCount < KN_MAX_TRAINED_MASTERIES"
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

      <div class="space-y-2 rounded-md border border-default p-3">
        <p class="text-sm font-medium">
          Amulette
        </p>
        <p class="text-xs text-muted">
          Une amulette donne accès à une troisième Maîtrise, dont le trait est actif tant qu'elle est portée. Les paliers
          débloqués avec l'amulette restent les mêmes quand on en change, ce qui ne se fait qu'au camp.
        </p>
        <KnAddPicker
          :items="amuletItems"
          :placeholder="amulet ? 'Changer d\'amulette (au camp)' : 'Ajouter une amulette'"
          class="w-full sm:w-96"
          @pick="pickAmulet"
        />
        <UButton
          v-if="amulet && amulet.tiers === 0"
          size="sm"
          variant="ghost"
          color="neutral"
          @click="dropAmulet"
        >
          Retirer l'amulette
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import {
  KN_MASTERY_TIERS,
  KN_MAX_TRAINED_MASTERIES,
  knAbilityPointsUnspent,
  knAddAmulet,
  knAmuletPick,
  knCanWearAmulet,
  knDropAmulet,
  knLockMastery,
  knSwapAmulet,
  knUnlockMastery,
  type KnMastery,
} from '~~/shared/ker-nethalas/masteries'

const props = defineProps<{
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const find = (key: string) => props.masteries?.find(mastery => mastery.key === key)

const unspent = computed(() => knAbilityPointsUnspent(character.value.level, character.value.masteryPicks))

const availableItems = computed<SelectItem[]>(() =>
  (props.masteries ?? [])
    .filter(mastery => !character.value.masteryPicks.some(pick => pick.key === mastery.key))
    .map(mastery => ({ label: mastery.name, value: mastery.key })),
)

const trainedCount = computed(() => character.value.masteryPicks.filter(pick => !pick.amulet).length)
const amulet = computed(() => knAmuletPick(character.value.masteryPicks))

const amuletItems = computed<SelectItem[]>(() =>
  (props.masteries ?? [])
    .filter(mastery => mastery.key !== amulet.value?.key && knCanWearAmulet(character.value.masteryPicks, mastery.key))
    .map(mastery => ({ label: mastery.name, value: mastery.key })),
)

const dropAmulet = () => {
  character.value.masteryPicks = knDropAmulet(character.value.masteryPicks)
}

function pickAmulet(key: string | number) {
  if (typeof key !== 'string' || !find(key)) return
  character.value.masteryPicks = amulet.value
    ? knSwapAmulet(character.value.masteryPicks, key)
    : knAddAmulet(character.value.masteryPicks, key)
}

const unlock = (key: string) => {
  character.value.masteryPicks = knUnlockMastery(character.value.masteryPicks, key, character.value.level)
}

const lock = (key: string) => {
  character.value.masteryPicks = knLockMastery(character.value.masteryPicks, key)
}

function pickMastery(key: string | number) {
  if (typeof key === 'string' && find(key)) unlock(key)
}
</script>
