<template>
  <div class="flex w-full flex-col gap-1.5">
    <div
      role="meter"
      aria-label="Points de vie"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="after.current"
      :aria-valuetext="valueText"
      class="relative h-4 w-full overflow-hidden bg-ds-panel-raised shadow-[inset_0_0_0_1px_var(--color-ds-line)]"
    >
      <i
        v-for="segment in segments"
        :key="segment.kind"
        class="absolute inset-y-0"
        :class="SEGMENT[segment.kind]"
        :style="{ left: `${segment.start * 100}%`, width: `${segment.width * 100}%` }"
        :data-segment="segment.kind"
      />
    </div>
    <div
      v-if="legend"
      class="flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-ds-mute"
    >
      <span
        v-for="kind in legendKinds"
        :key="kind"
        class="inline-flex items-center gap-1.5"
      >
        <i
          class="h-[9px] w-3.5 shadow-[inset_0_0_0_1px_var(--color-ds-line)]"
          :class="SEGMENT[kind]"
        />{{ LEGEND[kind] }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
type SegmentKind = 'hp' | 'lost' | 'recovered' | 'temp' | 'absorbed'
interface HpState { current: number, temp: number }

const props = withDefaults(defineProps<{
  max: number
  current: number
  temp?: number
  // État après l'action prévisualisée (dégâts, soins, repos) ; sans lui, la barre montre l'état actuel.
  preview?: HpState | null
  legend?: boolean
}>(), { temp: 0, preview: null, legend: false })

const SEGMENT: Record<SegmentKind, string> = {
  hp: 'bg-ds-hp',
  lost: 'ds-hatch-lost',
  recovered: 'bg-ds-gain',
  temp: 'bg-ds-ink',
  absorbed: 'ds-hatch-absorbed',
}

const LEGEND: Record<SegmentKind, string> = {
  hp: 'PV',
  lost: 'perdus',
  temp: 'temporaires',
  absorbed: 'absorbés',
  recovered: 'récupérés',
}

const before = computed<HpState>(() => ({ current: props.current, temp: props.temp }))
const after = computed<HpState>(() => props.preview ?? before.value)

const segments = computed(() => {
  const hpBefore = before.value.current
  const hpAfter = after.value.current
  const tempBefore = before.value.temp
  const tempAfter = after.value.temp
  const scale = Math.max(props.max + Math.max(tempBefore, tempAfter), 1)
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

const legendKinds = computed(() => (Object.keys(LEGEND) as SegmentKind[]).filter(kind => segments.value.some(s => s.kind === kind)))

const valueText = computed(() => {
  const { current, temp } = after.value
  const base = `${current} sur ${props.max}`
  const withTemp = temp ? `${base}, ${temp} temporaires` : base
  return props.preview && current !== props.current ? `${withTemp} (actuellement ${props.current})` : withTemp
})
</script>
