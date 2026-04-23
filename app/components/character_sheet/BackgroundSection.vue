<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-sm text-muted uppercase tracking-wide">
        Historique & Description
      </h2>
      <EditBackgroundSection v-model:character-sheet="characterSheet" />
    </div>

    <!-- Historique sélectionné -->
    <div v-if="selectedBackground" class="space-y-3">
      <div class="flex items-center gap-2">
        <span class="font-medium text-sm">{{ selectedBackground.name }}</span>
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="skill in selectedBackground.skillProficiencies"
            :key="skill"
            variant="soft"
            color="primary"
            size="xs"
          >
            {{ getSkillLabel(skill) }}
          </UBadge>
        </div>
      </div>

      <!-- Capacité de l'historique -->
      <UAccordion
        v-if="selectedBackground.featureName"
        :items="[{ label: `Capacité : ${selectedBackground.featureName}`, content: selectedBackground.featureDescription }]"
        variant="ghost"
        class="text-sm"
      />
    </div>

    <div
      v-else
      class="text-sm text-muted italic"
    >
      Aucun historique sélectionné.
      <EditBackgroundSection v-model:character-sheet="characterSheet" />
    </div>

    <!-- Champs de description du personnage -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Traits de personnalité">
        <UTextarea
          v-model="personalityTraits"
          :rows="3"
          placeholder="Décris les traits de personnalité de ton personnage..."
        />
      </UFormField>

      <UFormField label="Idéaux">
        <UTextarea
          v-model="ideals"
          :rows="3"
          placeholder="Quels idéaux guide ton personnage ?"
        />
      </UFormField>

      <UFormField label="Liens">
        <UTextarea
          v-model="bonds"
          :rows="3"
          placeholder="Quels liens unissent ton personnage au monde ?"
        />
      </UFormField>

      <UFormField label="Défauts">
        <UTextarea
          v-model="flaws"
          :rows="3"
          placeholder="Quels sont les défauts ou faiblesses de ton personnage ?"
        />
      </UFormField>
    </div>
  </div>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()

const {
  selectedBackground,
  personalityTraits,
  ideals,
  bonds,
  flaws,
} = useCharacterSheet(characterSheet)

const skillKeyLabels: Record<string, string> = {
  athletics: t('skills.str.athletics'),
  acrobatics: t('skills.dex.acrobatics'),
  sleight_of_hand: t('skills.dex.sleight_of_hand'),
  stealth: t('skills.dex.stealth'),
  arcana: t('skills.int.arcana'),
  history: t('skills.int.history'),
  investigation: t('skills.int.investigation'),
  nature: t('skills.int.nature'),
  religion: t('skills.int.religion'),
  animal_handling: t('skills.wis.animal_handling'),
  insight: t('skills.wis.insight'),
  medicine: t('skills.wis.medicine'),
  perception: t('skills.wis.perception'),
  survival: t('skills.wis.survival'),
  deception: t('skills.cha.deception'),
  intimidation: t('skills.cha.intimidation'),
  performance: t('skills.cha.performance'),
  persuasion: t('skills.cha.persuasion'),
}

const getSkillLabel = (key: string): string => skillKeyLabels[key] ?? key
</script>
