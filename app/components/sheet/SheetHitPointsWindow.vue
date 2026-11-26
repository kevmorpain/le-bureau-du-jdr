<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.hit_points.title')"
    :description="summary"
  >
    <template #modes>
      <DsSegmented
        v-model="mode"
        :options="modeOptions"
        :label="$t('sheet.hit_points.mode')"
      />
    </template>

    <p class="window-sub">
      {{ summary }}
    </p>

    <template v-if="mode === 'damage'">
      <section
        v-for="(source, sourceIndex) in sources"
        :key="sourceIndex"
        class="source"
      >
        <DsGroupTitle :label="sources.length === 1 ? $t('sheet.hit_points.source_single') : $t('sheet.hit_points.source', { n: sourceIndex + 1 })" />
        <div
          v-for="(line, lineIndex) in source.lines"
          :key="lineIndex"
          class="source__line"
        >
          <div class="source__inputs">
            <DsNumberField
              v-model="line.amount"
              :label="$t('sheet.hit_points.damage_amount')"
              :min="0"
            />
            <DsSelectField
              v-model="line.type"
              :options="damageTypeOptions"
              :label="$t('sheet.hit_points.damage_type')"
            />
            <DsCornerButton
              v-if="source.lines.length > 1 || sources.length > 1"
              :label="$t('sheet.hit_points.remove_line')"
              @click="handleRemoveLine(sourceIndex, lineIndex)"
            />
          </div>
          <p
            v-if="lineNote(line)"
            class="source__note"
          >
            {{ lineNote(line) }}
          </p>
        </div>
        <DsCheckbox
          v-if="canDodge"
          v-model="source.dodged"
          :label="$t('sheet.hit_points.dodge')"
        />
        <DsLinkButton
          plus
          :label="$t('sheet.hit_points.add_line')"
          @click="source.lines.push(emptyLine())"
        />
      </section>
      <DsLinkButton
        plus
        :label="$t('sheet.hit_points.add_source')"
        @click="sources.push(emptySource())"
      />
      <DsCheckbox
        v-if="isDying"
        v-model="isCritical"
        :label="$t('sheet.hit_points.critical_at_zero')"
      />
    </template>

    <section
      v-else
      class="source"
    >
      <DsGroupTitle :label="$t(`sheet.hit_points.${mode}_amount`)" />
      <div>
        <DsNumberField
          v-model="amount"
          :label="$t(`sheet.hit_points.${mode}_amount`)"
          :min="0"
          :width="110"
        />
      </div>
      <p class="window-hint">
        {{ $t(`sheet.hit_points.${mode}_note`) }}
      </p>
    </section>

    <div class="preview">
      <p class="preview__value">
        <span class="ds-number">{{ previewText }}</span>
        <span
          v-if="mode !== 'temp'"
          class="preview__max"
        >/ {{ effectiveMaxHp }}</span>
      </p>
      <DsHpBar
        :max="effectiveMaxHp"
        :current="characterSheet.currentHp"
        :temp="characterSheet.temporaryHp ?? 0"
        :preview="preview"
        legend
      />
    </div>

    <p
      v-for="alert in alerts"
      :key="alert"
      class="alert"
      role="note"
    >
      {{ alert }}
    </p>

    <template #footer="{ close }">
      <DsLinkButton
        :label="$t('ds.cancel')"
        @click="close"
      />
      <DsButton
        :label="$t('sheet.hit_points.apply')"
        :disabled="!canApply"
        @click="handleApply(close)"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import type { DsOption } from '~/components/ds/DsSegmented.vue'
import { useHitPointActions, type DamageSourceInput } from '~/composables/character/useHitPointActions'
import type { DamageTypeKey } from '~~/server/db/schema/effects'
import { concentrationSaveDc } from '~~/shared/rules/damage'
import { damageTypeLabels } from '~~/shared/utils/labels'

type Mode = 'damage' | 'heal' | 'temp'
interface LineDraft { amount: number | null, type: DamageTypeKey | 'none' }
interface SourceDraft { lines: LineDraft[], dodged: boolean }

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })
const { initialMode = 'damage' } = defineProps<{ initialMode?: Mode }>()

const { t } = useI18n()
const { effectiveMaxHp, isDying, isConcentrating, concentrationName } = useCharacterSheet(characterSheet)
const { canDodge, defenseFor, damageOf, previewDamage, previewHealing, previewTemporary, applyDamage, heal, gainTemporary } = useHitPointActions(characterSheet)

const emptyLine = (): LineDraft => ({ amount: null, type: 'none' })
const emptySource = (): SourceDraft => ({ lines: [emptyLine()], dodged: false })

const mode = ref<Mode>(initialMode)
const sources = ref<SourceDraft[]>([emptySource()])
const amount = ref<number | null>(null)
const isCritical = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  mode.value = initialMode
  sources.value = [emptySource()]
  amount.value = null
  isCritical.value = false
})

const modeOptions = computed<DsOption<Mode>[]>(() => (['damage', 'heal', 'temp'] as const).map(value => ({ value, label: t(`sheet.hit_points.modes.${value}`) })))

const damageTypeOptions = computed<DsOption<DamageTypeKey | 'none'>[]>(() => [
  { value: 'none', label: t('sheet.hit_points.no_type') },
  ...(Object.entries(damageTypeLabels) as [DamageTypeKey, string][])
    .sort(([, a], [, b]) => a.localeCompare(b, 'fr'))
    .map(([value, label]) => ({ value, label })),
])

const summary = computed(() => {
  const base = t('ds.hp.value', { current: characterSheet.value.currentHp, max: effectiveMaxHp.value })
  return characterSheet.value.temporaryHp ? t('sheet.hit_points.summary_temp', { value: base, temp: characterSheet.value.temporaryHp }) : base
})

const toInput = (source: SourceDraft): DamageSourceInput => ({
  lines: source.lines.map(line => ({ amount: line.amount ?? 0, type: line.type === 'none' ? null : line.type })),
  dodged: source.dodged,
})

const inputs = computed(() => sources.value.map(toInput))
const damageResult = computed(() => previewDamage(inputs.value, { critical: isCritical.value }))

const lineNote = (line: LineDraft) => {
  const defense = line.type === 'none' ? null : defenseFor(line.type)
  if (!defense || !line.amount) return null
  const after = damageOf({ lines: [{ amount: line.amount, type: line.type === 'none' ? null : line.type }] })
  return t(`sheet.hit_points.defense.${defense}`, { type: damageTypeLabels[line.type as DamageTypeKey].toLowerCase(), from: line.amount, to: after })
}

const preview = computed(() => {
  const state = mode.value === 'damage'
    ? damageResult.value.state
    : mode.value === 'heal' ? previewHealing(amount.value ?? 0) : previewTemporary(amount.value ?? 0)
  return { current: state.currentHp, temp: state.temporaryHp }
})

const previewText = computed(() => {
  const hp = characterSheet.value.currentHp
  if (mode.value === 'temp') return t('sheet.hit_points.preview_temp', { from: characterSheet.value.temporaryHp ?? 0, to: preview.value.temp })
  return t('sheet.hit_points.preview', { from: hp, to: preview.value.current })
})

const alerts = computed(() => {
  if (mode.value !== 'damage') return []
  const result = damageResult.value
  if (result.instantDeath) return [t('sheet.hit_points.alerts.instant_death')]
  const list: string[] = []
  if (result.deathSaveFailuresAdded) list.push(t('sheet.hit_points.alerts.death_save_failures', result.deathSaveFailuresAdded))
  if (!isConcentrating.value || !concentrationName.value) return list
  if (result.state.currentHp === 0) return [...list, t('sheet.hit_points.alerts.concentration_ends', { spell: concentrationName.value })]
  return [...list, ...result.sources.flatMap((source, index) => {
    const taken = damageOf(inputs.value[index]!) - source.absorbedByTemporary
    if (taken <= 0) return []
    const label = sources.value.length > 1 ? t('sheet.hit_points.source', { n: index + 1 }) : null
    return [t('sheet.hit_points.alerts.concentration_save', { spell: concentrationName.value, dc: concentrationSaveDc(taken), source: label ? ` · ${label}` : '' })]
  })]
})

const canApply = computed(() => (mode.value === 'damage'
  ? inputs.value.some(source => source.lines.some(line => line.amount > 0))
  : (amount.value ?? 0) > 0))

const handleRemoveLine = (sourceIndex: number, lineIndex: number) => {
  const source = sources.value[sourceIndex]!
  source.lines.splice(lineIndex, 1)
  if (!source.lines.length) sources.value.splice(sourceIndex, 1)
  if (!sources.value.length) sources.value.push(emptySource())
}

const handleApply = (close: () => void) => {
  if (!canApply.value) return
  if (mode.value === 'damage') applyDamage(inputs.value.filter(source => source.lines.some(line => line.amount > 0)), { critical: isCritical.value })
  else if (mode.value === 'heal') heal(amount.value ?? 0)
  else gainTemporary(amount.value ?? 0)
  close()
}
</script>

<style scoped>
.window-sub,
.window-hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.source {
  display: flex;
  padding: 10px 12px;
  background: var(--color-ds-panel-raised);
  flex-direction: column;
  gap: 8px;
}

.source__line {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source__inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source__note {
  font-size: 12px;
  color: var(--color-ds-gain);
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 22px;
}

.preview__max {
  font-size: 13px;
  color: var(--color-ds-mute);
}

.alert {
  padding: 6px 10px;
  font-size: 12.5px;
  background: color-mix(in srgb, var(--color-ds-bad) 12%, var(--color-ds-panel));
  box-shadow: inset 3px 0 0 var(--color-ds-bad);
}
</style>
