<template>
  <div class="manage">
    <section class="manage__main">
      <DsBlock :ribbon="$t('sheet.settings.rules')">
        <p class="note">
          {{ $t('sheet.settings.rules_help') }}
        </p>
        <div
          v-for="key in GAME_RULE_KEYS"
          :key="key"
          class="setting"
        >
          <p class="setting__label">
            {{ PREFERENCES[key].label }}
          </p>
          <DsSegmented
            :model-value="choiceOf(key)"
            :options="choicesFor(key)"
            :label="PREFERENCES[key].label"
            @update:model-value="choice => handleChoose(key, choice)"
          />
          <p class="setting__help">
            {{ PREFERENCES[key].description }}
          </p>
        </div>
      </DsBlock>

      <DsBlock :ribbon="$t('sheet.settings.appearance')">
        <div class="setting">
          <p class="setting__label">
            {{ $t('sheet.settings.design') }}
          </p>
          <DsSegmented
            :model-value="isNewSheet ? 'new' : 'old'"
            :options="designOptions"
            :label="$t('sheet.settings.design')"
            @update:model-value="value => emit('chooseDesign', value === 'new')"
          />
          <p class="setting__help">
            {{ $t('sheet.settings.design_help') }}
          </p>
        </div>
      </DsBlock>
    </section>

    <section class="manage__side">
      <DsBlock :ribbon="$t('sheet.settings.sheet')">
        <dl class="facts">
          <dt>{{ $t('sheet.settings.ruleset') }}</dt>
          <dd>{{ $t(`sheet.settings.rulesets.${RULESET_YEARS[characterSheet.ruleset ?? '5']}`) }}</dd>
          <dt>{{ $t('sheet.settings.defaults') }}</dt>
          <dd>{{ $t('sheet.settings.own_settings', ownRuleCount) }}</dd>
        </dl>
        <DsLinkButton
          :label="$t('sheet.settings.account_defaults')"
          @click="isAccountOpen = true"
        />
        <DsButton
          variant="danger"
          :label="$t('sheet.settings.delete.action')"
          :disabled="isDeleting"
          @click="isDeleteOpen = true"
        />
        <p
          v-if="hasDeleteFailed"
          class="error"
          role="alert"
        >
          {{ $t('sheet.settings.delete.failed') }}
        </p>
      </DsBlock>
    </section>

    <DsConfirmModal
      v-model:open="isDeleteOpen"
      :title="$t('sheet.settings.delete.action')"
      :confirm-label="$t('sheet.settings.delete.action')"
      @confirm="handleDelete"
    >
      <p>{{ $t('sheet.settings.delete.body') }}</p>
      <p class="victim">
        <strong>{{ characterSheet.name }}</strong>
        <span>{{ characterSummary }}</span>
      </p>
    </DsConfirmModal>

    <ClientOnly>
      <SheetAccountPreferencesWindow
        v-model:open="isAccountOpen"
        v-model:character-sheet="characterSheet"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { PREFERENCES, type PreferenceKey } from '~~/shared/rules/preferences'
import type { Ruleset } from '~~/shared/rules/ruleset'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const { isNewSheet, deleteCharacter } = defineProps<{
  isNewSheet: boolean
  deleteCharacter: () => Promise<void>
}>()

const emit = defineEmits<{ chooseDesign: [isNewSheet: boolean] }>()

const { t } = useI18n()
const { ownPreferences, accountPreferences, setPreference, species, mainClass, multiClass } = useCharacterSheet(characterSheet)

// A dotted ruleset ('5.5') cannot be an i18n key.
const RULESET_YEARS = { 5: '2014', 5.5: '2024' } as const satisfies Record<Ruleset, string>

// The design has its own row; the other preferences change how the game is played.
const GAME_RULE_KEYS = ['diceRolls', 'ammunition', 'encumbrance'] as const satisfies PreferenceKey[]
type Choice = 'inherit' | 'on' | 'off'

const choiceOf = (key: PreferenceKey): Choice => {
  const own = ownPreferences.value?.[key]
  return own === undefined ? 'inherit' : own ? 'on' : 'off'
}

const choicesFor = (key: PreferenceKey) => {
  const inherited = accountPreferences.value?.[key] ?? PREFERENCES[key].default
  return [
    { value: 'inherit' as const, label: t('sheet.settings.inherit', { value: inherited ? t('sheet.settings.yes_lower') : t('sheet.settings.no_lower') }) },
    { value: 'on' as const, label: t('sheet.settings.yes') },
    { value: 'off' as const, label: t('sheet.settings.no') },
  ]
}

const handleChoose = (key: PreferenceKey, choice: Choice) =>
  setPreference(key, choice === 'inherit' ? null : choice === 'on')

const ownRuleCount = computed(() => GAME_RULE_KEYS.filter(key => ownPreferences.value?.[key] !== undefined).length)

const designOptions = computed(() => [
  { value: 'new' as const, label: t('sheet.settings.design_new') },
  { value: 'old' as const, label: t('sheet.settings.design_old') },
])

const characterSummary = computed(() => [
  species.value?.name,
  [mainClass.value, ...multiClass.value].filter(cls => !!cls).map(cls => `${cls!.name} ${cls!.level}`).join(' / '),
].filter(Boolean).join(' · '))

const isAccountOpen = ref(false)
const isDeleteOpen = ref(false)
const isDeleting = ref(false)
const hasDeleteFailed = ref(false)

const handleDelete = async () => {
  isDeleting.value = true
  hasDeleteFailed.value = false
  try {
    await deleteCharacter()
  } catch {
    hasDeleteFailed.value = true
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.manage {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.manage__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.manage__side {
  flex-shrink: 0;
  width: 330px;
}

.note {
  font-size: 12px;
  color: var(--color-ds-mute);
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
  color: var(--color-ds-ink);
}

.setting :deep([role="radio"]) { white-space: nowrap; }

.setting__help {
  grid-column: 1 / -1;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}

.facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 12px;
  padding: 8px 10px;
  font-size: 12px;
  background: var(--color-ds-panel-raised);
}

.facts dt {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.error {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.victim {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--color-ds-panel);
}

.victim strong {
  font-family: var(--font-bodoni);
  font-size: 17px;
}

.victim span {
  font-size: 12px;
  color: var(--color-ds-mute);
}
</style>
