<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <span class="text-4xl">✨</span>
      <div>
        <h2 class="text-xl font-bold text-(--ui-text)">Sorts</h2>
        <p class="text-sm text-muted mt-0.5">Choisissez les sorts que vous maîtrisez. Cliquez sur ▾ pour voir la description complète.</p>
      </div>
    </div>

    <div
      v-if="!spellcastingInfo"
      class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-8 text-center text-sm text-muted"
    >
      Votre classe ({{ classData?.name ?? '—' }}) n'utilise pas de magie. Passez à l'étape suivante.
    </div>

    <template v-else>
      <div class="flex flex-wrap gap-2 mb-4">
        <div
          v-for="stat in spellCastStats"
          :key="stat.label"
          class="px-3 py-1.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-center"
        >
          <div class="font-mono font-bold text-sm text-amber-400">{{ stat.value }}</div>
          <div class="text-xs text-muted/60 uppercase tracking-wider mt-0.5" style="font-size:12px">{{ stat.label }}</div>
        </div>
      </div>

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

      <div v-for="lvl in arcaneMysteriumSpellLevels" :key="`arcanum-${lvl}`" class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">
            ✨ Arcanum mystique (niv.&nbsp;{{ lvl }})
          </p>
          <span
            class="text-xs font-semibold"
            :class="state.arcaneMysteriumSpellIds[lvl] != null ? 'text-green-400' : 'text-amber-400'"
          >{{ state.arcaneMysteriumSpellIds[lvl] != null ? '1/1' : '0/1' }}</span>
        </div>
        <p class="text-xs text-muted mb-3">
          Choisissez un sort de niveau {{ lvl }} dans la liste de sorts d'occultiste.
          Vous pourrez le lancer une fois par repos long sans dépenser d'emplacement.
        </p>
        <div v-if="pending" class="text-sm text-muted py-4 text-center">Chargement…</div>
        <div v-else-if="!arcanumCandidates(lvl).length" class="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/8 text-xs text-rose-400">
          Aucun sort de niveau {{ lvl }} dans la liste d'occultiste — relancez les seeds.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <SpellCardBuilder
            v-for="spell in arcanumCandidates(lvl)"
            :key="spell.id"
            :spell="spell"
            :selected="state.arcaneMysteriumSpellIds[lvl] === spell.id"
            :character-level="state.level"
            :spellcasting-mod="spellcastingMod"
            @click="toggleArcanumSpell(lvl, spell.id)"
          />
        </div>
      </div>

      <div v-if="showBookOfAncientSecrets" class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">
            📜 Livre des secrets anciens — sorts rituels
          </p>
          <span
            class="text-xs font-semibold"
            :class="state.bookOfAncientSecretsSpellIds.length >= 2 ? 'text-green-400' : 'text-amber-400'"
          >{{ state.bookOfAncientSecretsSpellIds.length }}/2</span>
        </div>
        <p class="text-xs text-muted mb-3">
          Choisissez 2 sorts <strong>rituels</strong> de niveau 1 dans la liste de n'importe quelle classe.
          Ils seront inscrits dans votre Livre des Ombres et lançables uniquement en tant que rituel.
        </p>
        <div v-if="ritualsPending" class="text-sm text-muted py-4 text-center">Chargement…</div>
        <div v-else-if="!ritualSpellsLvl1.length" class="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/8 text-xs text-rose-400">
          Aucun sort rituel de niveau 1 dans la base — relancez les seeds.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <SpellCardBuilder
            v-for="spell in ritualSpellsLvl1"
            :key="spell.id"
            :spell="spell"
            :selected="state.bookOfAncientSecretsSpellIds.includes(spell.id)"
            :character-level="state.level"
            :spellcasting-mod="spellcastingMod"
            @click="toggleRitualSpell(spell.id)"
          />
        </div>
      </div>

      <div v-if="needsPactBoon && state.pactBoon === 'chain'" class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">Sorts du Pacte de la Chaîne</p>
          <UBadge color="violet" variant="subtle" size="md">Auto-ajouté</UBadge>
        </div>
        <div v-if="familiarSpell">
          <SpellCardBuilder
            :spell="familiarSpell"
            :selected="true"
            :character-level="state.level"
            :spellcasting-mod="spellcastingMod"
            @click="() => {}"
          />
        </div>
        <div v-else class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-muted italic">
          Sort "Appel de familier" introuvable — relancez les seeds.
        </div>
      </div>

      <div v-if="needsPactBoon && state.pactBoon === 'tome'" class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">Sorts du Pacte du Tome</p>
          <span
            class="text-xs font-semibold"
            :class="state.selectedPactBoonCantripIds.length >= 3 ? 'text-green-400' : 'text-amber-400'"
          >{{ state.selectedPactBoonCantripIds.length }}/3</span>
        </div>
        <p class="text-xs text-muted mb-3">Choisissez 3 sorts mineurs de n'importe quelle classe.</p>
        <div v-if="pactCantripsPending" class="text-sm text-muted py-4 text-center">Chargement…</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <UTooltip
            v-for="spell in filteredPactCantrips"
            :key="spell.id"
            :text="isRegularCantrip(spell.id) && !state.selectedPactBoonCantripIds.includes(spell.id) ? 'Déjà dans vos sorts mineurs classiques' : ''"
          >
            <div :class="isRegularCantrip(spell.id) && !state.selectedPactBoonCantripIds.includes(spell.id) ? 'opacity-50' : ''">
              <SpellCardBuilder
                :spell="spell"
                :selected="state.selectedPactBoonCantripIds.includes(spell.id)"
                :character-level="state.level"
                :spellcasting-mod="spellcastingMod"
                @click="togglePactBoonCantrip(spell.id)"
              />
            </div>
          </UTooltip>
        </div>
        <p v-if="!pactCantripsPending && filteredPactCantrips.length === 0" class="text-sm text-muted italic py-3">Aucun sort mineur correspondant.</p>
      </div>

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

      <div v-if="pending" class="text-sm text-muted py-8 text-center">Chargement des sorts…</div>

      <template v-if="activeTab === 'cantrips' && !pending">
        <div class="text-xs text-muted mb-3">
          Sélectionnez {{ cantripsNeeded }} {{ $t('sort', cantripsNeeded) }} mineur{{ cantripsNeeded > 1 ? 's' : '' }}
          <span
            class="ml-1.5 font-semibold"
            :class="state.selectedCantrips.length >= cantripsNeeded ? 'text-green-400' : 'text-amber-400'"
          >{{ state.selectedCantrips.length }}/{{ cantripsNeeded }}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <UTooltip
            v-for="spell in filteredCantrips"
            :key="spell.id"
            :text="state.selectedPactBoonCantripIds.includes(spell.id) && !state.selectedCantrips.includes(spell.id) ? 'Déjà dans vos sorts du Pacte du Tome' : ''"
          >
            <div :class="state.selectedPactBoonCantripIds.includes(spell.id) && !state.selectedCantrips.includes(spell.id) ? 'opacity-50' : ''">
              <SpellCardBuilder
                :spell="spell"
                :selected="state.selectedCantrips.includes(spell.id)"
                :character-level="state.level"
                :spellcasting-mod="spellcastingMod"
                @click="toggleCantrip(spell.id)"
              />
            </div>
          </UTooltip>
        </div>
        <div v-if="!filteredCantrips.length" class="text-sm text-muted italic py-4">Aucun sort mineur correspondant.</div>
      </template>

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
import { spellLearningOf, spellsKnownAt } from '~~/shared/rules/spellsKnown'

const {
  state,
  classData,
  spellcastingInfo,
  finalAbilities,
  profBonus,
  spellSlots,
  maxSpellLevel,
  cantripsNeeded,
  needsPactBoon,
  ABILITY_SHORT,
  abilityMod,
  arcaneMysteriumSpellLevels,
  picksBookOfAncientSecrets,
} = useCharacterBuilder()

const activeTab = ref<'cantrips' | 'spells'>('cantrips')
const filterText = ref('')
const filterSchool = ref<string | null>(null)
const filterConc = ref(false)
const filterRitual = ref(false)

const { extendedQuery } = useExtendedContent()

const { data: allSpells, pending } = useFetch('/api/spells', {
  query: computed(() => ({ className: classData.value?.dbName ?? '', ...extendedQuery.value })),
  immediate: true,
})

const spellNamesById = useState<Record<number, string>>('builder-spell-names', () => ({}))

function mergeSpellNames(spells: any[] | null) {
  if (!spells?.length) return
  const map = { ...spellNamesById.value }
  for (const s of spells) map[s.id] = s.name
  spellNamesById.value = map
}

watch(allSpells, mergeSpellNames, { immediate: true })

const { data: allCantripsData, pending: pactCantripsPending } = useFetch('/api/spells', {
  query: extendedQuery,
  immediate: true,
})
const pactCantrips = computed(() =>
  ((allCantripsData.value ?? []) as any[]).filter((s: any) => s.level === 0),
)
const filteredPactCantrips = computed(() =>
  filterText.value
    ? pactCantrips.value.filter((s: any) => s.name.toLowerCase().includes(filterText.value.toLowerCase()))
    : pactCantrips.value,
)
watch(allCantripsData, mergeSpellNames, { immediate: true })

function isRegularCantrip(id: number): boolean {
  return state.value.selectedCantrips.includes(id)
}

const { data: magicianSpells } = useFetch('/api/spells', {
  query: computed(() => ({ className: 'Magicien', ...extendedQuery.value })),
  immediate: true,
})
const familiarSpell = computed(() =>
  ((magicianSpells.value ?? []) as any[]).find((s: any) => s.name === 'Appel de familier') ?? null,
)
watch(magicianSpells, mergeSpellNames, { immediate: true })

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

const spellLearning = computed(() => spellLearningOf(state.value.classId ?? ''))
const isPrepared = computed(() => spellLearning.value === 'prepared' || spellLearning.value === 'spellbook')
const isGrimoire = computed(() => spellLearning.value === 'spellbook')
const isHalfCaster = computed(() => spellcastingInfo.value?.type === 'half')

const hasSpellsTab = computed(() => Object.keys(spellsByLevel.value).length > 0)

const spellsTabLabel = computed(() => {
  if (isGrimoire.value) return 'Grimoire'
  if (isPrepared.value) return 'Sorts préparés'
  return 'Sorts connus'
})

const spellsNeeded = computed(() => {
  const cls = state.value.classId ?? ''
  if (spellLearning.value === 'known') return spellsKnownAt(cls, state.value.level)
  if (isPrepared.value) {
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

function togglePactBoonCantrip(id: number) {
  const list = state.value.selectedPactBoonCantripIds
  const idx = list.indexOf(id)
  if (idx >= 0) list.splice(idx, 1)
  else if (list.length < 3) list.push(id)
}

function toggleSpell(id: number) {
  const list = state.value.selectedSpells
  const idx = list.indexOf(id)
  if (idx >= 0) list.splice(idx, 1)
  else if (list.length < spellsNeeded.value) list.push(id)
}

function arcanumCandidates(level: number) {
  return ((allSpells.value ?? []) as any[]).filter(s => s.level === level)
}

function toggleArcanumSpell(level: number, id: number) {
  if (state.value.arcaneMysteriumSpellIds[level] === id) {
    delete state.value.arcaneMysteriumSpellIds[level]
  }
  else {
    state.value.arcaneMysteriumSpellIds[level] = id
  }
}

// Livre des secrets anciens : sorts rituels niv 1 toutes classes

const { data: allRitualSpellsData, pending: ritualsPending } = useFetch<any[]>('/api/spells', {
  query: extendedQuery,
  immediate: true,
})

const { data: allInvocationsData } = useFetch<Array<{ id: number, name: string }>>('/api/invocations', {
  query: extendedQuery,
  default: () => [],
})
const invocationsByName = computed<Record<string, number>>(() => {
  const out: Record<string, number> = {}
  for (const inv of (allInvocationsData.value ?? [])) out[inv.name] = inv.id
  return out
})

const showBookOfAncientSecrets = computed(() =>
  picksBookOfAncientSecrets(invocationsByName.value),
)

watchEffect(() => {
  state.value.bookOfAncientSecretsRequired = showBookOfAncientSecrets.value
})

const ritualSpellsLvl1 = computed(() =>
  ((allRitualSpellsData.value ?? []) as any[])
    .filter(s => s.level === 1 && s.ritual === true),
)

function toggleRitualSpell(id: number) {
  const list = state.value.bookOfAncientSecretsSpellIds
  const idx = list.indexOf(id)
  if (idx >= 0) list.splice(idx, 1)
  else if (list.length < 2) list.push(id)
}
</script>
