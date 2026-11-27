<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.settings.account.title')"
    :description="$t('sheet.settings.account.help')"
    width="lg"
  >
    <p class="hint">
      {{ $t('sheet.settings.account.help') }}
    </p>
    <p
      v-if="error"
      class="error"
      role="alert"
    >
      {{ $t(`sheet.settings.account.errors.${error}`) }}
    </p>
    <div
      v-for="key in PREFERENCE_KEYS"
      :key="key"
      class="setting"
    >
      <p class="setting__label">
        {{ PREFERENCES[key].label }}
      </p>
      <DsSegmented
        v-if="isLoaded"
        :model-value="resolved[key] ? 'on' : 'off'"
        :options="yesNoOptions"
        :label="PREFERENCES[key].label"
        @update:model-value="value => save(key, value === 'on')"
      />
      <p class="setting__help">
        {{ PREFERENCES[key].description }}
      </p>
    </div>

    <template #footer="{ close }">
      <DsButton
        :label="$t('sheet.settings.account.done')"
        @click="close"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { PREFERENCES, PREFERENCE_KEYS, type Preferences } from '~~/shared/rules/preferences'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

// The sheet resolves its inherited settings from its owner's preferences.
const { resolved, isLoaded, error, load, save } = useAccountPreferences({
  onSaved: (preferences: Preferences | null) => {
    if (characterSheet.value.owner) characterSheet.value.owner.preferences = preferences
  },
})

watch(open, (isOpen) => {
  if (isOpen) void load()
})

const yesNoOptions = computed(() => [
  { value: 'on' as const, label: t('sheet.settings.yes') },
  { value: 'off' as const, label: t('sheet.settings.no') },
])
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.error {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.setting {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px 18px;
  padding: 10px 2px;
}

.setting__label {
  font-size: 14px;
  font-weight: 700;
}

.setting__help {
  grid-column: 1 / -1;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}
</style>
