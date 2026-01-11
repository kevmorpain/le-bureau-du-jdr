<template>
  <div v-if="characterSheet">
    <div class="md:flex gap-x-4 space-y-4">
      <div>
        <p>Nom du personnage</p>
        <p>{{ characterSheet.name }}</p>
      </div>
    </div>

    <div class="md:flex gap-x-4 space-y-4">
      <UFormField label="Classe">
        <UInput
          v-model="mainClass"
          placeholder="Entrez la classe de votre personnage"
          class="w-32"
        />
      </UFormField>

      <UFormField label="Niveau de personnage">
        <UInput
          v-model="characterLevel"
          type="number"
          min="1"
          max="20"
          class="w-14"
        />
      </UFormField>

      <div class="w-32">
        <p>Espèce</p>
        <p>{{ species?.name }}</p>
      </div>
    </div>

    <div class="md:flex gap-x-4 space-y-4">
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
      <ul class="flex flex-wrap justify-between gap-4 text-center">
        <li
          v-for="level in 9"
          :key="level"
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
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: characterSheetData } = await useFetch<CharacterSheet>('/api/character_sheets', {
  query: { id },
})

if (!characterSheetData.value) {
  throw new Error('Character sheet not found')
}

const characterSheet = ref(characterSheetData.value)

const {
  abilityScores,
  abilityModifiers,
  characterLevel,
  proficiencyBonus,
  spellcastingAbility,
  spellAttackModifier,
  spellSaveDC,
  spellSlots,
  mainClass,
  species,
  background,
  armorClass,
  speed,
  formatModifier,
} = useCharacterSheet(characterSheet)

const { tm, rt } = useI18n()

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

watch(() => characterSheet.value?.alignment, (newAlignment, prevAlignment) => {
  if (newAlignment && newAlignment !== prevAlignment) {
    handleSaveAlignment()
  }
})

const toaster = useToast()

const handleSaveAlignment = async () => {
  try {
    if (!characterSheet.value) return

    await $fetch(`/api/character_sheets/${id.value}/alignment`, {
      method: 'PUT',
      body: {
        alignment: characterSheet.value.alignment,
      },
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
