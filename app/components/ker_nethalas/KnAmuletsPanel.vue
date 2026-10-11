<template>
  <div class="space-y-3 rounded-md border border-default p-3">
    <div>
      <p class="text-sm font-medium">
        Amulettes
      </p>
      <p class="text-xs text-muted">
        Une amulette donne accès à une troisième Maîtrise, dont le trait est actif tant qu'elle est portée ; on en trouve en
        butin et elles ne se vendent pas. Une seule se porte, et en changer ne se fait qu'au camp. Les paliers débloqués
        suivent le survivant d'une amulette à l'autre ; une amulette dont la Maîtrise est déjà apprise ne donne rien de plus.
      </p>
    </div>

    <ul
      v-if="amulets.owned.length"
      class="divide-y divide-default rounded-md border border-default"
    >
      <li
        v-for="(key, index) in amulets.owned"
        :key="`${key}-${index}`"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm"
      >
        <span class="flex-1">
          {{ nameOf(key) }}
          <UBadge
            v-if="key === amulets.equipped && isFirstOf(key, index)"
            label="Portée"
            color="success"
            variant="subtle"
            size="md"
            class="ml-2 align-middle"
          />
          <UBadge
            v-if="isTrained(key)"
            label="Maîtrise déjà apprise : sans effet"
            variant="subtle"
            color="neutral"
            size="md"
            class="ml-2 align-middle"
          />
        </span>
        <UButton
          v-if="key === amulets.equipped && isFirstOf(key, index)"
          size="xs"
          variant="ghost"
          color="neutral"
          :aria-label="`Ne plus porter l'amulette ${nameOf(key)}`"
          @click="update(knUnequipAmulet(amulets))"
        >
          Ne plus porter
        </UButton>
        <UButton
          v-else-if="key !== amulets.equipped"
          size="xs"
          variant="soft"
          :aria-label="`Porter l'amulette ${nameOf(key)}`"
          @click="update(knEquipAmulet(amulets, key))"
        >
          Porter
        </UButton>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          :aria-label="`Retirer l'amulette ${nameOf(key)}`"
          @click="update(knRemoveAmulet(amulets, key))"
        >
          Retirer
        </UButton>
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-3">
      <KnAddPicker
        :items="items"
        placeholder="Ajouter une amulette"
        class="w-full sm:w-72"
        :disabled="amulets.owned.length >= KN_MAX_OWNED_AMULETS"
        @pick="add"
      />
      <UButton
        size="sm"
        variant="soft"
        :disabled="amulets.owned.length >= KN_MAX_OWNED_AMULETS || !masteries.length"
        @click="draw"
      >
        Tirer la Maîtrise au D20
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import {
  KN_MAX_OWNED_AMULETS,
  knAddAmulet,
  knEquipAmulet,
  knRandomMasteryKey,
  knRemoveAmulet,
  knUnequipAmulet,
  type KnAmulets,
} from '~~/shared/ker-nethalas/amulets'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

const props = defineProps<{
  masteries: KnMastery[]
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()

const amulets = computed(() => character.value.amulets)

const nameOf = (key: string) => props.masteries.find(mastery => mastery.key === key)?.name ?? key
const isTrained = (key: string) => character.value.masteryPicks.some(pick => pick.key === key)
const isFirstOf = (key: string, index: number) => amulets.value.owned.indexOf(key) === index

const items = computed<SelectItem[]>(() => props.masteries.map(mastery => ({ label: mastery.name, value: mastery.key })))

const update = (next: KnAmulets) => {
  character.value.amulets = next
}

function add(key: string | number) {
  if (typeof key !== 'string' || !props.masteries.some(mastery => mastery.key === key)) return
  update(knAddAmulet(amulets.value, key, character.value.masteryPicks))
}

function draw() {
  const key = knRandomMasteryKey(props.masteries.map(mastery => mastery.key))
  if (key === null) return
  add(key)
  toast.add({ title: `Amulette : ${nameOf(key)}`, color: 'success' })
}
</script>
