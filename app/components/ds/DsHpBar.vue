<template>
  <div class="hp">
    <div
      role="meter"
      :aria-label="$t('ds.hp.label')"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="after.current"
      :aria-valuetext="valueText"
      class="hp__bar"
    >
      <i
        v-for="segment in segments"
        :key="segment.kind"
        class="hp__segment"
        :class="`hp__segment--${segment.kind}`"
        :style="{ left: `${segment.start * 100}%`, width: `${segment.width * 100}%` }"
        :data-segment="segment.kind"
      />
    </div>
    <div
      v-if="legend"
      class="hp__legend"
    >
      <span
        v-for="kind in legendKinds"
        :key="kind"
        class="hp__legend-item"
      >
        <i
          class="hp__swatch"
          :class="`hp__segment--${kind}`"
        />{{ $t(`ds.hp.legend.${kind}`) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
type SegmentKind = 'hp' | 'lost' | 'recovered' | 'temp' | 'absorbed'
interface HpState { current: number, temp: number }

const LEGEND_ORDER: SegmentKind[] = ['hp', 'lost', 'temp', 'absorbed', 'recovered']

const { max, current, temp = 0, preview = null, legend = false } = defineProps<{
  max: number
  current: number
  temp?: number
  preview?: HpState | null
  legend?: boolean
}>()

const { t } = useI18n()

const before = computed<HpState>(() => ({ current, temp }))
const after = computed<HpState>(() => preview ?? before.value)

const segments = computed(() => {
  const hpBefore = before.value.current
  const hpAfter = after.value.current
  const tempBefore = before.value.temp
  const tempAfter = after.value.temp
  const scale = Math.max(max + Math.max(tempBefore, tempAfter), 1)
  const list: { kind: SegmentKind, start: number, width: number }[] = []
  const push = (kind: SegmentKind, from: number, to: number) => {
    if (to > from) list.push({ kind, start: from / scale, width: (to - from) / scale })
  }

  push('hp', 0, Math.min(hpBefore, hpAfter))
  push('lost', hpAfter, hpBefore)
  push('recovered', hpBefore, hpAfter)
  const tempStart = Math.max(hpBefore, hpAfter)
  push('temp', tempStart, tempStart + tempAfter)
  push('absorbed', tempStart + tempAfter, tempStart + tempBefore)
  return list
})

const legendKinds = computed(() => LEGEND_ORDER.filter(kind => segments.value.some(s => s.kind === kind)))

const valueText = computed(() => {
  const base = t('ds.hp.value', { current: after.value.current, max })
  const withTemp = after.value.temp ? t('ds.hp.with_temp', { value: base, temp: after.value.temp }) : base
  return preview && after.value.current !== current ? t('ds.hp.previewed', { value: withTemp, current }) : withTemp
})
</script>

<style scoped>
.hp {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.hp__bar {
  position: relative;
  width: 100%;
  height: 16px;
  overflow: hidden;
  background: var(--color-ds-panel-raised);
  box-shadow: inset 0 0 0 1px var(--color-ds-line);
}

.hp__segment {
  position: absolute;
  top: 0;
  bottom: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .hp__segment { transition: left 0.3s ease, width 0.3s ease; }
}

.hp__segment--hp { background: var(--color-ds-hp); }
.hp__segment--lost { background: repeating-linear-gradient(45deg, var(--color-ds-bad) 0 3px, transparent 3px 6px); }
.hp__segment--recovered { background: var(--color-ds-gain); }
.hp__segment--temp { background: var(--color-ds-ink); }
.hp__segment--absorbed { background: repeating-linear-gradient(45deg, var(--color-ds-mute) 0 3px, transparent 3px 6px); }

.hp__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 11.5px;
  color: var(--color-ds-mute);
}

.hp__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hp__swatch {
  position: static;
  width: 14px;
  height: 9px;
  box-shadow: inset 0 0 0 1px var(--color-ds-line);
}
</style>
