<template>
  <div v-if="characterSheet">
    <UPageHeader>
      <template #title>
        {{ characterSheetTitle }}
      </template>

      <template #description>
        <div class="lg:flex lg:justify-between lg:items-center gap-x-4 space-y-2 lg:space-y-0">
          <div>
            <div>
              <p>
                {{ characterSheetDescription }}
                <EditClassesSection v-model:character-sheet="characterSheet" />
              </p>
            </div>
            <p class="text-toned">
              Niveau {{ characterLevel }}
            </p>
          </div>

          <div class="flex items-start gap-1.5">
            <div class="border border-muted rounded-md py-1 px-2">
              <p>Dés de vie</p>
              <ul class="md:flex gap-x-2">
                <li
                  v-for="{ hitDie, count } in hitDice"
                  :key="hitDie"
                >
                  {{ count }}{{ hitDie }}
                </li>
              </ul>
            </div>

            <div class="border border-muted rounded-md py-1 px-2">
              <p>JdS contre la mort</p>

              <div class="grid grid-cols-2 divide-x divide-x-muted">
                <ul
                  v-for="(value, kind) in deathSavingThrows"
                  :key="kind"
                  class="flex items-center gap-1 group pointer-events-none"
                  :class="{
                    'place-self-end pr-2': kind === 'success',
                    'place-self-start pl-2': kind === 'failure',
                  }"
                >
                  <li v-if="kind === 'success'">
                    <UIcon
                      name="i-game-icons:sundial"
                      class="size-5"
                    />
                  </li>
                  <li
                    v-for="n in 3"
                    :key="n"
                    class="pointer-events-auto border size-4 rounded-full peer peer-hover:bg-transparent cursor-pointer"
                    :class="{
                      'bg-red-700': n <= value && kind === 'failure',
                      'bg-green-700': n <= value && kind === 'success',
                      'hover:bg-green-300 group-hover:bg-green-300': kind === 'success',
                      'hover:bg-red-300 group-hover:bg-red-300': kind === 'failure',
                    }"
                    @click="deathSavingThrows[kind] = n === value ? n - 1 : n"
                  />
                  <li v-if="kind === 'failure'">
                    <UIcon
                      name="i-game-icons:death-skull"
                      class="size-4"
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #links>
        <UButton
          icon="i-game-icons:forest-camp"
          variant="outline"
        >
          Repos court
        </UButton>
        <UButton
          icon="i-game-icons:night-sleep"
          variant="outline"
        >
          Repos long
        </UButton>
        <UButton icon="i-heroicons:pencil">
          Modifier
        </UButton>
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="lg:flex justify-between gap-4 space-y-4">
        <div class="flex gap-x-4">
          <div class="ac-background grid place-items-center place-content-center">
            <p class="text-xs">
              CA
            </p>
            <p class="text-2xl font-semibold">
              {{ armorClass }}
            </p>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-1">
              <div class="ring ring-inset ring-accented rounded-md focus-within:ring-2 focus-within:ring-primary">
                <UInputNumber
                  v-model="characterSheet.currentHp"
                  min="0"
                  :max="characterSheet.maxHp"
                  :increment="false"
                  :decrement="false"
                  variant="none"
                />
                /
                <UInputNumber
                  v-model="characterSheet.maxHp"
                  min="0"
                  :increment="false"
                  :decrement="false"
                  variant="none"
                />
              </div>
              +
              <UInputNumber
                v-model="characterSheet.temporaryHp"
                min="0"
                :increment="false"
                :decrement="false"
              />
              PV
            </div>

            <div class="flex items-center gap-1.5">
              <UButton
                icon="i-game-icons:heart-plus"
                size="sm"
                variant="subtle"
                color="success"
              >
                Soins
              </UButton>

              <UButton
                icon="i-game-icons:heart-minus"
                size="sm"
                variant="subtle"
                color="error"
              >
                Dégâts
              </UButton>
            </div>
          </div>

          <div class="rounded-lg overflow-hidden bg-default ring ring-default grid grid-cols-2 divide-x divide-default w-75">
            <div class="py-1 px-2">
              <p class="font-semibold text-muted">
                Résistances
              </p>

              <ul>
                <li>
                  <UIcon
                    name="i-heroicons:chevron-double-up-16-solid"
                    class="size-4 text-blue-400"
                  /> Poison
                </li>
                <li>
                  <UIcon
                    name="i-heroicons:chevron-up-16-solid"
                    class="size-4 text-blue-400"
                  /> Charmé
                </li>
                <li>
                  <UIcon
                    name="i-heroicons:chevron-down-16-solid"
                    class="size-4 text-red-400"
                  /> Feu
                </li>
              </ul>
            </div>

            <div class="py-1 px-2">
              <p class="font-semibold text-muted">
                États
              </p>
            </div>
          </div>
        </div>

        <div class="flex gap-x-4">
          <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
            <p class="font-semibold text-muted">
              Initiative
            </p>

            <p>
              <UIcon
                name="i-game-icons:walking-boot"
                class="size-4"
              />
              {{ formatModifier(initiativeBonus) }}
            </p>
          </div>

          <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
            <p class="font-semibold text-muted">
              Vitesse
            </p>

            <p class="flex items-center gap-1">
              <UIcon
                name="i-game-icons:run"
                class="size-4 mr-1"
              />
              {{ $n(speed) }} m
            </p>
          </div>

          <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
            <p class="font-semibold text-muted">
              Inspiration
            </p>

            <div class="flex justify-center">
              <div
                class="rounded-full border-2 border-accented size-12 p-1 cursor-pointer"
                @click="characterSheet.inspiration = !characterSheet.inspiration"
              >
                <UIcon
                  v-show="characterSheet.inspiration"
                  name="i-game-icons:enlightenment"
                  class="size-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:flex gap-x-12 space-y-4">
        <ul class="flex lg:flex-col gap-y-4 gap-x-2">
          <li
            v-for="(_, key) in abilityScores"
            :key
            class="rounded-lg bg-default ring ring-default py-1 px-2 space-y-2"
          >
            <p class="font-semibold text-muted text-center">
              {{ $t(`ability_scores.${key}`) }}
            </p>

            <div class="flex items-baseline justify-center">
              <p class="text-2xl border rounded-full size-12 grid place-items-center relative z-1 bg-default">
                {{ formatModifier(abilityModifiers[key]!) }}
              </p>

              <p class="border rounded-r-md py-0.5 px-1 text-sm min-w-10 bg-default -ml-2 text-center">
                {{ abilityScores[key] }}
              </p>
            </div>

            <USeparator />

            <div class="flex items-center gap-2">
              <UCheckbox />
              <span class="px-1">{{ formatModifier(abilityModifiers[key]!) }}</span>
              <span class="flex-1">Jet de sauvegarde</span>
            </div>

            <template v-if="Object.keys($tm(`skills.${key}`)).length > 0">
              <USeparator />

              <ul>
                <li
                  v-for="(skill, skillKey) in $tm(`skills.${key}`)"
                  :key="skillKey"
                  class="flex items-center gap-2"
                >
                  <UCheckbox />
                  <span class="px-1">{{ formatModifier(abilityModifiers[key]!) }}</span>
                  <span class="flex-1">{{ $rt(skill) }}</span>
                </li>
              </ul>
            </template>
          </li>
        </ul>

        <div class="md:flex gap-x-4 space-y-4">
          <div class="rounded-lg overflow-hidden bg-default ring ring-default py-1 px-2 self-start min-w-12">
            <p class="font-semibold text-muted">
              Bonus de maîtrise
            </p>
            <p>{{ formatModifier(proficiencyBonus) }}</p>
          </div>
        </div>
      </div>

      <div>
        <ul class="space-y-1">
          <li
            v-for="trait in speciesTraits"
            :key="trait.id"
          >
            <UCollapsible>
              <h3 class="font-semibold mb-1">
                {{ trait.name }}
              </h3>

              <template #content>
                <p>{{ trait.description }}</p>

                <ul
                  v-if="trait.traitEffects && trait.traitEffects.length > 0"
                  class="mt-2 space-y-1"
                >
                  <li
                    v-for="(te, index) in trait.traitEffects"
                    :key="index"
                    class="text-sm text-muted"
                  >
                    - {{ te.effect?.type }}: {{ te.effect?.value }}
                  </li>
                </ul>
              </template>
            </UCollapsible>
          </li>
        </ul>
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
import { UIcon } from '#components'

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
  deathSavingThrows,
  hitDice,
  initiativeBonus,
  mainClass,
  multiClass,
  proficiencyBonus,
  spellcastingAbility,
  spellAttackModifier,
  spellSaveDC,
  spellSlots,
  speciesTraits,
  speciesEffects,
  species,
  armorClass,
  speed,
  formatModifier,
} = useCharacterSheet(characterSheet)

const { tm, rt } = useI18n()

const characterSheetTitle = computed<string>(() => characterSheet.value?.name ?? 'Personnage sans nom')
const characterSheetDescription = computed<string>(() => {
  const characterClassesText = [mainClass.value, ...multiClass.value].filter(Boolean).map(cls => `${cls.name} ${cls.level}`).join(', ')

  const characterSpecies = species.value?.name ?? 'd\'une espèce inconnue'

  return [characterSpecies, characterSheet.value.background, characterClassesText].join(' | ')
})

const spellcastingAbilityOptions = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('ability_scores')).map(([value, label]) => ({
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

<style scoped>
.ac-background {
  background: no-repeat center url('~/assets/ac_background.svg');
  width: 72px;
  height: 83px;
}
</style>
