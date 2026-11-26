<template>
  <DsModal
    :open="!!check"
    :title="$t('sheet.concentration.title')"
    :dismissible="false"
  >
    <template v-if="check">
      <p class="hint">
        {{ $t('sheet.concentration.intro', { spell: concentrationName ?? '', damage: check.damage }) }}
      </p>
      <div class="dc">
        <span class="ds-label">{{ $t('sheet.concentration.dc') }}</span>
        <span class="ds-number dc__value">{{ check.dc }}</span>
        <span class="hint">{{ $t('sheet.concentration.save', { modifier: formatModifier(saveModifier), dc: check.dc }) }}</span>
      </div>
      <p class="hint">
        {{ $t('sheet.concentration.failure_note', { spell: concentrationName ?? '' }) }}
      </p>
    </template>

    <template #footer>
      <DsButton
        v-if="rollsEnabled"
        class="mr-auto"
        :label="$t('sheet.concentration.roll')"
        :detail="formatModifier(saveModifier)"
        @click="rollSave(roll)"
      />
      <DsButton
        variant="secondary"
        :label="$t('sheet.concentration.success')"
        @click="succeed"
      />
      <DsButton
        variant="secondary"
        :label="$t('sheet.concentration.failure')"
        @click="fail"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { useConcentrationCheck } from '~/composables/character/useConcentrationCheck'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { concentrationName } = useCharacterSheet(characterSheet)
const { current: check, saveModifier, succeed, fail, rollSave } = useConcentrationCheck(characterSheet)
const { roll, rollsEnabled } = useDiceRoller()
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.dc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px;
  background: var(--color-ds-panel-raised);
}

.dc__value { font-size: 40px; }
</style>
