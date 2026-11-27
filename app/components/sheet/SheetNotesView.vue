<template>
  <div class="manage">
    <section class="manage__main">
      <DsBlock>
        <div class="who">
          <div class="who__text">
            <p class="who__name">
              {{ characterSheet.name }}
            </p>
            <p class="who__line">
              {{ summary }}
            </p>
          </div>
          <DsButton
            variant="secondary"
            :label="$t('sheet.notes.edit_identity')"
            @click="isIdentityOpen = true"
          />
        </div>
      </DsBlock>

      <DsFrame
        shape="octagon"
        :padded="false"
        class="notes"
      >
        <div class="notes__body">
          <div class="notes__head">
            <h2 class="notes__title">
              {{ $t('sheet.notes.title') }}
            </h2>
            <span class="ds-label notes__autosave">{{ $t('sheet.notes.autosave') }}</span>
            <DsTextField
              v-model="search"
              :label="$t('sheet.notes.search')"
              :placeholder="$t('sheet.notes.search')"
              icon="search"
              :width="170"
              class="notes__search"
            />
          </div>
          <template v-if="search.trim()">
            <p class="notes__hint">
              {{ $t('sheet.notes.matches', matches.length) }}
            </p>
            <p
              v-for="(match, index) in matches"
              :key="index"
              class="notes__match"
            >
              {{ match }}
            </p>
          </template>
          <textarea
            v-else
            v-model="notes"
            class="notes__input"
            :aria-label="$t('sheet.notes.title')"
            :placeholder="$t('sheet.notes.placeholder')"
          />
        </div>
      </DsFrame>
    </section>

    <section class="manage__side">
      <DsBlock :ribbon="$t('sheet.notes.identity')">
        <div
          v-for="section in identitySections"
          :key="section.key"
        >
          <button
            type="button"
            class="accordion"
            :aria-expanded="openSection === section.key"
            @click="openSection = openSection === section.key ? null : section.key"
          >
            <span class="accordion__title">{{ $t(`sheet.notes.sections.${section.key}`) }}</span>
            <span
              class="accordion__chevron"
              aria-hidden="true"
            >{{ openSection === section.key ? '−' : '+' }}</span>
          </button>
          <div
            v-if="openSection === section.key"
            class="accordion__body"
          >
            <p v-if="!section.entries.length">
              {{ $t('sheet.notes.empty') }}
            </p>
            <dl v-else>
              <div
                v-for="entry in section.entries"
                :key="entry.label"
                class="entry"
              >
                <dt
                  v-if="entry.label"
                  class="ds-label"
                >
                  {{ entry.label }}
                </dt>
                <dd class="entry__value">
                  {{ entry.value }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </DsBlock>
    </section>

    <ClientOnly>
      <SheetIdentityWindow
        v-model:open="isIdentityOpen"
        v-model:character-sheet="characterSheet"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useQuickNotes } from '~/composables/character/useQuickNotes'
import { matchesSearch } from '~~/shared/utils/search'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()
const {
  species, selectedBackground, mainClass, multiClass, alignmentLabel, appearanceFields, sizeLabel,
  personalityTraits, ideals, bonds, flaws, backstory, allies,
} = useCharacterSheet(characterSheet)
const { notes } = useQuickNotes(characterSheet)

const isIdentityOpen = ref(false)
const search = ref('')
const openSection = ref<string | null>(null)

const summary = computed(() => {
  const classes = [mainClass.value, ...multiClass.value]
    .filter(cls => !!cls)
    .map(cls => (cls!.subclass ? `${cls!.name} (${cls!.subclass.name}) ${cls!.level}` : `${cls!.name} ${cls!.level}`))
  return [species.value?.name, selectedBackground.value?.name, ...classes, alignmentLabel.value]
    .filter(Boolean)
    .join(' · ')
})

const matches = computed(() => {
  const query = search.value.trim()
  return notes.value
    .split(/\n\s*\n/)
    .filter(paragraph => matchesSearch(paragraph, query))
})

type Entry = { label: string, value: string }
const filled = (entries: Entry[]) => entries.filter(entry => entry.value.trim())

const identitySections = computed(() => [
  {
    key: 'personality',
    entries: filled([
      { label: t('sheet.identity.fields.personality_traits'), value: personalityTraits.value },
      { label: t('sheet.identity.fields.ideals'), value: ideals.value },
      { label: t('sheet.identity.fields.bonds'), value: bonds.value },
      { label: t('sheet.identity.fields.flaws'), value: flaws.value },
    ]),
  },
  {
    key: 'appearance',
    entries: filled([
      ...appearanceFields.value.map(field => ({ label: t(`sheet.identity.fields.${field.key}`), value: field.value })),
      { label: t('sheet.notes.size'), value: sizeLabel.value ?? '' },
    ]),
  },
  {
    key: 'background',
    entries: selectedBackground.value
      ? filled([
          { label: '', value: selectedBackground.value.name },
          { label: selectedBackground.value.featureName, value: selectedBackground.value.featureDescription },
        ])
      : [],
  },
  { key: 'story', entries: filled([{ label: '', value: backstory.value }]) },
  { key: 'allies', entries: filled([{ label: '', value: allies.value }]) },
])
</script>

<style scoped>
.manage {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-height: 100%;
}

.manage__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
  min-width: 0;
}

.manage__side {
  flex-shrink: 0;
  width: 330px;
}

.who {
  display: flex;
  align-items: center;
  gap: 14px;
}

.who__text {
  flex: 1;
  min-width: 0;
}

.who__name {
  font-family: var(--font-bodoni);
  font-size: 22px;
  font-weight: 700;
}

.who__line {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--color-ds-mute);
}

.notes {
  display: flex;
  flex: 1;
}

.notes :deep(.frame__fill) {
  display: flex;
  flex: 1;
}

.notes__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
}

.notes__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notes__title {
  font-family: var(--font-bodoni);
  font-size: 20px;
  font-weight: 700;
}

.notes__autosave { font-size: 9.5px; }

.notes__search { margin-left: auto; }

.notes__input {
  flex: 1;
  min-height: 360px;
  padding: 4px 2px;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--color-ds-ink);
  background: transparent;
  outline: none;
  resize: none;
}

.notes__input::placeholder { color: var(--color-ds-faint); }

.notes__hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.notes__match {
  padding: 8px 10px;
  font-size: 13.5px;
  line-height: 1.6;
  white-space: pre-line;
  background: var(--color-ds-panel-raised);
}

.accordion {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 2px;
  font-weight: 700;
  text-align: left;
  color: inherit;
  border-bottom: 1px solid var(--color-ds-line);
}

.accordion__title { flex: 1; }

.accordion__chevron {
  font-size: 13px;
  color: var(--color-ds-gold);
}

.accordion__body {
  padding: 6px 2px 10px;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--color-ds-mute);
}

.entry + .entry { margin-top: 6px; }

.entry__value {
  color: var(--color-ds-ink);
  white-space: pre-line;
}
</style>
