<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Fin de combat
      </h2>
      <p class="text-sm text-muted">
        Remet à zéro les aptitudes « une fois par combat ». Une victoire donne aussi l'expérience du livre et les gains de vos
        Maîtrises.
      </p>
    </template>

    <div class="flex flex-wrap gap-3">
      <UButton @click="win('combat')">
        Combat remporté (+{{ KN_COMBAT_XP.combat }} XP)
      </UButton>
      <UButton
        variant="soft"
        @click="win('overseer')"
      >
        Overseer vaincu (+{{ KN_COMBAT_XP.overseer }} XP)
      </UButton>
      <UButton
        variant="ghost"
        color="neutral"
        @click="endCombat"
      >
        Combat terminé sans victoire
      </UButton>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_COMBAT_XP } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  masteries: KnMastery[] | null
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { win, endCombat } = useKnCombatEnd(character, () => props.resolved, () => props.masteries)
</script>
