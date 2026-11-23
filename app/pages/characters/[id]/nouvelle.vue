<template>
  <div class="sheet font-atkinson">
    <SheetNav
      :active="view"
      @retry="retrySave"
      @resolve="isConflictOpen = true"
    />

    <SheetRail v-model:character-sheet="characterSheet" />

    <main class="sheet__main">
      <div
        v-if="hasConflict"
        class="sheet__conflict"
        role="alert"
      >
        <strong>{{ $t('sheet.conflict_banner.title') }}</strong>
        <span>{{ $t('sheet.conflict_banner.body') }}</span>
        <DsLinkButton
          class="ml-auto"
          :label="$t('sheet.conflict_banner.action')"
          @click="isConflictOpen = true"
        />
      </div>

      <SheetPlayView
        v-if="view === 'play'"
        :character-sheet="characterSheet"
      />
      <SheetSettingsView
        v-else-if="view === 'settings'"
        :is-new-sheet="preferences.newSheet"
        @choose-design="switchSheetDesign"
      />
      <DsBlock
        v-else
        :ribbon="$t(`sheet.views.${view}`)"
      >
        <p class="sheet__coming">
          {{ $t('sheet.coming') }}
        </p>
      </DsBlock>
    </main>

    <div
      class="sheet__rolls"
      aria-live="polite"
    >
      <DsRollToast
        v-for="toast in toasts"
        :key="toast.id"
        :roll="toast"
      />
    </div>

    <ClientOnly>
      <SyncConflictModal
        v-model:open="isConflictOpen"
        :character-sheet-id="charId"
        @resolved="reconcile"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { rollEngineKey } from '~/composables/character/useCharacterRolls'

definePageMeta({
  layout: 'blank',
  footer: false,
})

const route = useRoute()
const charId = computed(() => Number(route.params.id))
const view = computed(() => getSheetView(route.query.view))

const { characterSheet, refreshSheet, retrySave, switchSheetDesign } = await useSheetPersistence(charId)

const { refreshInventory, refreshSpells, preferences, spellSlots, rollEngine } = useCharacterSheet(characterSheet)
provide('spellSlots', spellSlots)
provide(rollEngineKey, rollEngine)
const { toasts } = useDiceRoller(rollEngine)

const { reconcile } = useSheetReconciliation(charId, [refreshSheet, refreshInventory, refreshSpells])

const { conflicts } = useOfflineSync()
const hasConflict = computed(() => conflicts.value.includes(charId.value))
const isConflictOpen = ref(false)
</script>

<style scoped>
.sheet {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  color: var(--color-ds-ink);
  background: var(--color-ds-bg);
}

.sheet__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 12px 12px 12px 4px;
  overflow-y: auto;
}

.sheet__conflict {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  font-size: 12.5px;
  background: color-mix(in srgb, var(--color-ds-bad) 12%, var(--color-ds-panel));
  box-shadow: inset 3px 0 0 var(--color-ds-bad);
}

.sheet__conflict strong { color: var(--color-ds-bad); }

.sheet__rolls {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet__coming {
  font-size: 13px;
  color: var(--color-ds-mute);
}
</style>
