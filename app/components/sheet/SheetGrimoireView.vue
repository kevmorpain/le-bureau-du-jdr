<template>
  <div class="grimoire">
    <section class="grimoire__main">
      <DsBlock
        v-if="casterRows.length"
        class="casters"
      >
        <table class="casters__table">
          <thead>
            <tr>
              <th>{{ $t('sheet.grimoire.columns.class') }}</th>
              <th>{{ $t('sheet.grimoire.columns.ability') }}</th>
              <th>{{ $t('sheet.grimoire.columns.dc') }}</th>
              <th>{{ $t('sheet.grimoire.columns.attack') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in casterRows"
              :key="row.classId"
            >
              <td class="casters__name">
                {{ row.className }}
              </td>
              <td>{{ $t(`ability_scores.${row.ability}`) }}</td>
              <td class="ds-number">
                {{ row.dc ?? '—' }}
              </td>
              <td class="ds-number">
                {{ row.attackBonus === null ? '—' : formatModifier(row.attackBonus) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="slotRows.length"
          class="slots"
        >
          <span class="ds-label">{{ $t('sheet.grimoire.slots') }}</span>
          <span
            v-for="row in slotRows"
            :key="row.key"
            class="slots__group"
          >
            <b>{{ row.label }}</b>
            <DsCounter
              :model-value="row.current"
              :max="row.max"
              :aria-label="$t('sheet.grimoire.slots_of', { level: row.label, value: row.current, max: row.max })"
              readonly
            />
          </span>
        </div>
        <p
          v-if="preparedLimit !== null"
          class="prepared"
        >
          {{ $t('sheet.grimoire.prepared_count', { count: preparedCount, limit: preparedLimit }) }}
        </p>
      </DsBlock>

      <DsCategoryTabs
        v-model="level"
        :options="levelOptions"
        :label="$t('sheet.grimoire.levels_label')"
      />

      <div class="toolbar">
        <DsChips
          v-model="flags"
          :options="flagOptions"
          :label="$t('sheet.grimoire.flags_label')"
        />
        <DsTextField
          v-model="search"
          :label="$t('sheet.grimoire.search')"
          :placeholder="$t('sheet.grimoire.search')"
          icon="search"
          :width="170"
          class="toolbar__search"
        />
        <DsLinkButton
          plus
          :label="$t('sheet.grimoire.add')"
          @click="isAddOpen = true"
        />
      </div>

      <div
        class="list-head"
        :class="{ 'list-head--narrow': !!selectedSpell }"
        aria-hidden="true"
      >
        <span>{{ $t('sheet.grimoire.columns.spell') }}</span>
        <span>{{ $t('sheet.grimoire.columns.casting_time') }}</span>
        <span class="wide">{{ $t('sheet.grimoire.columns.range') }}</span>
        <span class="wide">{{ $t('sheet.grimoire.columns.duration') }}</span>
        <span class="wide">{{ $t('sheet.grimoire.columns.traits') }}</span>
      </div>

      <div class="grimoire__list">
        <p
          v-if="!groups.length"
          class="empty"
        >
          {{ characterSpells.length ? $t('sheet.grimoire.empty_filtered') : $t('sheet.grimoire.empty') }}
        </p>

        <section
          v-for="group in groups"
          :key="group.level"
          class="group"
          :aria-label="levelLabel(group.level)"
        >
          <DsGroupTitle :label="levelLabel(group.level)" />
          <button
            v-for="cs in group.spells"
            :key="cs.spellId"
            type="button"
            class="spell-row"
            :class="{ 'spell-row--selected': cs.spellId === selectedId, 'spell-row--narrow': !!selectedSpell }"
            :aria-pressed="cs.spellId === selectedId"
            @click="handleSelect(cs.spellId)"
          >
            <span class="spell-row__name">
              <b>{{ cs.spell.name }}</b>
              <small>
                {{ schoolOf(cs) }}
                <span
                  v-if="spellSourceLabel(cs.source)"
                  class="spell-row__source"
                >{{ spellSourceLabel(cs.source) }}</span>
              </small>
            </span>
            <span class="spell-row__cell">
              <DsCostTag
                v-if="spellCostTagOf(cs.spell.castingTime)"
                :cost="spellCostTagOf(cs.spell.castingTime)!"
              />
              {{ cs.spell.castingTime }}
            </span>
            <span class="spell-row__cell wide">{{ formatRange(cs.spell.range) }}</span>
            <span class="spell-row__cell wide">{{ cs.spell.duration }}</span>
            <span class="spell-row__traits wide">
              <span
                v-if="cs.spell.concentration"
                class="trait"
              ><DsIcon
                name="concentration"
                :size="11"
              />{{ $t('sheet.grimoire.flags.concentration') }}</span>
              <span
                v-if="cs.spell.ritual"
                class="trait"
              ><DsIcon
                name="ritual"
                :size="11"
              />{{ $t('sheet.grimoire.flags.ritual') }}</span>
              <DsBadge
                v-if="statusOf(cs) === 'prepared' || statusOf(cs) === 'always'"
                :label="$t(`sheet.grimoire.statuses.${statusOf(cs)}`)"
                variant="equipped"
              />
            </span>
          </button>
        </section>
      </div>
    </section>

    <SheetPlayDrawer
      v-if="selectedSpell && selectedCard && selectedDetail"
      :card="selectedCard"
      :detail="selectedDetail"
      :actions="[]"
      @close="selectedId = null"
    >
      <DsGroupTitle :label="$t('sheet.grimoire.management')" />
      <dl class="manage">
        <dt>{{ $t('sheet.grimoire.source') }}</dt>
        <dd>{{ sourceOf(selectedSpell) }}</dd>
        <dt>{{ $t('sheet.grimoire.status') }}</dt>
        <dd>{{ $t(`sheet.grimoire.statuses.${statusOf(selectedSpell)}`) }}</dd>
      </dl>
      <p
        v-if="isPreparedFull && statusOf(selectedSpell) === 'unprepared'"
        class="manage__note"
      >
        {{ $t('sheet.grimoire.prepared_full', { limit: preparedLimit }) }}
      </p>

      <template #actions>
        <DsButton
          v-for="action in selectedActions"
          :key="action.key"
          :label="action.label"
          :detail="action.detail"
          :variant="action.variant"
          :disabled="action.isDisabled"
          block
          class="grimoire__action"
          @click="handleAction(action.key)"
        />
      </template>
    </SheetPlayDrawer>

    <DsConfirmModal
      v-model:open="isRemoveOpen"
      :title="$t('sheet.grimoire.remove.title')"
      :confirm-label="$t('sheet.grimoire.remove.confirm')"
      @confirm="handleConfirmRemove"
    >
      <p>{{ $t('sheet.grimoire.remove.body', { name: selectedSpell?.spell.name ?? '' }) }}</p>
    </DsConfirmModal>

    <ClientOnly>
      <SheetAddSpellWindow
        v-model:open="isAddOpen"
        :character-sheet="characterSheet"
      />
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import type { CharacterSpellWithSpell } from '~/composables/character/useCharacterSpells'
import { hasAvailableSlot } from '~/composables/character/useCharacterSpells'
import type { SlotsByType } from '~/composables/character/useCharacterSpellcasting'
import { usePlayCardDetails } from '~/composables/character/usePlayCardDetails'
import { usePreparedSpells } from '~/composables/character/usePreparedSpells'
import { useSpellCasting } from '~/composables/character/useSpellCasting'
import { toSpellCard } from '~/utils/playCards'
import { spellSourceLabel } from '~/utils/spellSources'
import { spellCostTagOf } from '~~/shared/rules/actionCost'
import { matchesSearch } from '~~/shared/utils/search'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const { t } = useI18n()
const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!
const sheet = useCharacterSheet(characterSheet)
const { characterSpells, spellcasterClasses, statsForCasterClass, togglePrepared, removeSpell } = sheet
const spellCasting = useSpellCasting(characterSheet, { ...sheet, spellSlots })
const { getDetail } = usePlayCardDetails({ ...sheet, spellSlots, spellCasting })
const { preparedLimit, preparedCount } = usePreparedSpells(characterSheet, sheet)

const casterRows = computed(() => spellcasterClasses.value.map((caster) => {
  const stats = statsForCasterClass(caster.classId)
  return { ...caster, dc: stats?.dc ?? null, attackBonus: stats?.attackBonus ?? null }
}))

const slotRows = computed(() => [
  ...Object.entries(spellSlots.value.pact_magic ?? {}).map(([slotLevel, slot]) => ({ key: `pact-${slotLevel}`, label: t('sheet.grimoire.pact_level', { level: slotLevel }), ...slot })),
  ...Object.entries(spellSlots.value.spellcasting ?? {}).map(([slotLevel, slot]) => ({ key: `slot-${slotLevel}`, label: t('sheet.grimoire.slot_level', { level: slotLevel }), ...slot })),
].filter(row => row.max > 0))

const spells = computed<CharacterSpellWithSpell[]>(() => characterSpells.value ?? [])

const levelLabel = (spellLevel: number) =>
  spellLevel === 0 ? t('sheet.grimoire.cantrips') : t('sheet.grimoire.level', { level: spellLevel })

const level = ref<number | 'all'>('all')
const levelOptions = computed(() => {
  const present = [...new Set(spells.value.map(cs => cs.spell.level))].sort((a, b) => a - b)
  return [
    { value: 'all' as const, label: t('sheet.grimoire.all'), count: spells.value.length },
    ...present.map(value => ({
      value,
      label: value === 0 ? t('sheet.grimoire.cantrips') : t('sheet.grimoire.level_short', { level: value }),
      count: spells.value.filter(cs => cs.spell.level === value).length,
    })),
  ]
})

type Flag = 'concentration' | 'ritual'
const flags = ref<Flag[]>([])
const flagOptions = computed(() => (['concentration', 'ritual'] as const).map(value => ({ value, label: t(`sheet.grimoire.flags.${value}`) })))
const search = ref('')

const groups = computed(() => {
  const visible = spells.value
    .filter(cs => (level.value === 'all' || cs.spell.level === level.value)
      && (!flags.value.includes('concentration') || cs.spell.concentration)
      && (!flags.value.includes('ritual') || cs.spell.ritual)
      && matchesSearch(cs.spell.name, search.value))
    .sort((a, b) => a.spell.name.localeCompare(b.spell.name, 'fr'))
  return [...new Set(visible.map(cs => cs.spell.level))]
    .sort((a, b) => a - b)
    .map(spellLevel => ({ level: spellLevel, spells: visible.filter(cs => cs.spell.level === spellLevel) }))
})

const schoolOf = (cs: CharacterSpellWithSpell) => {
  const school = (cs.spell as { school?: { name: string } | null }).school?.name
  return school ? t(`schools.${school}`) : ''
}

type SpellStatus = 'always' | 'prepared' | 'unprepared' | 'known'
const statusOf = (cs: CharacterSpellWithSpell): SpellStatus => {
  if (cs.alwaysPrepared) return 'always'
  if (cs.spell.level === 0 || preparedLimit.value === null) return 'known'
  return cs.isPrepared ? 'prepared' : 'unprepared'
}

const sourceOf = (cs: CharacterSpellWithSpell) =>
  spellSourceLabel(cs.source) || spellcasterClasses.value.find(caster => caster.classId === cs.classId)?.className || t('sheet.grimoire.no_source')

const isPreparedFull = computed(() => preparedLimit.value !== null && preparedCount.value >= preparedLimit.value)

const selectedId = ref<number | null>(null)
const selectedSpell = computed(() => spells.value.find(cs => cs.spellId === selectedId.value) ?? null)
const selectedCard = computed(() => {
  const cs = selectedSpell.value
  if (!cs) return null
  const arcanumRemaining = spellCasting.getArcanumRemaining(cs)
  return toSpellCard({
    spellId: cs.spellId,
    isArcanum: spellCasting.isArcanumSpell(cs),
    hasSlotAvailable: hasAvailableSlot(spellSlots.value, cs.spell.level),
    arcanumUses: arcanumRemaining === null ? null : { max: 1, remaining: arcanumRemaining },
    spell: cs.spell,
  })
})
// Casting at a chosen level belongs to the play view: the grimoire drawer only reads the spell.
const selectedDetail = computed(() => (selectedSpell.value && selectedCard.value
  ? { ...getDetail(selectedCard.value, { kind: 'spell', characterSpell: selectedSpell.value }), slotOptions: [] }
  : null))

const handleSelect = (spellId: number) => {
  selectedId.value = selectedId.value === spellId ? null : spellId
}

type GrimoireActionKey = 'ritual' | 'prepare' | 'remove'
const selectedActions = computed(() => {
  const cs = selectedSpell.value
  if (!cs) return []
  const status = statusOf(cs)
  const actions: { key: GrimoireActionKey, label: string, detail?: string, variant: 'primary' | 'secondary', isDisabled: boolean }[] = []
  if (spellCasting.canRitual(cs)) actions.push({ key: 'ritual', label: t('sheet.grimoire.actions.ritual'), variant: 'primary', isDisabled: false })
  if (status === 'prepared' || status === 'unprepared') {
    actions.push({
      key: 'prepare',
      label: t(status === 'prepared' ? 'sheet.grimoire.actions.unprepare' : 'sheet.grimoire.actions.prepare'),
      variant: actions.length ? 'secondary' : 'primary',
      isDisabled: status === 'unprepared' && isPreparedFull.value,
    })
  }
  if (status !== 'always') actions.push({ key: 'remove', label: t('sheet.grimoire.actions.remove'), variant: 'secondary', isDisabled: false })
  return actions
})

const isRemoveOpen = ref(false)
const isAddOpen = ref(false)

const handleAction = async (key: GrimoireActionKey) => {
  const cs = selectedSpell.value
  if (!cs) return
  if (key === 'ritual') spellCasting.castAsRitual(cs)
  else if (key === 'prepare') await togglePrepared(cs.spellId, !cs.isPrepared)
  else isRemoveOpen.value = true
}

const handleConfirmRemove = async () => {
  const cs = selectedSpell.value
  if (!cs) return
  selectedId.value = null
  await removeSpell(cs.spellId)
}
</script>

<style scoped>
.grimoire {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
}

.grimoire__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.grimoire__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  margin-right: -6px;
  padding-right: 6px;
  overflow-y: auto;
}

.casters__table {
  width: 100%;
  font-size: 12.5px;
  border-collapse: collapse;
}

.casters__table th {
  padding: 2px 6px 4px 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-align: left;
  text-transform: uppercase;
  color: var(--color-ds-faint);
}

.casters__table td {
  padding: 5px 6px 5px 0;
  border-top: 1px solid var(--color-ds-line);
}

.casters__table td.ds-number { font-size: 17px; }

.casters__name {
  font-family: var(--font-bodoni);
  font-size: 15px;
  font-weight: 700;
}

.slots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  padding-top: 6px;
  border-top: 1px solid var(--color-ds-line);
}

.slots__group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.prepared {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.toolbar__search { margin-left: auto; }

.list-head,
.spell-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 80px 80px 120px;
  align-items: center;
  gap: 8px;
}

.list-head--narrow,
.spell-row--narrow { grid-template-columns: minmax(0, 1fr) auto; }

.list-head--narrow .wide,
.spell-row--narrow .wide { display: none; }

.list-head {
  padding: 0 8px 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ds-faint);
  border-bottom: 1px solid var(--color-ds-line);
}

.empty {
  padding: 12px 4px;
  font-size: 13px;
  color: var(--color-ds-mute);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spell-row {
  padding: 7px 8px;
  text-align: left;
  color: var(--color-ds-ink);
  border-bottom: 1px solid var(--color-ds-line);
}

.spell-row:hover { background: var(--color-ds-panel); }

.spell-row--selected {
  background: var(--color-ds-panel-raised);
  box-shadow: inset 3px 0 0 var(--color-ds-gold);
}

.spell-row__name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spell-row__name b { font-size: 13px; }

.spell-row__name small {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: var(--color-ds-mute);
}

.spell-row__source { color: var(--color-ds-spell); }

.spell-row__cell {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-ds-mute);
}

.spell-row__traits {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.trait {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-ds-mute);
}

.manage {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  padding: 8px 10px;
  font-size: 12px;
  background: var(--color-ds-panel-raised);
}

.manage dt {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.manage__note {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.grimoire__action { width: 240px; }
</style>
