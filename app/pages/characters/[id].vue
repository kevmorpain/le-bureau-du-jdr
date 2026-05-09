<template>
  <div
    v-if="characterSheet"
    class="min-h-screen bg-default"
  >
    <DashboardHeaderSection
      :character-sheet
      :is-resting
      :combat-mode
      :roll
      @short-rest="shortRest()"
      @long-rest="longRest()"
      @toggle-combat="toggleCombat"
    />

    <div class="dashboard-grid">
      <!-- ── Colonne gauche : Attributs + Maîtrises ── -->
      <div class="flex flex-col gap-3">
        <AbilityScoresSection
          v-model:character-sheet="characterSheet"
          :roll="roll"
        />
        <ProficienciesSection :character-sheet="characterSheet" />
      </div>

      <!-- ── Colonne centrale : Sections collapsibles ── -->
      <div class="flex flex-col gap-3 min-w-0">
        <CollapsibleSection
          title="Statistiques"
          storage-key="quick-stats"
        >
          <QuickStatsSection
            v-model:character-sheet="characterSheet"
            :roll="roll"
          />
        </CollapsibleSection>

        <template v-if="combatMode">
          <CollapsibleSection
            title="Tour actif"
            storage-key="combat-mode"
          >
            <CombatModeSection
              :character-sheet="characterSheet"
              :roll="roll"
            />
          </CollapsibleSection>
          <CollapsibleSection
            title="Combat"
            storage-key="combat"
          >
            <CombatSection
              :character-sheet="characterSheet"
              :roll="roll"
            />
          </CollapsibleSection>
        </template>

        <CollapsibleSection
          title="Capacités de classe"
          :badge="availableFeaturesCount"
          storage-key="features"
        >
          <ClassFeaturesSection :character-sheet="characterSheet" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Sorts"
          :badge="preparedSpellsCount"
          storage-key="spells"
        >
          <MagicSection :character-sheet="characterSheet" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Inventaire"
          storage-key="inventory"
        >
          <InventorySection v-model:character-sheet="characterSheet" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Espèce & Historique"
          storage-key="background"
        >
          <div class="space-y-4">
            <SpeciesTraitsSection :character-sheet="characterSheet" />
            <BackgroundSection v-model:character-sheet="characterSheet" />
          </div>
        </CollapsibleSection>
      </div>

      <!-- ── Colonne droite : Widgets compacts ── -->
      <div class="flex flex-col gap-3">
        <HitPointsSection
          v-model:character-sheet="characterSheet"
          :roll="roll"
        />
        <DeathSavingThrowSection
          :character-sheet="characterSheet"
          :roll="roll"
          @recover="(hp) => (characterSheet.currentHp = hp)"
        />
        <HitDiceSection
          :character-sheet="characterSheet"
          :roll="roll"
        />
        <DefensesSection :character-sheet="characterSheet" />
        <StatusSection :character-sheet="characterSheet" />
        <SpellSlotsSection :character-sheet="characterSheet" />
        <ConcentrationSection :character-sheet="characterSheet" />
        <QuickNotesSection />
      </div>
    </div>

    <DiceRollerSection />
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'sheet',
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: characterSheetData } = await useFetch<CharacterSheet>(() => `/api/character_sheets/${id.value}`)

if (!characterSheetData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Fiche de personnage introuvable' })
}

const characterSheet = ref(characterSheetData.value)

const toaster = useToast()
const { shortRest, longRest, isResting } = useRest(characterSheet)
const { roll } = useDiceRoller()

const { resolvedFeatures, characterSpells, initiativeBonus, spellSlots } = useCharacterSheet(characterSheet)
provide('spellSlots', spellSlots)

// ── Mode combat ──────────────────────────────────────────────────────────────
const combatMode = ref(false)

const toggleCombat = () => {
  combatMode.value = !combatMode.value
  if (combatMode.value) {
    roll('Initiative', initiativeBonus.value)
  }
}

// ── Badges pour les sections collapsibles ────────────────────────────────────
const availableFeaturesCount = computed(() =>
  resolvedFeatures.value.filter(f => f.maxUses !== null && f.currentUses < (f.maxUses ?? 0)).length || null,
)

const preparedSpellsCount = computed(() =>
  characterSpells.value.filter(s => s.prepared).length || null,
)

// ── Auto-save avec debounce ──────────────────────────────────────────────────
let saveTimeout: ReturnType<typeof setTimeout> | null = null

watch(characterSheet, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(updateCharacterSheet, 1000)
}, { deep: true })

const updateCharacterSheet = async () => {
  if (!characterSheet.value) return
  try {
    await $fetch(`/api/character_sheets/${id.value}`, {
      method: 'PUT',
      body: characterSheet.value,
    })
    toaster.add({ title: 'Fiche sauvegardée', color: 'success' })
  } catch {
    toaster.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  }
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  gap: 12px;
  padding: 16px 20px;
  align-items: start;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 200px 1fr 200px;
  }
}
</style>
