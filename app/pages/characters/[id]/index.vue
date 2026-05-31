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
      @long-rest="longRest()"
      @dawn="dawn()"
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
        </template>

        <CollapsibleSection
          title="Capacités"
          :badge="availableFeaturesCount"
          storage-key="features"
        >
          <FeaturesSection :character-sheet="characterSheet" @refresh="refreshSheet" />
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
          title="Historique"
          storage-key="background"
        >
          <BackgroundSection v-model:character-sheet="characterSheet" />
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

    <ClientOnly>
      <SyncConflictModal
        :character-sheet-id="charId"
        @resolved="reconcileAfterConflict"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'sheet',
})

const route = useRoute()
const id = computed(() => route.params.id as string)
const charId = computed(() => Number(id.value))
// Créé avant le `await` pour conserver le contexte de composable (scope d'effet).
const { offlineMutate } = useOfflineMutation(charId)

const { data: characterSheetData, refresh: refreshSheetData } = await useFetch<CharacterSheet>(() => `/api/character_sheets/${id.value}`)

if (!characterSheetData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Fiche de personnage introuvable' })
}

const characterSheet = ref(characterSheetData.value)

// Reload hors-ligne : si des modifs sont en attente pour ce perso, repartir de l'état local
// optimiste (le cache ne contient que l'état serveur d'avant les modifs).
if (import.meta.client && hasPending(charId.value)) {
  const snap = readSnapshot<CharacterSheet>(charId.value)
  if (snap) characterSheet.value = snap
}
// Version de référence (dernier état serveur connu) pour le garde-fou anti-écrasement.
setBaseVersion(charId.value, characterSheetData.value.updatedAt)

async function refreshSheet() {
  await refreshSheetData()
  if (characterSheetData.value) {
    // Évite que le watch deep redéclenche un save vers le serveur (boucle).
    pauseAutoSave.value = true
    characterSheet.value = characterSheetData.value
    setBaseVersion(charId.value, characterSheetData.value.updatedAt)
    await nextTick()
    pauseAutoSave.value = false
  }
}

const toaster = useToast()
const { roll } = useDiceRoller()

const { allCharacterFeatures, characterSpells, initiativeBonus, spellSlots, refreshInventory, refreshSpells } = useCharacterSheet(characterSheet)
provide('spellSlots', spellSlots)

// Réconciliation : quand la file de synchro d'un perso vient d'être vidée, on re-fetch pour
// récupérer l'état serveur canonique (vrais ids des objets ajoutés, recalcul du repos…).
const { lastSynced } = useOfflineSync()
watch(lastSynced, (s) => {
  if (!s || s.characterId !== charId.value) return
  if (hasPending(charId.value)) return // de nouvelles modifs sont déjà en file → on attend
  refreshSheet()
  refreshInventory()
  refreshSpells()
})

// Après résolution d'un conflit (garder local / recharger serveur), on resynchronise l'affichage.
function reconcileAfterConflict() {
  refreshSheet()
  refreshInventory()
  refreshSpells()
}

// Le repos recharge aussi les charges d'objets (recharge complète, côté serveur).
// L'inventaire est un useFetch séparé → on le rafraîchit après chaque repos.
const { shortRest: _shortRest, longRest: _longRest, dawn: _dawn, isResting } = useRest(characterSheet, spellSlots)
const shortRest = async (...args: Parameters<typeof _shortRest>) => { await _shortRest(...args); await refreshInventory() }
const longRest = async () => { await _longRest(); await refreshInventory() }
const dawn = async () => { await _dawn(); await refreshInventory() }

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
  allCharacterFeatures.value.filter(f => f.maxUses !== null && f.currentUses < (f.maxUses ?? 0)).length || null,
)

const preparedSpellsCount = computed(() =>
  (characterSpells.value ?? []).filter(s => s.prepared).length || null,
)

// ── Auto-save avec debounce ──────────────────────────────────────────────────
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const pauseAutoSave = ref(false)

watch(characterSheet, () => {
  if (pauseAutoSave.value) return
  // Snapshot local immédiat pour survivre à un reload hors-ligne.
  if (import.meta.client) writeSnapshot(charId.value, characterSheet.value)
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(updateCharacterSheet, 1000)
}, { deep: true })

const updateCharacterSheet = async () => {
  if (!characterSheet.value) return
  try {
    const outcome = await offlineMutate({
      endpoint: `/api/character_sheets/${id.value}`,
      method: 'PUT',
      body: characterSheet.value,
      dedupeKey: 'sheet',
      label: 'Fiche',
    })
    // Hors-ligne : mis en file silencieusement (l'indicateur de synchro l'affiche).
    if (outcome === 'sent') toaster.add({ title: 'Fiche sauvegardée', color: 'success' })
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
