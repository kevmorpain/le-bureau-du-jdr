<template>
  <UCard id="kn-roll">
    <template #header>
      <KnCardHeader title="Jet de dés">
        Choisissez le test : la cible vient du score effectif, la difficulté s'y ajoute, l'Avantage et le Désavantage de la fiche sont lus sur le D100.
      </KnCardHeader>
    </template>

    <KnRollPanel
      v-model:character="character"
      v-model:selected="selected"
      :resolved
    />
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'

defineProps<{
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const selected = defineModel<string>('selected', { default: `skill:${KN_SKILL_KEYS[0]}` })
</script>
