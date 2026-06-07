<template>
  <UDrawer
    v-model:open="open"
    :dismissible="false"
    :overlay="false"
    :handle="false"
    :modal="false"
    inset
    direction="top"
    :ui="{ header: 'flex items-center justify-between', body: 'grid grid-cols-2 items-start' }"
  >
    <UButton
      label="Fiche personnage"
      color="primary"
      variant="ghost"
      icon="heroicons-outline:identification"
    />

    <template #header>
      <h2 class="text-highlighted font-semibold">
        Fiche de personnage
      </h2>

      <UButton
        color="neutral"
        variant="ghost"
        icon="heroicons-solid:x-mark"
        @click="open = false"
      />
    </template>

    <template #body>
      <!-- Lentille de fiche : réservée aux utilisateurs connectés. Auto-remplit
           les stats depuis une vraie fiche. Les visiteurs gardent le bac à sable
           manuel ci-dessous. -->
      <div
        v-if="loggedIn"
        class="col-span-2 flex flex-wrap items-end gap-x-4 gap-y-2 mb-4"
      >
        <UFormField
          label="Charger une de mes fiches"
          class="min-w-64"
        >
          <USelect
            :model-value="selectedSheetId ?? undefined"
            :items="sheetOptions"
            :loading="loading"
            :disabled="!sheetOptions.length"
            icon="heroicons-outline:identification"
            placeholder="Saisie manuelle"
            class="w-full"
            @update:model-value="onSelectSheet"
          />
        </UFormField>

        <UButton
          v-if="selectedSheetId !== null"
          label="Saisie manuelle"
          color="neutral"
          variant="ghost"
          icon="heroicons:pencil-square"
          @click="reset"
        />
      </div>

      <ul class="md:flex items-center justify-between text-center max-w-min gap-x-2">
        <li
          v-for="(_, key) in stats.abilityScores"
          :key
          class="p-2 space-y-1"
        >
          <p
            class="font-semibold"
            :class="{
              'text-primary flex items-center gap-x-1': key === stats.spellcastingAbility,
            }"
          >
            {{ $t(`ability_scores.${key}`) }}

            <StarsIcon
              v-if="key === stats.spellcastingAbility"
              class="flex-none size-4"
            />
          </p>

          <UInput
            v-model.number="stats.abilityScores[key]"
            :name="key"
            type="number"
            class="w-14"
          />

          <p>{{ formatModifier(abilityModifiers[key] ?? 0) }}</p>
        </li>
      </ul>

      <div class="space-y-4 md:space-y-0">
        <div class="md:flex gap-x-4 space-y-4">
          <UFormField label="Niveau de personnage">
            <UInput
              v-model.number="stats.characterLevel"
              type="number"
              min="1"
              max="20"
              class="w-14"
            />
          </UFormField>

          <UFormField label="Bonus de maîtrise">
            <UInput
              v-model.number="stats.proficiencyBonus"
              type="number"
              min="0"
              class="w-14"
            />
          </UFormField>

          <UFormField label="Caractéristique d'incantation">
            <USelect
              v-model="stats.spellcastingAbility"
              :items="spellcastingAbilityOptions"
              placeholder="Sélectionnez une caractéristique"
              class="min-w-32"
            />
          </UFormField>
        </div>

        <div
          v-if="stats.spellcastingAbility"
          class="md:flex gap-x-4 space-y-4"
        >
          <div>
            <p>DD de sauvegarde des sorts</p>
            <p>{{ spellSaveDC }}</p>
          </div>

          <div>
            <p>Bonus d'attaque avec un sort</p>
            <p>{{ formatModifier(spellAttackModifier ?? 0) }}</p>
          </div>
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
                :disabled="stats.spellSlots[level]!.max <= 0"
                @click="decrementMaxSpellSlot(level)"
              />

              <div
                v-if="stats.spellSlots[level]!.max === 0"
                class="border border-dashed size-4 rounded-full opacity-50"
              />

              <ul class="flex items-center gap-1 group pointer-events-none">
                <li
                  v-for="n in stats.spellSlots[level]!.max"
                  :key="n"
                  class="pointer-events-auto border size-4 rounded-full hover:bg-primary/50 group-hover:bg-primary/50 peer peer-hover:bg-transparent"
                  :class="{
                    'bg-primary': n <= stats.spellSlots[level]!.current,
                  }"
                  @click="setCurrentSpellSlot(level, n)"
                />
              </ul>

              <UButton
                icon="heroicons:plus-16-solid"
                variant="ghost"
                @click="incrementMaxSpellSlot(level)"
              />
            </div>
          </li>
        </ul>
      </div>
    </template>
  </UDrawer>
</template>

<script lang="ts" setup>
const open = ref<boolean>(false)

const { loggedIn } = useUserSession()
const toast = useToast()
const { tm, rt } = useI18n()

const {
  stats,
  selectedSheetId,
  abilityModifiers,
  spellSaveDC,
  spellAttackModifier,
  loadSheet,
  reset,
} = useSpellLens()

// Liste des fiches de l'utilisateur. URL nulle tant que non connecté → useFetch
// ne déclenche aucune requête (évite un 401 pour les visiteurs anonymes).
const { data: sheets } = useFetch<Array<{ id: number, name: string }>>(
  () => (loggedIn.value ? '/api/character_sheets' : null),
  { lazy: true, default: () => [], watch: [loggedIn] },
)

const sheetOptions = computed<{ label: string, value: number }[]>(() =>
  (sheets.value ?? []).map(s => ({ label: s.name, value: s.id })),
)

const loading = ref<boolean>(false)

const onSelectSheet = async (id: number | null) => {
  if (id === null) {
    reset()
    return
  }
  loading.value = true
  try {
    await loadSheet(id)
  } catch {
    toast.add({
      title: 'Impossible de charger la fiche',
      description: 'Vérifiez votre connexion, puis réessayez.',
      color: 'error',
    })
    selectedSheetId.value = null
  } finally {
    loading.value = false
  }
}

const spellcastingAbilityOptions = computed<{ label: string, value: string }[]>(() =>
  Object.entries(tm('ability_scores')).map(([value, label]) => ({ label: rt(label), value })),
)

const decrementMaxSpellSlot = (level: number) => {
  const slot = stats.value.spellSlots[level]!
  if (slot.max > 0) {
    slot.max--
    if (slot.current > slot.max) slot.current = slot.max
  }
}

const incrementMaxSpellSlot = (level: number) => {
  // Un emplacement ajouté est disponible par défaut (max ET restants).
  const slot = stats.value.spellSlots[level]!
  slot.max++
  slot.current++
}

const setCurrentSpellSlot = (level: number, n: number) => {
  const slot = stats.value.spellSlots[level]!
  if (n === slot.current) slot.current--
  else if (n <= slot.max) slot.current = n
}
</script>
