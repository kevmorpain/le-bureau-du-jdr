<template>
  <header class="sticky top-0 z-40 bg-elevated border-b border-default shadow-sm">
    <div class="flex items-center gap-4 px-5 py-2.5 flex-wrap">
      <UButton
        to="/"
        icon="i-heroicons:home"
        variant="ghost"
        color="neutral"
        size="sm"
        class="shrink-0"
        aria-label="Retour à l'accueil"
      />

      <!-- Portrait : seule surface où il est rendu sur la fiche, visible quelle que
           soit la section ouverte. Son URL s'édite dans EditIdentitySlideover. -->
      <img
        v-if="portraitSrc && !portraitFailed"
        :src="portraitSrc"
        :alt="`Portrait de ${characterSheet.name ?? 'personnage'}`"
        class="size-9 rounded-lg object-cover border border-default shrink-0"
        @error="portraitFailed = true"
      >

      <div class="shrink-0">
        <div class="flex items-baseline gap-2">
          <h1 class="text-lg font-bold">
            {{ characterSheet.name ?? 'Personnage sans nom' }}
          </h1>
          <span class="text-sm text-muted">Niv. {{ characterLevel }}</span>
          <UButton
            variant="ghost"
            size="xs"
            color="neutral"
            icon="i-heroicons:chevron-double-up"
            :to="`/characters/${characterSheet.id}/level-up`"
          />
        </div>
        <p class="text-xs text-muted/70 mt-0.5 flex items-center gap-1 flex-wrap">
          <span>{{ characterDescriptionPrefix }}</span>
          <span v-if="classesText">{{ classesText }}</span>
        </p>
      </div>

      <div
        v-if="activeConditions.length"
        class="flex flex-wrap gap-1"
      >
        <UBadge
          v-for="condition in activeConditions"
          :key="condition"
          color="primary"
          variant="subtle"
          size="md"
          class="cursor-pointer"
          @click="toggleCondition(condition)"
        >
          {{ conditionLabels[condition] }}
          <UIcon
            name="i-heroicons:x-mark-16-solid"
            class="size-3 ml-0.5"
          />
        </UBadge>
      </div>

      <div class="flex items-center gap-2 ml-auto flex-wrap">
        <ClientOnly>
          <SyncStatus />
        </ClientOnly>
        <UPopover :content="{ side: 'bottom', align: 'end' }">
          <UButton
            icon="i-heroicons:cog-6-tooth"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="Préférences"
          />
          <template #content>
            <div class="w-80 p-3 space-y-3">
              <p class="text-xs font-bold uppercase tracking-widest text-muted">
                Préférences de cette fiche
              </p>
              <UFormField
                v-for="key in PREFERENCE_KEYS"
                :key
                :label="PREFERENCES[key].label"
                :description="PREFERENCES[key].description"
              >
                <USelect
                  :model-value="choiceOf(key)"
                  :items="choicesFor(key)"
                  size="sm"
                  class="w-full"
                  :aria-label="PREFERENCES[key].label"
                  @update:model-value="choice => choose(key, choice as Choice)"
                />
              </UFormField>
              <p class="text-xs text-muted">
                Les défauts valables pour toutes vos fiches se règlent depuis le menu du compte.
              </p>
            </div>
          </template>
        </UPopover>
        <UButton
          icon="i-game-icons:forest-camp"
          variant="outline"
          size="sm"
          :loading="isResting"
          @click="$emit('shortRest')"
        >
          Repos court
        </UButton>
        <UButton
          icon="i-game-icons:night-sleep"
          variant="outline"
          size="sm"
          :loading="isResting"
          @click="askLongRest"
        >
          Repos long
        </UButton>
        <UButton
          icon="i-game-icons:sunrise"
          variant="ghost"
          size="sm"
          :loading="isResting"
          @click="$emit('dawn')"
        >
          Aube
        </UButton>
        <UButton
          icon="i-game-icons:crossed-swords"
          size="sm"
          :variant="combatMode ? 'solid' : 'outline'"
          color="secondary"
          @click="$emit('toggleCombat')"
        >
          {{ combatMode ? 'Combat actif' : 'Mode Combat' }}
        </UButton>
      </div>
    </div>
  </header>

  <ConfirmActionModal
    v-model:open="confirmingLongRest"
    title="Terminer un repos long ?"
    confirm-label="Terminer le repos long"
    confirm-icon="i-game-icons:night-sleep"
    @confirm="$emit('longRest', fedAndWatered)"
  >
    <p class="text-muted">
      Rend les points de vie, les emplacements de sorts, les aptitudes et les dés de vie ; les PV temporaires disparaissent.
      Cette action n'a pas d'annulation.
    </p>
    <UCheckbox
      v-if="exhaustionLevel > 0"
      v-model="fedAndWatered"
      :label="`Le personnage a mangé et bu : l'épuisement passe du niveau ${exhaustionLevel} au niveau ${exhaustionLevel - 1}`"
    />
  </ConfirmActionModal>
</template>

<script lang="ts" setup>
import { PREFERENCES, PREFERENCE_KEYS, type PreferenceKey } from '~~/shared/rules/preferences'
import { conditionLabels } from '~~/shared/utils/labels'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

defineProps<{
  isResting: boolean
  combatMode: boolean
  roll: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

defineEmits<{
  shortRest: []
  longRest: [fedAndWatered: boolean]
  dawn: []
  toggleCombat: []
}>()

const {
  characterLevel,
  activeConditions,
  toggleCondition,
  exhaustionLevel,
  mainClass,
  multiClass,
  species,
  selectedBackground,
  portraitSrc,
  ownPreferences,
  accountPreferences,
  setPreference,
} = useCharacterSheet(characterSheet)

type Choice = 'inherit' | 'on' | 'off'

// Tri-état (D18) : « hérite » n'est pas « non ».
const choiceOf = (key: PreferenceKey): Choice => {
  const own = ownPreferences.value?.[key]
  return own === undefined ? 'inherit' : own ? 'on' : 'off'
}
const choicesFor = (key: PreferenceKey) => [
  { label: `Défaut du compte (${(accountPreferences.value?.[key] ?? PREFERENCES[key].default) ? 'oui' : 'non'})`, value: 'inherit' },
  { label: 'Oui', value: 'on' },
  { label: 'Non', value: 'off' },
]
const choose = (key: PreferenceKey, choice: Choice) => setPreference(key, choice === 'inherit' ? null : choice === 'on')

const confirmingLongRest = ref(false)
// AideDD, Conditions : l'épuisement ne baisse « qu'à condition que la créature ait aussi mangé et bu ».
const fedAndWatered = ref(true)
const askLongRest = () => {
  fedAndWatered.value = true
  confirmingLongRest.value = true
}

// Une URL injoignable ne laisse pas d'icône d'image cassée dans la barre : on masque.
// Le retour à l'utilisateur se fait là où il saisit l'URL (EditIdentitySlideover).
const portraitFailed = ref(false)
watch(portraitSrc, () => {
  portraitFailed.value = false
})

// « Occultiste (Le Grand Ancien) 10 » — la sous-classe est exposée par le read-model.
const classesText = computed(() =>
  [mainClass.value, ...multiClass.value]
    .filter(Boolean)
    .map((cls) => {
      const subclassName = (cls!.subclass as { name?: string } | null | undefined)?.name
      return subclassName
        ? `${cls!.name} (${subclassName}) ${cls!.level}`
        : `${cls!.name} ${cls!.level}`
    })
    .join(', '),
)

const characterDescriptionPrefix = computed(() => {
  const speciesName = species.value?.name ?? ''
  // Lignée choisie (D17) → « Elfe (Drow) ».
  const lineageName = (species.value as { lineageName?: string | null } | undefined)?.lineageName ?? ''
  const speciesLabel = lineageName ? `${speciesName} (${lineageName})` : speciesName
  const backgroundName = selectedBackground.value?.name ?? ''
  const parts = [speciesLabel, backgroundName].filter(Boolean).join(' · ')
  return parts ? `${parts} · ` : ''
})
</script>
