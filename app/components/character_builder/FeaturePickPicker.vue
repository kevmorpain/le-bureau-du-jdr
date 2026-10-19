<template>
  <div
    class="rounded-xl border bg-(--ui-bg-elevated) p-4"
    :class="theme.frame"
  >
    <div class="flex items-center gap-2 mb-3">
      <p
        class="text-xs font-semibold"
        :class="theme.title"
      >
        {{ title }}
      </p>
      <span
        v-if="effectiveCount > 0"
        class="text-xs font-semibold"
        :class="picks.length === effectiveCount ? 'text-green-400' : 'text-muted'"
      >
        {{ picks.length }}/{{ effectiveCount }}
      </span>
    </div>

    <div
      v-if="replaceable.length"
      class="mb-3"
    >
      <p class="text-xs text-muted mb-2">
        Remplacer une option déjà prise (facultatif) :
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in replaceable"
          :key="opt.id"
          type="button"
          class="px-3 py-1.5 rounded-lg border text-xs transition-all"
          :class="replaced === opt.id
            ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 font-semibold line-through'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-amber-500/40 cursor-pointer'"
          @click="replaced = replaced === opt.id ? null : opt.id"
        >
          {{ opt.name }}
        </button>
      </div>
    </div>

    <p
      v-if="effectiveCount === 0"
      class="text-xs text-muted italic px-1"
    >
      Rien de nouveau à ce niveau.
    </p>

    <div
      v-else-if="!details.length"
      class="text-xs text-muted italic px-3 py-2"
    >
      Chargement…
    </div>

    <div
      v-else
      class="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1"
    >
      <button
        v-for="entry in visibleEntries"
        :key="entry.id"
        type="button"
        class="text-left px-3 py-2.5 rounded-xl border transition-all"
        :class="cardClass(entry)"
        :disabled="entry.unmet != null && !picks.includes(entry.id)"
        @click="toggle(entry)"
      >
        <div class="font-semibold text-sm flex items-center gap-2 flex-wrap">
          <span>{{ entry.name }}</span>
          <span
            v-if="(entry.option.levelRequired ?? 1) > 1"
            class="text-xs font-mono px-2 py-0.5 rounded-full bg-(--ui-bg) border border-(--ui-border) text-muted"
          >
            niv. {{ entry.option.levelRequired }}+
          </span>
          <span
            v-if="entry.option.prerequisites?.requiredPactBoon"
            class="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30"
          >
            Pacte · {{ PACT_BOON_LABELS[entry.option.prerequisites.requiredPactBoon] }}
          </span>
          <span
            v-if="entry.option.prerequisites?.requiredSpellName"
            class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30"
          >
            Sort · {{ entry.option.prerequisites.requiredSpellName }}
          </span>
        </div>
        <div
          v-if="entry.description"
          class="text-xs text-muted mt-1 leading-snug"
        >
          {{ entry.description }}
        </div>
        <div
          v-if="entry.unmet && !picks.includes(entry.id)"
          class="text-xs text-rose-400/80 mt-1.5 italic"
        >
          {{ unmetPrerequisiteLabel(entry.unmet) }}
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { unmetPrerequisite, type CharacterProjection, type ResolvedOption, type UnmetPrerequisite } from '~~/shared/rules/resolve'

// Choix d'une ou plusieurs options d'un groupe de features (style de combat, pacte, manifestations, Métamagie, manœuvres).
// Les options viennent du point de choix (identifiants, niveau, prérequis) ; leurs noms et descriptions, du catalogue.
// `excludedIds` : options déjà prises ailleurs, masquées. `replaceableIds` : options déjà prises que l'on peut échanger ;
// en échanger une ajoute une option à choisir. `projection` : l'état du personnage qui décide des prérequis ; sans lui,
// seul le niveau barre une option.
type EligibilityState = Pick<CharacterProjection, 'pactBoon' | 'knownSpellNames' | 'knownInvocationNames' | 'abilityScores' | 'armorProficiencies' | 'hasSpellcasting'>

const props = withDefaults(defineProps<{
  title: string
  count: number
  options: ResolvedOption[]
  ownerLevel: number
  accent?: 'red' | 'violet'
  excludedIds?: number[]
  replaceableIds?: number[]
  projection?: EligibilityState
}>(), { accent: 'red' })
const picks = defineModel<number[]>({ default: () => [] })
const replaced = defineModel<number | null>('replaced', { default: null })

const THEMES = {
  red: {
    frame: 'border-red-500/40',
    title: 'text-red-400',
    selected: 'border-red-500/60 bg-red-500/10 text-red-400',
    idle: 'hover:border-red-500/40',
  },
  violet: {
    frame: 'border-violet-500/40',
    title: 'text-violet-400',
    selected: 'border-violet-500/60 bg-violet-500/10 text-violet-400',
    idle: 'hover:border-violet-500/40',
  },
}
const theme = computed(() => THEMES[props.accent])

const optionById = computed(() => new Map(props.options.flatMap(o => o.featureId != null ? [[o.featureId, o] as const] : [])))
const { details, byId } = useFeatureOptions(() => [...optionById.value.keys()])

const effectiveCount = computed(() => props.count + (replaced.value != null ? 1 : 0))

// Une manifestation peut en exiger une autre : celles que l'on vient de cocher comptent.
const eligibility = computed<CharacterProjection>(() => ({
  classLevels: {},
  ...props.projection,
  knownInvocationNames: [
    ...(props.projection?.knownInvocationNames ?? []),
    ...picks.value.flatMap(id => byId.value.get(id)?.name ?? []),
  ],
  ignorePrerequisites: props.projection == null,
}))

interface Entry {
  id: number
  name: string
  description: string | null
  option: ResolvedOption
  unmet: UnmetPrerequisite | null
}
const entries = computed<Entry[]>(() => details.value
  .flatMap((d) => {
    const option = optionById.value.get(d.id)
    return option ? [{ ...d, option, unmet: unmetPrerequisite(option, props.ownerLevel, eligibility.value) }] : []
  })
  .sort((a, b) => (a.option.levelRequired ?? 1) - (b.option.levelRequired ?? 1) || a.name.localeCompare(b.name, 'fr')))

const visibleEntries = computed(() => {
  const excluded = new Set(props.excludedIds ?? [])
  return entries.value.filter(e => !excluded.has(e.id))
})
const replaceable = computed(() => details.value.filter(o => (props.replaceableIds ?? []).includes(o.id)))

// Une option devenue indisponible (le premier style choisi change) ne reste pas cochée ; ni un choix en trop.
watch([visibleEntries, effectiveCount], ([visible, max]) => {
  if (!details.value.length) return
  const ids = new Set(visible.map(e => e.id))
  const kept = picks.value.filter(id => ids.has(id)).slice(0, max)
  if (kept.length !== picks.value.length) picks.value = kept
})

function cardClass(entry: Entry): string {
  if (picks.value.includes(entry.id)) return theme.value.selected
  if (entry.unmet) return 'border-(--ui-border) bg-(--ui-bg) text-muted opacity-50 cursor-not-allowed'
  if (picks.value.length >= effectiveCount.value) return 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted/60 cursor-not-allowed'
  return `border-(--ui-border) bg-(--ui-bg-elevated) text-(--ui-text) cursor-pointer ${theme.value.idle}`
}

function toggle(entry: Entry) {
  if (picks.value.includes(entry.id)) picks.value = picks.value.filter(x => x !== entry.id)
  else if (!entry.unmet && picks.value.length < effectiveCount.value) picks.value = [...picks.value, entry.id]
}
</script>
