<template>
  <div>
    <!-- En-tête -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">✨</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Sorts</h2>
        <p class="text-sm text-muted mt-0.5">Choisissez les sorts que vous maîtrisez. Cliquez sur ▾ pour voir la description complète.</p>
      </div>
    </div>

    <!-- Classe sans magie -->
    <div
      v-if="!spellcastingInfo"
      class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-8 text-center text-sm text-muted"
    >
      Votre classe ({{ classData?.name ?? '—' }}) n'utilise pas de magie. Passez à l'étape suivante.
    </div>

    <template v-else>
      <!-- Bandeau stats (DD, attaque, caractéristique) -->
      <div class="flex flex-wrap gap-2 mb-4">
        <div
          v-for="stat in spellCastStats"
          :key="stat.label"
          class="px-3 py-1.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-center"
        >
          <div class="font-mono font-bold text-sm text-amber-400">{{ stat.value }}</div>
          <div class="text-xs text-muted/60 uppercase tracking-wider mt-0.5" style="font-size:9px">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Emplacements de sorts en ronds -->
      <div v-if="slotsWithCount.length" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3 mb-5">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">Emplacements de sorts</p>
        <div class="space-y-1.5">
          <div v-for="row in slotsWithCount" :key="row.level" class="flex items-center gap-2">
            <span class="text-xs text-muted w-4 text-right font-mono">{{ row.level }}</span>
            <div class="flex gap-1">
              <span
                v-for="i in row.count"
                :key="i"
                class="size-3.5 rounded-full border-2 border-amber-500/60"
              />
            </div>
            <span class="text-xs text-muted ml-1">
              {{ row.count }} {{ $t('emplacement', row.count) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="flex gap-2 mb-4">
        <button
          v-if="cantripsNeeded > 0"
          type="button"
          class="px-4 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer"
          :class="activeTab === 'cantrips'
            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
            : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40'"
          @click="activeTab = 'cantrips'"
        >
          Sorts mineurs
          <span class="ml-1" :class="state.selectedCantrips.length >= cantripsNeeded ? 'text-green-400' : ''">
            {{ state.selectedCantrips.length }}/{{ cantripsNeeded }}
          </span>
        </button>

        <button
          v-if="hasSpellsTab"
          type="button"
          class="px-4 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer"
          :class="activeTab === 'spells'
            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
            : 'border-(--ui-border) bg-transparent text-muted hover:border-amber-500/40'"
          @click="activeTab = 'spells'"
        >
          {{ spellsTabLabel }}
          <span class="ml-1" :class="state.selectedSpells.length >= spellsNeeded ? 'text-green-400' : ''">
            {{ state.selectedSpells.length }}/{{ spellsNeeded }}
          </span>
        </button>
      </div>

      <!-- Info box casters préparés / grimoire -->
      <div
        v-if="activeTab === 'spells' && (isPrepared || isGrimoire)"
        class="mb-4 px-3 py-2 rounded-lg border text-xs text-muted"
        style="background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.2)"
      >
        <template v-if="isGrimoire">
          Votre grimoire contient <strong class="text-(--ui-text)">{{ spellsNeeded }}</strong> {{ $t('sort', spellsNeeded) }} au niveau {{ state.level }}.
          Vous pouvez préparer mod {{ ABILITY_SHORT[spellcastingInfo.ability] }} + niveau sorts par jour.
        </template>
        <template v-else>
          En tant que {{ classData!.name }}, vous préparez vos sorts chaque matin. Vous pouvez préparer
          <strong class="text-(--ui-text)">{{ spellsNeeded }}</strong> {{ $t('sort', spellsNeeded) }}
          (mod {{ ABILITY_SHORT[spellcastingInfo.ability] }} + niveau{{ isHalfCaster ? '/2' : '' }}).
          Vous avez accès à toute la liste jusqu'au niveau {{ maxSpellLevel }}.
        </template>
      </div>

      <!-- Filtres -->
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <input
          v-model="filterText"
          type="text"
          placeholder="Rechercher…"
          class="w-52 px-3 py-1.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-(--ui-text) placeholder-muted focus:border-amber-500/60 focus:outline-none"
        >
        <USelect
          v-model="filterSchool"
          :items="schoolOptions"
          size="sm"
          class="w-40"
        />
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer"
          :class="filterConc
            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
            : 'border-(--ui-border) text-muted hover:border-amber-500/40'"
          @click="filterConc = !filterConc"
        >
          <ConcentrationIcon class="size-3.5" />
          Concentration
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer"
          :class="filterRitual
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
            : 'border-(--ui-border) text-muted hover:border-amber-500/40'"
          @click="filterRitual = !filterRitual"
        >
          <MagicSquareIcon class="size-3.5" />
          Rituel
        </button>
      </div>

      <!-- Chargement -->
      <div v-if="pending" class="text-sm text-muted py-8 text-center">Chargement des sorts…</div>

      <!-- Tab : Sorts mineurs -->
      <template v-if="activeTab === 'cantrips' && !pending">
        <div class="text-xs text-muted mb-3">
          Sélectionnez {{ cantripsNeeded }} {{ $t('sort', cantripsNeeded) }} mineur{{ cantripsNeeded > 1 ? 's' : '' }}
          <span
            class="ml-1.5 font-semibold"
            :class="state.selectedCantrips.length >= cantripsNeeded ? 'text-green-400' : 'text-amber-400'"
          >{{ state.selectedCantrips.length }}/{{ cantripsNeeded }}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <SpellCardBuilder
            v-for="spell in filteredCantrips"
            :key="spell.id"
            :spell="spell"
            :selected="state.selectedCantrips.includes(spell.id)"
            :character-level="state.level"
            :spellcasting-mod="spellcastingMod"
            @click="toggleCantrip(spell.id)"
          />
        </div>
        <div v-if="!filteredCantrips.length" class="text-sm text-muted italic py-4">Aucun sort mineur correspondant.</div>
      </template>

      <!-- Tab : Sorts connus / grimoire / préparés -->
      <template v-if="activeTab === 'spells' && !pending">
        <div class="text-xs text-muted mb-3">
          Sélectionnez {{ spellsNeeded }} {{ $t('sort', spellsNeeded) }}
          <span
            class="ml-1.5 font-semibold"
            :class="state.selectedSpells.length >= spellsNeeded ? 'text-green-400' : 'text-amber-400'"
          >{{ state.selectedSpells.length }}/{{ spellsNeeded }}</span>
        </div>
        <template v-for="(list, lvl) in filteredSpellsByLevel" :key="lvl">
          <div class="mb-4">
            <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
              <span>Niveau {{ lvl }}</span>
              <div class="flex gap-0.5 ml-1">
                <span
                  v-for="i in (spellSlots?.[Number(lvl) - 1] ?? 0)"
                  :key="i"
                  class="size-2.5 rounded-full border border-amber-500/50"
                />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <SpellCardBuilder
                v-for="spell in list"
                :key="spell.id"
                :spell="spell"
                :selected="state.selectedSpells.includes(spell.id)"
                :character-level="state.level"
                :spellcasting-mod="spellcastingMod"
                @click="toggleSpell(spell.id)"
              />
            </div>
          </div>
        </template>
        <div v-if="!Object.keys(filteredSpellsByLevel).length" class="text-sm text-muted italic py-4">Aucun sort correspondant.</div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { CANTRIPS_KNOWN, SPELLS_KNOWN } from '~/data/character-builder'

const {
  state,
  classData,
  spellcastingInfo,
  finalAbilities,
  profBonus,
  spellSlots,
  maxSpellLevel,
  cantripsNeeded,
  ABILITY_SHORT,
  abilityMod,
} = useCharacterBuilder()

const activeTab = ref<'cantrips' | 'spells'>('cantrips')
const filterText = ref('')
const filterSchool = ref<string | null>(null)
const filterConc = ref(false)
const filterRitual = ref(false)

// Fetch sorts filtrés par classe
const { data: allSpells, pending } = useFetch('/api/spells', {
  query: computed(() => ({ className: classData.value?.dbName ?? '' })),
  immediate: true,
})

// Partager les noms de sorts pour BuilderPreview
const spellNamesById = useState<Record<number, string>>('builder-spell-names', () => ({}))
watch(allSpells, (spells) => {
  if (!spells) return
  const map: Record<number, string> = {}
  for (const s of spells) map[s.id] = s.name
  spellNamesById.value = map
}, { immediate: true })

const cantrips = computed(() => (allSpells.value ?? []).filter((s: any) => s.level === 0))

const spellsByLevel = computed(() => {
  const max = maxSpellLevel.value
  const result: Record<number, any[]> = {}
  for (const spell of allSpells.value ?? []) {
    if (spell.level >= 1 && spell.level <= max) {
      if (!result[spell.level]) result[spell.level] = []
      result[spell.level].push(spell)
    }
  }
  return result
})

// Filtres appliqués
function applyFilters(list: any[]) {
  return list.filter((s) => {
    if (filterText.value && !s.name.toLowerCase().includes(filterText.value.toLowerCase())) return false
    if (filterSchool.value != null && s.school?.name !== filterSchool.value) return false
    if (filterConc.value && !s.concentration) return false
    if (filterRitual.value && !s.ritual) return false
    return true
  })
}

const filteredCantrips = computed(() => applyFilters(cantrips.value))

const filteredSpellsByLevel = computed(() => {
  const result: Record<number, any[]> = {}
  for (const [lvl, list] of Object.entries(spellsByLevel.value)) {
    const filtered = applyFilters(list as any[])
    if (filtered.length) result[Number(lvl)] = filtered
  }
  return result
})

const { t } = useI18n()

// Options pour USelect école
const schoolOptions = computed(() => {
  const seen = new Set<string>()
  const options: { label: string, value: string | null }[] = [{ label: 'Toutes les écoles', value: null }]
  for (const s of (allSpells.value ?? []).sort((a, b) => (a.school?.name ?? '').localeCompare(b.school?.name ?? ''))) {
    if (s.school?.name && !seen.has(s.school.name)) {
      seen.add(s.school.name)
      options.push({ label: t(`schools.${s.school.name}`, s.school.name), value: s.school.name })
    }
  }
  return options
})

const isPrepared = computed(() => ['cleric', 'druid', 'paladin', 'ranger', 'wizard'].includes(state.value.classId ?? ''))
const isGrimoire = computed(() => state.value.classId === 'wizard')
const isHalfCaster = computed(() => ['paladin', 'ranger'].includes(state.value.classId ?? ''))

const hasSpellsTab = computed(() => Object.keys(spellsByLevel.value).length > 0)

const spellsTabLabel = computed(() => {
  if (isGrimoire.value) return 'Grimoire'
  if (isPrepared.value) return 'Sorts préparés'
  return 'Sorts connus'
})

const spellsNeeded = computed(() => {
  const cls = state.value.classId ?? ''
  if (SPELLS_KNOWN[cls]) return SPELLS_KNOWN[cls]![state.value.level - 1] ?? 0
  if (['cleric', 'druid', 'paladin', 'ranger', 'wizard'].includes(cls)) {
    const ab = spellcastingInfo.value?.ability
    const mod = ab ? abilityMod(finalAbilities.value[ab] ?? 10) : 0
    const levelVal = isHalfCaster.value ? Math.floor(state.value.level / 2) : state.value.level
    return Math.max(1, mod + levelVal)
  }
  return 0
})

const spellcastingMod = computed(() => {
  const ab = spellcastingInfo.value?.ability
  if (!ab) return null
  return abilityMod(finalAbilities.value[ab] ?? 10)
})

const spellCastStats = computed(() => {
  if (!spellcastingInfo.value) return []
  const mod = spellcastingMod.value ?? 0
  return [
    { label: 'DD de sort', value: String(8 + profBonus.value + mod) },
    { label: 'Attaque de sort', value: `+${profBonus.value + mod}` },
    { label: 'Caractéristique', value: ABILITY_SHORT[spellcastingInfo.value.ability] },
  ]
})

const slotsWithCount = computed(() => {
  const slots = spellSlots.value ?? []
  return slots
    .map((count, i) => ({ level: i + 1, count }))
    .filter(r => r.count > 0)
})

watch(() => cantripsNeeded.value, (n) => {
  if (n === 0) activeTab.value = 'spells'
}, { immediate: true })

function toggleCantrip(id: number) {
  const list = state.value.selectedCantrips
  const idx = list.indexOf(id)
  if (idx >= 0) list.splice(idx, 1)
  else if (list.length < cantripsNeeded.value) list.push(id)
}

function toggleSpell(id: number) {
  const list = state.value.selectedSpells
  const idx = list.indexOf(id)
  if (idx >= 0) list.splice(idx, 1)
  else if (list.length < spellsNeeded.value) list.push(id)
}
</script>
