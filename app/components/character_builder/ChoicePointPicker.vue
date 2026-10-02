<template>
  <div class="rounded-xl border border-amber-500/40 bg-(--ui-bg-elevated) p-4">
    <div class="flex items-center gap-2 mb-3">
      <p class="text-xs font-semibold text-amber-400">
        {{ title ?? defaultTitle }}
      </p>
      <span
        class="text-xs font-semibold"
        :class="picks.length === count ? 'text-green-400' : 'text-muted'"
      >
        {{ picks.length }}/{{ count }}
      </span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in visibleOptions"
        :key="opt.value"
        type="button"
        class="rounded-lg border px-2.5 py-1 text-xs transition-colors"
        :class="picks.includes(opt.value)
          ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-medium cursor-pointer'
          : picks.length >= count
            ? 'border-(--ui-border) text-muted/40 cursor-not-allowed opacity-45'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40 cursor-pointer'"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
    <p
      v-if="duplicateLabels"
      class="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
    >
      ⚠️ Déjà maîtrisé par ailleurs : <strong>{{ duplicateLabels }}</strong>. Ce choix est gaspillé — remplace-le.
    </p>
  </div>
</template>

<script lang="ts" setup>
import type { ChoiceKind } from '~~/shared/rules/choices'
import { LANGUAGE_LABELS, languageLabel } from '~~/shared/rules/languages'
import { SKILLS } from '~/data/character-builder'

// Un choix de maîtrise (compétence, outil, langue), de sort mineur ou de terrain : point de choix ou choix d'un don. Les
// options sont des valeurs de pick (`optionPickValue`). Les valeurs déjà acquises
// ailleurs (`owned`) sont masquées pour ne pas gaspiller le choix ; un pick devenu doublon après coup reste
// affiché (masqué, il ne serait plus désélectionnable) et signalé.
const props = defineProps<{
  kind: ChoiceKind
  count: number
  options: Array<string | number>
  owned?: Array<string | number>
  title?: string
}>()
const picks = defineModel<Array<string | number>>({ default: () => [] })

const DEFAULT_TITLES: Partial<Record<ChoiceKind, string>> = {
  skill: 'Compétences au choix',
  tool: 'Maîtrise d\'outil au choix',
  language: 'Langue au choix',
  cantrip: 'Sort mineur au choix',
  terrain: 'Terrain du cercle',
}

const { extendedQuery } = useExtendedContent()
const { data: spells } = useFetch<Array<{ id: number, name: string }>>('/api/spells', {
  query: extendedQuery,
  default: () => [],
  immediate: props.kind === 'cantrip',
})

// Un choix d'outil peut proposer des langues à la place (`orLanguages`, Marchand de guilde).
const isLanguageKey = (value: string | number) => typeof value === 'string' && value in LANGUAGE_LABELS
const defaultTitle = computed(() =>
  props.kind === 'tool' && props.options.some(isLanguageKey) ? 'Outil ou langue au choix' : DEFAULT_TITLES[props.kind])

function labelOf(value: string | number): string {
  if (props.kind === 'skill') return SKILLS.find(s => s.key === value)?.label ?? String(value)
  if (props.kind === 'cantrip') return spells.value?.find(s => s.id === value)?.name ?? '…'
  return isLanguageKey(value) ? languageLabel(String(value)) : String(value)
}

const sortedOptions = computed(() => props.options
  .map(value => ({ value, label: labelOf(value) }))
  .sort((a, b) => a.label.localeCompare(b.label, 'fr')))

const isOwned = (value: string | number) => (props.owned ?? []).includes(value)
const visibleOptions = computed(() => sortedOptions.value.filter(o => !isOwned(o.value) || picks.value.includes(o.value)))
const duplicateLabels = computed(() => picks.value.filter(isOwned).map(labelOf).join(', '))

function toggle(value: string | number) {
  if (picks.value.includes(value)) picks.value = picks.value.filter(v => v !== value)
  else if (picks.value.length < props.count) picks.value = [...picks.value, value]
}
</script>
