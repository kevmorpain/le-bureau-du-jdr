<template>
  <DsConcentration
    v-if="isConcentrating && concentrationName"
    :spell="concentrationName"
    :remaining="remaining"
    :is-inline="isInline"
  />
</template>

<script lang="ts" setup>
const { characterSheet, isInline = false } = defineProps<{ characterSheet: CharacterSheet, isInline?: boolean }>()

const { t } = useI18n()

const { isConcentrating, concentrationName, concentratingSpellId, temporaryEffects } = useCharacterSheet(toRef(() => characterSheet))

const remaining = computed(() => {
  const rounds = temporaryEffects.value.find(e => e.concentration && e.spellId === concentratingSpellId.value)?.countdown?.remaining
  return rounds ? t('sheet.rail.rounds', rounds) : undefined
})
</script>
