<template>
  <USlideover
    v-model:open="open"
    title="Ajouter un don"
    :ui="{ body: 'overflow-y-auto' }"
  >
    <template #body>
      <div class="space-y-4 p-4">
        <!-- Recherche -->
        <UInput
          v-model="search"
          icon="i-heroicons:magnifying-glass"
          placeholder="Rechercher un don..."
        />

        <!-- Liste des dons disponibles -->
        <div class="space-y-1.5 max-h-72 overflow-y-auto">
          <button
            v-for="feat in filteredFeats"
            :key="feat.id"
            class="w-full text-left rounded-lg p-3 ring transition-colors"
            :class="selectedId === feat.id
              ? 'ring-primary bg-elevated'
              : 'ring-default hover:bg-elevated'"
            @click="select(feat.id)"
          >
            <div class="flex items-center gap-2">
              <UIcon
                :name="selectedId === feat.id ? 'i-heroicons:check-circle-solid' : 'i-heroicons:plus-circle'"
                :class="['size-4 shrink-0', selectedId === feat.id ? 'text-primary' : 'text-muted']"
              />
              <span class="flex-1 font-medium text-sm">{{ feat.name }}</span>
            </div>
            <p class="text-sm text-muted mt-1 leading-snug">{{ feat.description }}</p>
          </button>

          <p
            v-if="filteredFeats.length === 0"
            class="text-sm text-muted text-center py-6"
          >
            Aucun don disponible.
          </p>
        </div>

        <!-- Choix de caractéristique (si le don en demande un) -->
        <div
          v-if="selectedFeat && needsAbilityChoice"
          class="rounded-lg ring ring-primary/40 bg-primary/5 p-3 space-y-2"
        >
          <p class="text-sm font-medium">
            Caractéristique à augmenter (+1)
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="ab in allowedAbilityOptions"
              :key="ab.value"
              type="button"
              class="py-2 rounded-lg ring text-sm font-semibold transition-colors"
              :class="chosenAbility === ab.value
                ? 'ring-primary bg-primary/10 text-primary'
                : 'ring-default text-muted hover:bg-elevated'"
              @click="chosenAbility = ab.value"
            >
              {{ ab.label }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton variant="ghost" @click="open = false">
          Annuler
        </UButton>
        <UButton
          :disabled="!canSubmit"
          :loading="submitting"
          @click="submit"
        >
          Ajouter le don
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

const props = defineProps<{
  characterSheetId: number
  // featureIds déjà possédés par le perso (pour les exclure de la liste).
  ownedFeatureIds: number[]
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  added: []
}>()

const { feats } = useFeats()
const toast = useToast()

const ABILITY_OPTIONS: { label: string, value: AbilityKey }[] = [
  { label: 'FOR', value: 'str' },
  { label: 'DEX', value: 'dex' },
  { label: 'CON', value: 'con' },
  { label: 'INT', value: 'int' },
  { label: 'SAG', value: 'wis' },
  { label: 'CHA', value: 'cha' },
]

const search = ref('')
const selectedId = ref<number | null>(null)
const chosenAbility = ref<AbilityKey | null>(null)
const submitting = ref(false)

const ownedSet = computed(() => new Set(props.ownedFeatureIds))

const filteredFeats = computed(() => {
  const q = search.value.trim().toLowerCase()
  return feats.value
    .filter(f => !ownedSet.value.has(f.id))
    .filter(f => !q || f.name.toLowerCase().includes(q))
})

const selectedFeat = computed(() => feats.value.find(f => f.id === selectedId.value) ?? null)

const needsAbilityChoice = computed(() =>
  (selectedFeat.value?.effects ?? []).some((e: any) => e.type === 'ability_increase_choice'),
)

// Caractéristiques réellement proposées par le don (FOR/DEX pour Athlète, etc.).
const allowedAbilityOptions = computed(() => {
  const allowed = featAllowedAbilities(selectedFeat.value?.effects)
  return ABILITY_OPTIONS.filter(o => allowed.includes(o.value))
})

const canSubmit = computed(() => {
  if (selectedId.value == null) return false
  if (needsAbilityChoice.value && !chosenAbility.value) return false
  return true
})

function select(id: number) {
  selectedId.value = id
  chosenAbility.value = null
}

async function submit() {
  if (!canSubmit.value || selectedId.value == null) return
  submitting.value = true
  try {
    await $fetch(`/api/character_sheets/${props.characterSheetId}/feats`, {
      method: 'POST',
      body: {
        featureId: selectedId.value,
        source: 'bonus',
        choices: needsAbilityChoice.value ? { ability: chosenAbility.value } : null,
      },
    })
    emit('added')
    toast.add({ title: 'Don ajouté', color: 'success' })
    open.value = false
    selectedId.value = null
    chosenAbility.value = null
    search.value = ''
  }
  catch (e) {
    console.error('[feats] add error:', e)
    toast.add({ title: 'Erreur lors de l\'ajout du don', color: 'error' })
  }
  finally {
    submitting.value = false
  }
}
</script>
