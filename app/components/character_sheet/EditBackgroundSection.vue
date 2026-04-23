<template>
  <USlideover
    v-model:open="open"
    :dismissible="false"
    title="Historique du personnage"
  >
    <UButton
      icon="i-heroicons:pencil-square"
      variant="ghost"
      size="xs"
      color="neutral"
    />

    <template #body>
      <div class="space-y-6">
        <!-- Sélection de l'historique -->
        <UFormField label="Historique">
          <USelect
            v-model="selectedId"
            :items="backgroundItems"
            placeholder="Choisir un historique..."
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <!-- Formulaire custom -->
        <template v-if="isCustom">
          <div class="space-y-4 border border-dashed rounded-lg p-4">
            <p class="text-xs text-muted font-medium uppercase tracking-wide">
              Historique personnalisé
            </p>

            <UFormField label="Nom de l'historique">
              <UInput
                v-model="customForm.name"
                placeholder="Ex : Chasseur de prime..."
              />
            </UFormField>

            <UFormField label="Description">
              <UTextarea
                v-model="customForm.description"
                :rows="3"
                placeholder="Description de l'historique..."
              />
            </UFormField>

            <UFormField label="Compétences maîtrisées">
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="skill in allSkillKeys"
                  :key="skill.key"
                  class="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="skill.key"
                    :checked="customForm.skillProficiencies.includes(skill.key)"
                    @change="toggleSkill(skill.key)"
                  >
                  {{ skill.label }}
                </label>
              </div>
            </UFormField>

            <UFormField label="Capacité">
              <UInput
                v-model="customForm.featureName"
                placeholder="Nom de la capacité..."
                class="mb-2"
              />
              <UTextarea
                v-model="customForm.featureDescription"
                :rows="3"
                placeholder="Description de la capacité..."
              />
            </UFormField>
          </div>
        </template>

        <!-- Aperçu du background sélectionné -->
        <template v-else-if="previewBackground">
          <div class="space-y-3 bg-elevated rounded-lg p-4">
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="skill in previewBackground.skillProficiencies"
                :key="skill"
                variant="soft"
                color="primary"
                size="sm"
              >
                {{ getSkillLabel(skill) }}
              </UBadge>
            </div>
            <div v-if="previewBackground.featureName">
              <p class="text-xs font-medium text-muted">
                Capacité : {{ previewBackground.featureName }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ previewBackground.featureDescription }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          @click="open = false"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          :disabled="isCustom && !customForm.name.trim()"
          @click="handleSubmit"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { Background } from '~/composables/character/useCharacterBackground'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()

const {
  backgrounds,
  selectedBackground,
  setBackground,
  createCustomBackground,
} = useCharacterSheet(characterSheet)

const open = ref(false)
const saving = ref(false)

const CUSTOM_VALUE = '__custom__'

const selectedId = ref<number | string | null>(null)

watch(open, (val) => {
  if (val) {
    selectedId.value = selectedBackground.value?.id ?? null
    resetCustomForm()
  }
})

const isCustom = computed(() => selectedId.value === CUSTOM_VALUE)

const previewBackground = computed<Background | null>(() => {
  if (!selectedId.value || selectedId.value === CUSTOM_VALUE) return null
  return backgrounds.value.find(b => b.id === selectedId.value) ?? null
})

const backgroundItems = computed(() => [
  { label: 'Aucun historique', value: null },
  ...backgrounds.value.map(b => ({
    label: b.characterSheetId ? `${b.name} (custom)` : b.name,
    value: b.id,
  })),
  { label: '+ Créer un historique personnalisé', value: CUSTOM_VALUE },
])

// ─── Custom form ───────────────────────────────────────────────────────────────

const customForm = reactive({
  name: '',
  description: '',
  skillProficiencies: [] as string[],
  featureName: '',
  featureDescription: '',
})

const resetCustomForm = () => {
  customForm.name = ''
  customForm.description = ''
  customForm.skillProficiencies = []
  customForm.featureName = ''
  customForm.featureDescription = ''
}

const toggleSkill = (key: string) => {
  const idx = customForm.skillProficiencies.indexOf(key)
  if (idx === -1) customForm.skillProficiencies.push(key)
  else customForm.skillProficiencies.splice(idx, 1)
}

// ─── Skill labels ──────────────────────────────────────────────────────────────

const allSkillKeys = [
  { key: 'athletics', label: t('skills.str.athletics') },
  { key: 'acrobatics', label: t('skills.dex.acrobatics') },
  { key: 'sleight_of_hand', label: t('skills.dex.sleight_of_hand') },
  { key: 'stealth', label: t('skills.dex.stealth') },
  { key: 'arcana', label: t('skills.int.arcana') },
  { key: 'history', label: t('skills.int.history') },
  { key: 'investigation', label: t('skills.int.investigation') },
  { key: 'nature', label: t('skills.int.nature') },
  { key: 'religion', label: t('skills.int.religion') },
  { key: 'animal_handling', label: t('skills.wis.animal_handling') },
  { key: 'insight', label: t('skills.wis.insight') },
  { key: 'medicine', label: t('skills.wis.medicine') },
  { key: 'perception', label: t('skills.wis.perception') },
  { key: 'survival', label: t('skills.wis.survival') },
  { key: 'deception', label: t('skills.cha.deception') },
  { key: 'intimidation', label: t('skills.cha.intimidation') },
  { key: 'performance', label: t('skills.cha.performance') },
  { key: 'persuasion', label: t('skills.cha.persuasion') },
]

const getSkillLabel = (key: string): string =>
  allSkillKeys.find(s => s.key === key)?.label ?? key

// ─── Submit ────────────────────────────────────────────────────────────────────

const handleSubmit = async () => {
  saving.value = true
  try {
    if (isCustom.value) {
      const created = await createCustomBackground({
        name: customForm.name,
        description: customForm.description,
        skillProficiencies: customForm.skillProficiencies,
        toolProficiencies: [],
        languageProficiencies: [],
        featureName: customForm.featureName,
        featureDescription: customForm.featureDescription,
      })
      if (created) await setBackground(created.id)
    } else {
      await setBackground(selectedId.value as number | null)
    }
    open.value = false
  } finally {
    saving.value = false
  }
}
</script>
