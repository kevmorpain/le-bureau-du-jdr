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
      <!-- Bandeau stats -->
      <div class="flex flex-wrap gap-2 mb-5">
        <div
          v-for="stat in spellStats"
          :key="stat.label"
          class="px-3 py-1.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-center"
        >
          <div class="font-mono font-bold text-sm text-amber-400">{{ stat.value }}</div>
          <div class="text-xs text-muted/60 uppercase tracking-wider mt-0.5" style="font-size:9px">{{ stat.label }}</div>
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
          <span
            class="ml-1"
            :class="state.selectedCantrips.length >= cantripsNeeded ? 'text-green-400' : ''"
          >{{ state.selectedCantrips.length }}/{{ cantripsNeeded }}</span>
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
          <span
            class="ml-1"
            :class="state.selectedSpells.length >= spellsNeeded ? 'text-green-400' : ''"
          >{{ state.selectedSpells.length }}/{{ spellsNeeded }}</span>
        </button>
      </div>

      <!-- Info box casters préparés -->
      <div
        v-if="activeTab === 'spells' && isPrepared"
        class="mb-4 px-3 py-2 rounded-lg border text-xs text-muted"
        style="background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.2)"
      >
        En tant que {{ classData!.name }}, vous préparez vos sorts chaque matin. Vous pouvez préparer
        <strong class="text-(--ui-text)">{{ spellsNeeded }}</strong> sort(s)
        (mod {{ ABILITY_SHORT[spellcastingInfo.ability] }} + niveau{{ isHalfCaster ? '/2' : '' }}).
        Vous avez accès à toute la liste jusqu'au niveau {{ maxSpellLevel }}.
      </div>

      <!-- Info box grimoire -->
      <div
        v-if="activeTab === 'spells' && isGrimoire"
        class="mb-4 px-3 py-2 rounded-lg border text-xs text-muted"
        style="background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.2)"
      >
        Votre grimoire contient <strong class="text-(--ui-text)">{{ spellsNeeded }}</strong> sorts au niveau {{ state.level }}.
        Vous pouvez préparer mod {{ ABILITY_SHORT[spellcastingInfo.ability] }} + niveau sorts par jour.
      </div>

      <!-- Chargement -->
      <div v-if="pending" class="text-sm text-muted py-8 text-center">Chargement des sorts…</div>

      <!-- Tab : Sorts mineurs -->
      <template v-if="activeTab === 'cantrips' && !pending">
        <div class="text-xs text-muted mb-3">
          Sélectionnez {{ cantripsNeeded }} sort(s) mineur(s)
          <span
            class="ml-1.5 font-semibold"
            :class="state.selectedCantrips.length >= cantripsNeeded ? 'text-green-400' : 'text-amber-400'"
          >{{ state.selectedCantrips.length }}/{{ cantripsNeeded }}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <SpellCardBuilder
            v-for="spell in cantrips"
            :key="spell.id"
            :spell="spell"
            :selected="state.selectedCantrips.includes(spell.id)"
            @click="toggleCantrip(spell.id)"
          />
        </div>
        <div v-if="!cantrips.length" class="text-sm text-muted italic">Aucun sort mineur disponible.</div>
      </template>

      <!-- Tab : Sorts connus / grimoire / préparés -->
      <template v-if="activeTab === 'spells' && !pending">
        <div class="text-xs text-muted mb-3">
          Sélectionnez {{ spellsNeeded }} sort(s)
          <span
            class="ml-1.5 font-semibold"
            :class="state.selectedSpells.length >= spellsNeeded ? 'text-green-400' : 'text-amber-400'"
          >{{ state.selectedSpells.length }}/{{ spellsNeeded }}</span>
        </div>
        <template v-for="(list, lvl) in spellsByLevel" :key="lvl">
          <div class="mb-4">
            <div class="text-xs font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
              <span>Niveau {{ lvl }}</span>
              <span class="text-muted/40">— {{ spellSlots?.[Number(lvl) - 1] ?? 0 }} empl.</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <SpellCardBuilder
                v-for="spell in list"
                :key="spell.id"
                :spell="spell"
                :selected="state.selectedSpells.includes(spell.id)"
                @click="toggleSpell(spell.id)"
              />
            </div>
          </div>
        </template>
        <div v-if="!Object.keys(spellsByLevel).length" class="text-sm text-muted italic">Aucun sort disponible pour ce niveau.</div>
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { CANTRIPS_KNOWN, SPELLS_KNOWN, spellSlotsAtLevel, maxSpellLevelAtLevel } from '~/data/character-builder'

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
} = useCharacterBuilder()

const activeTab = ref<'cantrips' | 'spells'>('cantrips')

// Fetch sorts filtrés par classe
const { data: allSpells, pending } = useFetch('/api/spells', {
  query: computed(() => ({ className: classData.value?.dbName ?? '' })),
  immediate: true,
})

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
    const mod = ab ? Math.floor(((finalAbilities.value[ab] ?? 10) - 10) / 2) : 0
    const levelVal = isHalfCaster.value ? Math.floor(state.value.level / 2) : state.value.level
    return Math.max(1, mod + levelVal)
  }
  return 0
})

// Bandeau stats
const spellStats = computed(() => {
  if (!spellcastingInfo.value) return []
  const ab = spellcastingInfo.value.ability
  const mod = Math.floor(((finalAbilities.value[ab] ?? 10) - 10) / 2)
  const dc = 8 + profBonus.value + mod
  const atk = profBonus.value + mod

  const stats = [
    { label: 'DD de sort', value: String(dc) },
    { label: 'Attaque', value: `+${atk}` },
    { label: 'Caractéristique', value: ABILITY_SHORT[ab] },
  ]

  const slots = spellSlots.value ?? []
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] > 0) stats.push({ label: `Niv.${i + 1}`, value: `×${slots[i]}` })
  }
  return stats
})

// Initialiser l'onglet selon disponibilité
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
