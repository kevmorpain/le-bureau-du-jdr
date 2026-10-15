<template>
  <div
    v-if="abilities.length"
    class="space-y-3 rounded-md border border-default p-3"
  >
    <h3 class="font-medium">
      Aptitudes de Maîtrise
    </h3>
    <ul class="space-y-3">
      <li
        v-for="entry in abilities"
        :key="`${entry.masteryKey}:${entry.ability.tier}`"
      >
        <p class="flex flex-wrap items-center gap-2 text-sm font-medium">
          {{ entry.ability.name }}
          <span class="text-xs font-normal text-muted">{{ entry.masteryName }} · {{ entry.ability.action }}{{ entry.ability.cost ? ` · ${entry.ability.cost}` : '' }}</span>
        </p>
        <p class="text-sm">
          {{ entry.ability.text }}
        </p>
        <KnAbilityUse
          v-model:character="character"
          :ability="entry.ability"
          :mastery-key="entry.masteryKey"
          :resolved
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { knAbilityIsUsable } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  masteries: KnMastery[] | null
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const abilities = computed(() =>
  knMasteryEntries(character.value.masteryPicks, character.value.amulets).flatMap((entry) => {
    const mastery = props.masteries?.find(candidate => candidate.key === entry.key)
    return (mastery?.abilities ?? [])
      .filter(ability => ability.tier <= entry.tiers && knAbilityIsUsable(ability))
      .map(ability => ({ masteryKey: entry.key, masteryName: mastery!.name, ability }))
  }),
)
</script>
