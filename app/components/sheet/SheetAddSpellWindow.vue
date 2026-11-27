<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.add_spell.title')"
    :description="$t('sheet.add_spell.description')"
    width="lg"
  >
    <DsTextField
      v-model="query"
      :label="$t('sheet.add_spell.search')"
      :placeholder="$t('sheet.add_spell.search')"
      icon="search"
      width="full"
    />
    <div class="filters">
      <span class="ds-label">{{ $t('sheet.add_spell.filters.class') }}</span>
      <DsChips
        v-model="classNames"
        :options="classOptions"
        :label="$t('sheet.add_spell.filters.class')"
      />
      <span class="ds-label">{{ $t('sheet.add_spell.filters.school') }}</span>
      <DsChips
        v-model="schools"
        :options="schoolOptions"
        :label="$t('sheet.add_spell.filters.school')"
      />
      <span class="ds-label">{{ $t('sheet.add_spell.filters.level') }}</span>
      <DsChips
        v-model="levels"
        :options="levelOptions"
        :label="$t('sheet.add_spell.filters.level')"
      />
    </div>

    <div class="catalog">
      <ul
        class="catalog__list"
        :aria-busy="pending || isClassListLoading"
      >
        <li
          v-for="spell in filteredSpells"
          :key="spell.id"
          class="result"
          :class="{ 'result--focused': spell.id === focusedSpell?.id, 'result--owned': isOwned(spell.id) }"
        >
          <DsCheckbox
            :model-value="isOwned(spell.id) || addedIds.includes(spell.id)"
            :disabled="isOwned(spell.id) || busyIds.includes(spell.id)"
            class="result__box"
            @update:model-value="handleToggle(spell)"
          >
            <span class="sr-only">{{ $t(isOwned(spell.id) ? 'sheet.add_spell.owned' : 'sheet.add_spell.toggle', { name: spell.name }) }}</span>
          </DsCheckbox>
          <button
            type="button"
            class="result__body"
            @click="focusedId = spell.id"
          >
            <span class="result__name">
              <DsCostTag
                v-if="spellCostTagOf(spell.castingTime)"
                :cost="spellCostTagOf(spell.castingTime)!"
              />
              {{ spell.name }}
              <DsIcon
                v-if="spell.concentration"
                name="concentration"
                :size="11"
                :label="$t('sheet.grimoire.flags.concentration')"
              />
            </span>
            <span class="result__sub">{{ levelLabel(spell.level) }} · {{ schoolOf(spell) }} · {{ formatRange(spell.range) }}</span>
          </button>
          <span
            v-if="isOwned(spell.id)"
            class="result__owned"
          >{{ $t('sheet.add_spell.in_grimoire') }}</span>
        </li>
        <li
          v-if="!pending && !isClassListLoading && !filteredSpells.length"
          class="hint"
        >
          {{ $t('sheet.add_spell.no_result') }}
        </li>
      </ul>

      <div
        v-if="focusedSpell"
        class="preview"
      >
        <p class="ds-label">
          {{ levelLabel(focusedSpell.level) }} · {{ schoolOf(focusedSpell) }}
        </p>
        <p class="preview__name">
          {{ focusedSpell.name }}
        </p>
        <dl class="preview__facts">
          <div>
            <dt class="ds-label">
              {{ $t('sheet.play.tiles.casting_time') }}
            </dt>
            <dd>{{ focusedSpell.castingTime }}</dd>
          </div>
          <div>
            <dt class="ds-label">
              {{ $t('sheet.play.tiles.range') }}
            </dt>
            <dd>{{ formatRange(focusedSpell.range) }}</dd>
          </div>
          <div>
            <dt class="ds-label">
              {{ $t('sheet.play.tiles.duration') }}
            </dt>
            <dd>{{ focusedSpell.duration }}</dd>
          </div>
          <div v-if="focusedSpell.concentration || focusedSpell.ritual">
            <dt class="ds-label">
              {{ $t('sheet.grimoire.columns.traits') }}
            </dt>
            <dd>{{ [focusedSpell.concentration ? $t('sheet.grimoire.flags.concentration') : '', focusedSpell.ritual ? $t('sheet.grimoire.flags.ritual') : ''].filter(Boolean).join(', ') }}</dd>
          </div>
        </dl>
        <LightMarkdown
          v-if="focusedSpell.description"
          :source="focusedSpell.description"
          class="preview__description"
        />
        <p class="hint preview__status">
          {{ $t(`sheet.add_spell.status.${isOwned(focusedSpell.id) ? 'owned' : addedIds.includes(focusedSpell.id) ? 'added' : 'absent'}`) }}
        </p>
      </div>
    </div>

    <p
      v-if="hasError"
      class="error"
      role="alert"
    >
      {{ $t('sheet.add_spell.error') }}
    </p>

    <template #footer="{ close }">
      <span
        v-if="addedIds.length"
        class="hint footer__count"
      >{{ $t('sheet.add_spell.added_count', addedIds.length) }}</span>
      <DsButton
        :label="$t('sheet.add_spell.done')"
        @click="close"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { spellCostTagOf } from '~~/shared/rules/actionCost'

type CatalogSpell = Spell & { school?: { name: string } | null }

const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const sheetRef = toRef(() => characterSheet)
const { characterSpells, activeCasterClass, addSpell, removeSpell } = useCharacterSheet(sheetRef)
const { query, levels, schools, classNames, filteredSpells, pending, isClassListLoading, reset } = useSpellCatalogSearch(() => characterSheet.ruleset)

const CASTER_CLASSES = ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin', 'Rôdeur']
const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']

const classOptions = CASTER_CLASSES.map(value => ({ value, label: value }))
const schoolOptions = computed(() => SCHOOLS.map(value => ({ value, label: t(`schools.${value}`) })))
const levelOptions = computed(() => Array.from({ length: 10 }, (_, value) => ({ value, label: value === 0 ? t('sheet.add_spell.cantrips') : t('sheet.grimoire.level_short', { level: value }) })))

const levelLabel = (spellLevel: number) => (spellLevel === 0 ? t('sheet.add_spell.cantrip') : t('sheet.grimoire.level', { level: spellLevel }))
const schoolOf = (spell: CatalogSpell) => (spell.school?.name ? t(`schools.${spell.school.name}`) : '')

// Added during this visit: they can be taken back here. A spell owned before stays locked.
const addedIds = ref<number[]>([])
const busyIds = ref<number[]>([])
const hasError = ref(false)
const ownedBefore = ref(new Set<number>())
const isOwned = (spellId: number) => ownedBefore.value.has(spellId)

const focusedId = ref<number | null>(null)
const focusedSpell = computed(() => filteredSpells.value.find(spell => spell.id === focusedId.value) ?? filteredSpells.value[0] ?? null)

const handleToggle = async (spell: CatalogSpell) => {
  if (isOwned(spell.id) || busyIds.value.includes(spell.id)) return
  focusedId.value = spell.id
  busyIds.value = [...busyIds.value, spell.id]
  hasError.value = false
  try {
    if (addedIds.value.includes(spell.id)) {
      await removeSpell(spell.id)
      addedIds.value = addedIds.value.filter(id => id !== spell.id)
    } else {
      await addSpell(spell.id, activeCasterClass.value?.classId ?? null)
      addedIds.value = [...addedIds.value, spell.id]
    }
  } catch {
    hasError.value = true
  } finally {
    busyIds.value = busyIds.value.filter(id => id !== spell.id)
  }
}

watch(open, (isOpen) => {
  if (!isOpen) return
  ownedBefore.value = new Set((characterSpells.value ?? []).map(cs => cs.spellId))
  addedIds.value = []
  hasError.value = false
  focusedId.value = null
  const casterClass = activeCasterClass.value?.className
  reset(casterClass && CASTER_CLASSES.includes(casterClass) ? [casterClass] : [])
})
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.error {
  font-size: 12.5px;
  color: var(--color-ds-bad);
}

.filters {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 6px 12px;
}

.catalog {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
  min-height: 240px;
}

.catalog__list {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-bottom: 1px solid var(--color-ds-line);
}

.result--focused { background: var(--color-ds-panel-raised); }
.result--owned .result__name { color: var(--color-ds-mute); }

.result__box { flex-shrink: 0; }

.result__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  text-align: left;
  color: inherit;
}

.result__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.result__sub {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.result__owned {
  flex-shrink: 0;
  font-size: 10.5px;
  color: var(--color-ds-gold);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-ds-panel-raised);
}

.preview__name {
  font-family: var(--font-bodoni);
  font-size: 20px;
  font-weight: 700;
}

.preview__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  font-size: 12.5px;
}

.preview__description {
  max-height: 140px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}

.preview__status { margin-top: auto; }

.footer__count { margin-right: auto; }
</style>
