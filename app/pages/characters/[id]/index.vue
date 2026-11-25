<template>
  <div
    v-if="characterSheet"
    class="min-h-screen bg-default"
  >
    <DashboardHeaderSection
      v-model:character-sheet="characterSheet"
      :is-resting
      :combat-mode
      :roll
      @short-rest="shortRest()"
      @long-rest="longRest"
      @dawn="dawn()"
      @toggle-combat="toggleCombat"
      @open-new-sheet="switchSheetDesign(true)"
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
        </template>

        <CollapsibleSection
          v-if="resourceGroups.length"
          title="Ressources de classe"
          storage-key="class-resources"
        >
          <ClassResourcesSection :character-sheet="characterSheet" />
        </CollapsibleSection>

        <CollapsibleSection
          title="Capacités"
          :badge="availableFeaturesCount"
          storage-key="features"
        >
          <FeaturesSection
            :character-sheet="characterSheet"
          />
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
          <InventorySection
            v-model:character-sheet="characterSheet"
            :roll="roll"
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Identité"
          storage-key="identity"
        >
          <IdentitySection v-model:character-sheet="characterSheet" />
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
        />
        <HitDiceSection
          v-model:character-sheet="characterSheet"
          :roll="roll"
        />
        <DefensesSection :character-sheet="characterSheet" />
        <StatusSection :character-sheet="characterSheet" />
        <TemporaryEffectsSection :character-sheet="characterSheet" />
        <SpellSlotsSection :character-sheet="characterSheet" />
        <ConcentrationSection :character-sheet="characterSheet" />
        <QuickNotesSection :character-sheet="characterSheet" />
      </div>
    </div>

    <DiceRollerSection />

    <ClientOnly>
      <SyncConflictModal
        :character-sheet-id="charId"
        @resolved="reconcile"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { idlePending, rollEngineKey } from '~/composables/character/useCharacterRolls'
import { useCombatTracker } from '~/composables/character/useCombatTracker'
import { useSheetUnconsciousEndings } from '~/composables/character/useUnconsciousEndings'
import { resolvePreferences } from '~~/shared/rules/preferences'

definePageMeta({
  layout: 'sheet',
})

const route = useRoute()
const charId = computed(() => Number(route.params.id))

const { characterSheet, refreshSheet, switchSheetDesign } = await useSheetPersistence(charId)

if (resolvePreferences(characterSheet.value.preferences, characterSheet.value.owner?.preferences).newSheet) {
  await navigateTo(getNewSheetPath(charId.value), { replace: true })
}

const { allCharacterFeatures, characterSpells, initiativeBonus, spellSlots, maxHitPointsFor, refreshInventory, refreshSpells, resourceGroups, rollEngine } = useCharacterSheet(characterSheet)
useSheetUnconsciousEndings(characterSheet)
provide('spellSlots', spellSlots)
provide(rollEngineKey, rollEngine)
const { roll } = useDiceRoller(rollEngine)
const combatTracker = useCombatTracker(characterSheet.value.id)

const { reconcile } = useSheetReconciliation(charId, [refreshSheet, refreshInventory, refreshSpells])

const { shortRest, longRest, dawn, isResting } = useRest(characterSheet, spellSlots, maxHitPointsFor, { onRested: refreshInventory })

const combatMode = ref(false)

const toggleCombat = () => {
  combatMode.value = !combatMode.value
  rollEngine.pending.value = idlePending()
  combatTracker.reset()
  if (combatMode.value) {
    roll('Initiative', initiativeBonus.value, 20, 1, { d20: { type: 'initiative' } })
  }
}

// Badges pour les sections collapsibles
const availableFeaturesCount = computed(() =>
  allCharacterFeatures.value.filter(f => f.maxUses !== null && f.currentUses < (f.maxUses ?? 0)).length || null,
)

const preparedSpellsCount = computed(() =>
  (characterSpells.value ?? []).filter(s => s.prepared).length || null,
)
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
