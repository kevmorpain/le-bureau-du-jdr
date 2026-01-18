<template>
  <div v-if="characterSheet">
    <UPageHeader>
      <template #title>
        {{ characterSheetTitle }}
      </template>

      <template #description>
        <div>
          <p>
            {{ characterSheetDescription }}
            <ClassesSection v-model:character-sheet="characterSheet" />
          </p>
        </div>
        <p class="text-toned">
          Niveau {{ characterLevel }}
        </p>
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="md:flex gap-x-4">
        <UFormField label="Historique">
          <UInput
            v-model="background"
            placeholder="Entrez l'historique de votre personnage"
            class="w-32"
          />
        </UFormField>

        <UFormField label="Alignement">
          <USelect
            v-model="characterSheet.alignment"
            :items="alignmentItems"
            placeholder="Choisissez l'alignement de votre personnage"
            class="w-32"
            value-key="value"
          />
        </UFormField>
      </div>

      <div class="md:flex gap-x-12 space-y-4">
        <ul class="md:flex items-center justify-between text-center max-w-min gap-x-2">
          <li
            v-for="(_, key) in abilityScores"
            :key
            class="px-2 space-y-1"
          >
            <p
              class="font-semibold"
              :class="{
                'text-primary flex items-center gap-x-1': key === spellcastingAbility,
              }"
            >
              {{ $t(`ability_scores.${key}`) }}

              <StarsIcon
                v-if="key === spellcastingAbility"
                class="flex-none size-4"
              />
            </p>

            <UInput
              v-model="abilityScores[key]"
              :name="key"
              type="number"
              class="w-14"
            />

            <p>{{ formatModifier(abilityModifiers[key]!) }}</p>
          </li>
        </ul>

        <div class="md:flex gap-x-4 space-y-4">
          <div>
            <p>Bonus de maîtrise</p>
            <p>{{ formatModifier(proficiencyBonus) }}</p>
          </div>

          <UFormField label="Classe d'armure">
            <UInput
              v-model="armorClass"
              type="number"
              min="0"
              class="w-14"
            />
          </UFormField>

          <div>
            <p>Vitesse</p>
            <p>{{ speed }} m</p>
          </div>
        </div>
      </div>

      <div
        v-if="spellcastingAbility"
        class="md:flex gap-x-4 space-y-4"
      >
        <UFormField label="Caractéristique d'incantation">
          <USelect
            v-model="spellcastingAbility"
            :items="spellcastingAbilityOptions"
            placeholder="Sélectionnez une caractéristique"
            class="min-w-32"
          />
        </UFormField>

        <div>
          <p>DD de sauvegarde des sorts</p>
          <p>{{ spellSaveDC }}</p>
        </div>

        <div>
          <p>Bonus d'attaque avec un sort</p>
          <p>{{ formatModifier(spellAttackModifier) }}</p>
        </div>
      </div>

      <div class="col-span-2">
        <p>Emplacements de sort</p>
        <ul class="space-y-4">
          <li
            v-for="level in 9"
            :key="level"
            class="flex items-center gap-x-2"
          >
            <p>{{ level }}</p>

            <div class="flex items-center gap-1">
              <UButton
                icon="heroicons:minus-16-solid"
                variant="ghost"
                :disabled="spellSlots[level]!.max <= 0"
                @click="decrementMaxSpellSlot(level)"
              />

              <div
                v-if="spellSlots[level]!.max === 0"
                class="border border-dashed size-4 rounded-full opacity-50"
              />

              <ul class="flex items-center gap-1 group pointer-events-none">
                <li
                  v-for="n in spellSlots[level]!.max"
                  :key="n"
                  class="pointer-events-auto border size-4 rounded-full hover:bg-primary/50 group-hover:bg-primary/50 peer peer-hover:bg-transparent"
                  :class="{
                    'bg-primary': n <= spellSlots[level]!.current,
                  }"
                  @click="setCurrentSpellSlot(level, n)"
                />
              </ul>

              <UButton
                icon="heroicons:plus-16-solid"
                variant="ghost"
                @click="spellSlots[level]!.max++"
              />
            </div>
          </li>
        </ul>
      </div>
    </UPageBody>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: characterSheetData } = await useFetch<CharacterSheet>(() => `/api/character_sheets/${id.value}`)

if (!characterSheetData.value) {
  throw new Error('Character sheet not found')
}

const characterSheet = ref(characterSheetData.value)

const {
  abilityScores,
  abilityModifiers,
  characterLevel,
  mainClass,
  multiClass,
  proficiencyBonus,
  spellcastingAbility,
  spellAttackModifier,
  spellSaveDC,
  spellSlots,
  species,
  background,
  armorClass,
  speed,
  formatModifier,
} = useCharacterSheet(characterSheet)

const { tm, rt } = useI18n()

const characterSheetTitle = computed<string>(() => characterSheet.value?.name ?? 'Personnage sans nom')
const characterSheetDescription = computed<string>(() => {
  const characterClassesText = [mainClass.value, ...multiClass.value].filter(Boolean).map(cls => `${cls.name} ${cls.level}`).join(', ')

  const characterSpecies = species.value?.name ?? 'd\'une espèce inconnue'

  return [characterClassesText, characterSpecies].join(' ')
})

const spellcastingAbilityOptions = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('ability_scores')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})

const alignmentItems = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('alignments')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})

const decrementMaxSpellSlot = (level: number) => {
  if (spellSlots.value[level]!.max > 0) {
    spellSlots.value[level]!.max--

    if (spellSlots.value[level]!.current > spellSlots.value[level]!.max) {
      spellSlots.value[level]!.current = spellSlots.value[level]!.max
    }
  }
}

const setCurrentSpellSlot = (level: number, n: number) => {
  if (n === spellSlots.value[level]!.current) {
    spellSlots.value[level]!.current--
  } else if (n <= spellSlots.value[level]!.max) {
    spellSlots.value[level]!.current = n
  }
}

watch(characterSheet, () => {
  updateCharacterSheet()
}, {
  deep: true,
})

const toaster = useToast()

const updateCharacterSheet = async () => {
  try {
    if (!characterSheet.value) return

    await $fetch(`/api/character_sheets/${id.value}`, {
      method: 'PUT',
      body: characterSheet.value,
    })

    toaster.add({
      title: 'Fiche de personnage sauvegardée',
      color: 'success',
    })
  } catch (error) {
    console.error('Error saving character sheet:', error)
  }
}
</script>
