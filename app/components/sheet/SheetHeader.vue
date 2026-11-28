<template>
  <header class="header">
    <DsFrame shape="stepped">
      <div class="header__body">
        <SheetIdentityHead :character-sheet="characterSheet">
          <SheetSaveStatus
            side="bottom"
            @retry="emit('retry')"
            @resolve="emit('resolve')"
          />
          <DsCornerButton
            :label="$t('sheet.header.expand')"
            class="header__expand"
            @click="isRailOpen = true"
          >
            <DsIcon
              name="chevron-down"
              :size="16"
            />
          </DsCornerButton>
        </SheetIdentityHead>

        <div class="header__vitals">
          <SheetVitals :character-sheet="characterSheet" />
          <DsShield
            :label="$t('sheet.rail.armor_class')"
            :value="armorClass.total"
          />
        </div>

        <SheetConcentrationStatus
          :character-sheet="characterSheet"
          is-inline
        />
      </div>
    </DsFrame>

    <DsSheet
      v-model:open="isRailOpen"
      :title="$t('sheet.header.rail_title')"
    >
      <SheetRail v-model:character-sheet="characterSheet" />
    </DsSheet>
  </header>
</template>

<script lang="ts" setup>
import { useSheetWindows } from '~/composables/character/useSheetWindows'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const emit = defineEmits<{ retry: [], resolve: [] }>()

const { armorClass } = useCharacterSheet(characterSheet)
const { openModel } = useSheetWindows(characterSheet)

const isRailOpen = openModel('rail')
</script>

<style scoped>
.header {
  flex-direction: column;
  flex-shrink: 0;
  padding: 10px 12px 8px;
}

.header__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header .header__expand {
  width: 44px;
  height: 44px;
}

.header__vitals {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
