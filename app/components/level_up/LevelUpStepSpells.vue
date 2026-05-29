<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="state.isMulticlass"
      subtitle="Nouveaux sorts et emplacements"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Magie</h2>

    <!-- Bandeau stats de sorts -->
    <div v-if="spellCastStats.length" class="flex flex-wrap gap-2 mb-4">
      <div
        v-for="stat in spellCastStats"
        :key="stat.label"
        class="px-3 py-1.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-center"
      >
        <div class="font-mono font-bold text-sm text-amber-400">{{ stat.value }}</div>
        <div class="text-muted uppercase tracking-wider mt-0.5" style="font-size:12px">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Emplacements de sorts : avant → après -->
    <div class="mb-5">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Emplacements de sorts</p>
      <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-4">
        <div class="flex items-center gap-2 mb-2.5">
          <span class="text-xs text-muted w-10 shrink-0">Avant</span>
          <div class="flex gap-3 flex-1 flex-wrap">
            <template v-for="(count, i) in oldSlots" :key="i">
              <div v-if="count > 0" class="flex items-center gap-1">
                <span class="text-xs font-mono text-muted w-3 text-right">{{ i + 1 }}</span>
                <div class="flex gap-0.5">
                  <span v-for="n in count" :key="n" class="size-3 rounded-full border border-muted/40" />
                </div>
              </div>
            </template>
            <span v-if="oldSlots.every(n => n === 0)" class="text-xs text-muted italic">Aucun emplacement</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-amber-400 w-10 shrink-0 font-semibold">Après</span>
          <div class="flex gap-3 flex-1 flex-wrap">
            <template v-for="(count, i) in newSlots" :key="i">
              <div v-if="count > 0" class="flex items-center gap-1">
                <span
                  class="text-xs font-mono w-3 text-right font-bold"
                  :class="(oldSlots[i] ?? 0) < count ? 'text-amber-400' : 'text-(--ui-text)'"
                >{{ i + 1 }}</span>
                <div class="flex gap-0.5">
                  <span
                    v-for="n in count"
                    :key="n"
                    class="size-3 rounded-full border"
                    :class="(oldSlots[i] ?? 0) < count && n > (oldSlots[i] ?? 0)
                      ? 'border-amber-500 bg-amber-500/30'
                      : 'border-amber-500/60'"
                  />
                </div>
                <span v-if="(oldSlots[i] ?? 0) < count" class="text-xs text-amber-400 font-semibold">
                  +{{ count - (oldSlots[i] ?? 0) }}
                </span>
              </div>
            </template>
            <span v-if="newSlots.every(n => n === 0)" class="text-xs text-muted italic">Aucun emplacement</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Info casters préparés -->
    <div
      v-if="isPreparedCaster && cantripsToLearn === 0 && spellsToLearn === 0"
      class="mb-5 px-3 py-2.5 rounded-xl border text-xs text-muted"
      style="background: rgba(96,165,250,0.08); border-color: rgba(96,165,250,0.2)"
    >
      <template v-if="isGrimoire">
        Votre grimoire s'enrichit de <strong class="text-(--ui-text)">2 nouveaux sorts</strong> à chaque niveau.
        Vous pouvez préparer mod {{ ABILITY_SHORT[pickedClass!.spellcasting!.ability] }} + niveau sorts par jour.
      </template>
      <template v-else>
        En tant que {{ pickedClass?.name }}, vous préparez vos sorts quotidiennement.
        Vos emplacements seront appliqués après validation.
      </template>
    </div>

    <!-- Arcane Mystérieux (niveaux 11/13/15/17) -->
    <div v-if="needsArcaneMysterium" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">
          ✨ Arcane Mystérieux (niv.&nbsp;{{ arcaneMysteriumSpellLevel }})
        </p>
        <span
          class="text-xs font-semibold"
          :class="state.arcaneMysteriumSpellId !== null ? 'text-green-400' : 'text-amber-400'"
        >{{ state.arcaneMysteriumSpellId !== null ? '1/1' : '0/1' }}</span>
      </div>
      <p class="text-xs text-muted mb-3">
        Choisissez un sort de niveau {{ arcaneMysteriumSpellLevel }} dans la liste de sorts d'occultiste.
        Vous pourrez le lancer une fois par repos long sans dépenser d'emplacement.
      </p>
      <div v-if="pending" class="text-sm text-muted py-4 text-center">Chargement…</div>
      <div v-else-if="!arcanumSpellsCandidates.length" class="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/8 text-xs text-rose-400">
        Aucun sort de niveau {{ arcaneMysteriumSpellLevel }} dans la liste d'occultiste — relancez les seeds.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <SpellCardBuilder
          v-for="spell in arcanumSpellsCandidates"
          :key="spell.id"
          :spell="spell"
          :selected="state.arcaneMysteriumSpellId === spell.id"
          :character-level="state.toLevel"
          :spellcasting-mod="spellcastingMod"
          @click="toggleArcanumSpell(spell.id)"
        />
      </div>
    </div>

    <!-- Livre des anciens secrets (manifestation TCoE Tome) -->
    <div v-if="showBookOfAncientSecrets" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">
          📜 Livre des anciens secrets — sorts rituels
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
          :character-level="state.toLevel"
          :spellcasting-mod="spellcastingMod"
          @click="toggleRitualSpell(spell.id)"
        />
      </div>
    </div>

    <!-- Sorts du Pacte de la Chaîne -->
    <div v-if="state.pactBoon === 'chain'" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">Sorts du Pacte de la Chaîne</p>
        <UBadge color="violet" variant="subtle" size="md">Auto-ajouté</UBadge>
      </div>
      <div v-if="familiarSpell">
        <SpellCardBuilder
          :spell="familiarSpell"
          :selected="true"
          :character-level="state.toLevel"
          :spellcasting-mod="spellcastingMod"
          @click="() => {}"
        />
      </div>
      <div v-else class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-muted italic">
        Sort "Appel de familier" introuvable — relancez les seeds.
      </div>
    </div>

    <!-- Sorts du Pacte du Tome -->
    <div v-if="state.pactBoon === 'tome'" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">Sorts du Pacte du Tome</p>
        <span
          class="text-xs font-semibold"
          :class="state.pactBoonCantripIds.length >= 3 ? 'text-green-400' : 'text-amber-400'"
        >{{ state.pactBoonCantripIds.length }}/3</span>
      </div>
      <p class="text-xs text-muted mb-3">Choisissez 3 sorts mineurs de n'importe quelle classe.</p>
      <div v-if="pactCantripsPending" class="text-sm text-muted py-4 text-center">Chargement…</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <UTooltip
          v-for="spell in filteredPactCantrips"
          :key="spell.id"
          :text="state.newCantripIds.includes(spell.id) && !state.pactBoonCantripIds.includes(spell.id) ? 'Déjà dans vos nouveaux sorts mineurs' : ''"
        >
          <div :class="state.newCantripIds.includes(spell.id) && !state.pactBoonCantripIds.includes(spell.id) ? 'opacity-50' : ''">
            <SpellCardBuilder
              :spell="spell"
              :selected="state.pactBoonCantripIds.includes(spell.id)"
              :character-level="state.toLevel"
              :spellcasting-mod="spellcastingMod"
              @click="togglePactBoonCantrip(spell.id)"
            />
          </div>
        </UTooltip>
      </div>
      <p v-if="!pactCantripsPending && filteredPactCantrips.length === 0" class="text-sm text-muted italic py-3">Aucun sort mineur correspondant.</p>
    </div>

    <!-- Filtres partagés (cantrips + sorts) -->
    <div v-if="cantripsToLearn > 0 || spellsToLearn > 0" class="flex flex-wrap items-center gap-2 mb-4">
      <input
        v-model="filterText"
        type="text"
        placeholder="Rechercher…"
        class="w-48 px-3 py-1.5 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-(--ui-text) placeholder-muted focus:border-amber-500/60 focus:outline-none"
      >
      <USelect
        v-if="spellsToLearn > 0"
        v-model="filterSchool"
        :items="schoolOptions"
        size="sm"
        class="w-40"
      />
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer"
        :class="filterConc ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-(--ui-border) text-muted hover:border-amber-500/40'"
        @click="filterConc = !filterConc"
      >
        <ConcentrationIcon class="size-3.5" />Concentration
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer"
        :class="filterRitual ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-(--ui-border) text-muted hover:border-amber-500/40'"
        @click="filterRitual = !filterRitual"
      >
        <MagicSquareIcon class="size-3.5" />Rituel
      </button>
    </div>

    <!-- Sorts mineurs -->
    <div v-if="cantripsToLearn > 0" class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">Sorts mineurs</p>
        <span
          class="text-xs font-semibold"
          :class="state.newCantripIds.length >= cantripsToLearn ? 'text-green-400' : 'text-amber-400'"
        >{{ state.newCantripIds.length }}/{{ cantripsToLearn }}</span>
      </div>
      <div v-if="pending" class="text-sm text-muted py-4 text-center">Chargement…</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <UTooltip
          v-for="spell in filteredCantrips"
          :key="spell.id"
          :text="cantripDisabledReason(spell.id)"
        >
          <div :class="isCantripDisabled(spell.id) ? 'opacity-50 pointer-events-none' : ''">
            <SpellCardBuilder
              :spell="spell"
              :selected="state.newCantripIds.includes(spell.id) || currentSpellIds.includes(spell.id)"
              :character-level="state.toLevel"
              :spellcasting-mod="spellcastingMod"
              @click="toggleCantrip(spell.id)"
            />
          </div>
        </UTooltip>
      </div>
      <p v-if="!pending && filteredCantrips.length === 0" class="text-sm text-muted italic py-3">Aucun sort mineur correspondant.</p>
    </div>

    <!-- Sorts connus / grimoire -->
    <div v-if="spellsToLearn > 0" class="mb-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold uppercase tracking-widest text-muted">{{ spellsTabLabel }}</p>
        <span
          class="text-xs font-semibold"
          :class="state.newSpellIds.length >= spellsToLearn ? 'text-green-400' : 'text-amber-400'"
        >{{ state.newSpellIds.length }}/{{ spellsToLearn }}</span>
      </div>
      <div v-if="pending" class="text-sm text-muted py-4 text-center">Chargement…</div>
      <template v-else>
        <div
          v-for="[lvl, list] in Object.entries(filteredSpellsByLevel)"
          :key="lvl"
          class="mb-4"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-bold text-muted">Niveau {{ lvl }}</span>
            <div class="flex gap-0.5">
              <span
                v-for="i in (newSlots[Number(lvl) - 1] ?? 0)"
                :key="i"
                class="size-2.5 rounded-full border border-amber-500/50"
              />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <UTooltip
              v-for="spell in list"
              :key="spell.id"
              :text="currentSpellIds.includes(spell.id) ? 'Vous connaissez déjà ce sort' : ''"
            >
              <div :class="currentSpellIds.includes(spell.id) ? 'opacity-50 pointer-events-none' : ''">
                <SpellCardBuilder
                  :spell="spell"
                  :selected="state.newSpellIds.includes(spell.id) || currentSpellIds.includes(spell.id)"
                  :character-level="state.toLevel"
                  :spellcasting-mod="spellcastingMod"
                  @click="toggleSpell(spell.id)"
                />
              </div>
            </UTooltip>
          </div>
        </div>
        <p v-if="Object.keys(filteredSpellsByLevel).length === 0" class="text-sm text-muted italic py-3">Aucun sort correspondant.</p>
      </template>
    </div>

    <!-- Rien à faire -->
    <div
      v-if="cantripsToLearn === 0 && spellsToLearn === 0 && !isPreparedCaster"
      class="px-4 py-4 rounded-xl border text-sm text-muted"
      style="border-color: rgba(96,165,250,0.2); background: rgba(96,165,250,0.06)"
    >
      <p class="text-(--ui-text) font-semibold mb-1">Emplacements mis à jour</p>
      <p class="text-xs leading-relaxed">Vos emplacements de sorts seront automatiquement mis à jour après validation.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const {
  state,
  pickedClass,
  finalAbilities,
  currentSpellIds,
  spellSlotsAtLevel,
  CANTRIPS_KNOWN,
  SPELLS_KNOWN,
  ABILITY_SHORT,
  abilityMod,
  profBonusAtLevel,
  totalLevel,
  needsArcaneMysterium,
  arcaneMysteriumSpellLevel,
  picksBookOfAncientSecrets,
} = useLevelUp(inject('charSheet') as any)

const { t } = useI18n()

// Share spell names with LevelUpSummary
const spellNamesById = useState<Record<number, string>>('level-up-spell-names', () => ({}))

const filterText = ref('')
const filterSchool = ref<string | null>(null)
const filterConc = ref(false)
const filterRitual = ref(false)

const casterType = computed(() => pickedClass.value?.spellcasting?.type ?? null)

const oldSlots = computed((): number[] => {
  if (!casterType.value || state.value.fromLevel === 0) return Array(9).fill(0)
  return spellSlotsAtLevel(casterType.value as any, state.value.fromLevel)
})

const newSlots = computed((): number[] => {
  if (!casterType.value) return Array(9).fill(0)
  return spellSlotsAtLevel(casterType.value as any, state.value.toLevel)
})

const spellcastingAbility = computed(() => pickedClass.value?.spellcasting?.ability ?? null)
const spellcastingMod = computed(() => {
  const ab = spellcastingAbility.value
  return ab ? abilityMod(finalAbilities.value[ab]) : null
})

const profBonus = computed(() => profBonusAtLevel(totalLevel.value + 1))
const spellCastStats = computed(() => {
  const ab = spellcastingAbility.value
  if (!ab) return []
  const mod = spellcastingMod.value ?? 0
  return [
    { label: 'DD de sort', value: String(8 + profBonus.value + mod) },
    { label: 'Attaque de sort', value: `+${profBonus.value + mod}` },
    { label: 'Caractéristique', value: ABILITY_SHORT[ab] },
  ]
})

const clsId = computed(() => pickedClass.value?.id ?? '')
const PREPARED_CASTERS = new Set(['cleric', 'druid', 'paladin', 'ranger', 'wizard'])
const KNOWN_CASTERS = new Set(['bard', 'sorcerer', 'warlock'])
const isPreparedCaster = computed(() => PREPARED_CASTERS.has(clsId.value))
const isGrimoire = computed(() => clsId.value === 'wizard')

const spellsTabLabel = computed(() => {
  if (isGrimoire.value) return 'Grimoire (nouveaux sorts)'
  if (isPreparedCaster.value) return 'Sorts préparés'
  return 'Sorts connus'
})

const cantripsTarget = computed(() => CANTRIPS_KNOWN[clsId.value]?.[state.value.toLevel - 1] ?? 0)
const cantripsOld = computed(() => CANTRIPS_KNOWN[clsId.value]?.[Math.max(0, state.value.fromLevel - 1)] ?? 0)
const cantripsToLearn = computed(() => Math.max(0, cantripsTarget.value - cantripsOld.value))

const spellsToLearn = computed(() => {
  if (isGrimoire.value) return 2
  if (KNOWN_CASTERS.has(clsId.value)) {
    const target = SPELLS_KNOWN[clsId.value]?.[state.value.toLevel - 1] ?? 0
    const old = SPELLS_KNOWN[clsId.value]?.[Math.max(0, state.value.fromLevel - 1)] ?? 0
    return Math.max(0, target - old)
  }
  return 0
})

const { data: allSpells, pending } = useFetch('/api/spells', {
  query: computed(() => ({ className: pickedClass.value?.dbName ?? '' })),
  immediate: true,
})

// Sorts du Pacte du Tome — tous les cantrips toutes classes
const { data: allCantripsData, pending: pactCantripsPending } = useFetch('/api/spells', {
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

// Sort Appel de familier (pour affichage Pacte de la Chaîne)
const { data: magicianSpells } = useFetch('/api/spells', {
  query: { className: 'Magicien' },
  immediate: true,
})

const familiarSpell = computed(() =>
  ((magicianSpells.value ?? []) as any[]).find((s: any) => s.name === 'Appel de familier') ?? null,
)

// ─── Arcane Mystérieux : sorts du niveau correspondant pour Occultiste ──────

const arcanumSpellsCandidates = computed(() => {
  const lvl = arcaneMysteriumSpellLevel.value
  if (!lvl) return [] as any[]
  return ((allSpells.value ?? []) as any[]).filter(s => s.level === lvl)
})

function toggleArcanumSpell(id: number) {
  if (state.value.arcaneMysteriumSpellId === id) {
    state.value.arcaneMysteriumSpellId = null
  }
  else {
    state.value.arcaneMysteriumSpellId = id
  }
}

// ─── Livre des anciens secrets : sorts rituels de niveau 1 toutes classes ──

const { data: allRitualSpellsData, pending: ritualsPending } = useFetch<any[]>('/api/spells', {
  immediate: true,
})

// Map des invocations pour détecter si « Livre des anciens secrets » est dans
// les invocations nouvellement choisies (ou déjà connue, on n'affiche alors
// l'éditeur que si pas encore 2 sorts associés — sinon rien à choisir).
const { data: allInvocationsData } = useFetch<Array<{ id: number, name: string }>>('/api/invocations', {
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

// Synchronise le flag de validation : tant que la manifestation est sélectionnée
// dans cette montée de niveau, le step Magie exige 2 sorts rituels.
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

// Populate spell names map for the summary screen
watch(allSpells, (spells) => {
  if (!spells) return
  const map: Record<number, string> = { ...spellNamesById.value }
  for (const s of spells as any[]) map[s.id] = s.name
  spellNamesById.value = map
}, { immediate: true })

const cantrips = computed(() => ((allSpells.value ?? []) as any[]).filter(s => s.level === 0))

const maxSpellLevel = computed(() => {
  for (let i = 8; i >= 0; i--) {
    if ((newSlots.value[i] ?? 0) > 0) return i + 1
  }
  return 0
})

const spellsByLevel = computed(() => {
  const max = maxSpellLevel.value
  const result: Record<number, any[]> = {}
  for (const spell of ((allSpells.value ?? []) as any[])) {
    if (spell.level >= 1 && spell.level <= max) {
      if (!result[spell.level]) result[spell.level] = []
      result[spell.level].push(spell)
    }
  }
  return result
})

const schoolOptions = computed(() => {
  const seen = new Set<string>()
  const options: { label: string, value: string | null }[] = [{ label: 'Toutes les écoles', value: null }]
  for (const s of ((allSpells.value ?? []) as any[]).sort((a, b) => (a.school?.name ?? '').localeCompare(b.school?.name ?? ''))) {
    if (s.school?.name && !seen.has(s.school.name)) {
      seen.add(s.school.name)
      options.push({ label: t(`schools.${s.school.name}`, s.school.name), value: s.school.name })
    }
  }
  return options
})

function applyFilters(list: any[]) {
  return list.filter(s => {
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

function isCantripDisabled(id: number): boolean {
  if (currentSpellIds.value.includes(id)) return true
  if (state.value.pactBoonCantripIds.includes(id) && !state.value.newCantripIds.includes(id)) return true
  return false
}
function cantripDisabledReason(id: number): string {
  if (currentSpellIds.value.includes(id)) return 'Vous connaissez déjà ce sort mineur'
  if (state.value.pactBoonCantripIds.includes(id) && !state.value.newCantripIds.includes(id)) return 'Déjà dans vos sorts du Pacte du Tome'
  return ''
}

function toggleCantrip(id: number) {
  if (currentSpellIds.value.includes(id)) return
  const idx = state.value.newCantripIds.indexOf(id)
  if (idx >= 0) state.value.newCantripIds.splice(idx, 1)
  else if (state.value.newCantripIds.length < cantripsToLearn.value) state.value.newCantripIds.push(id)
}

function togglePactBoonCantrip(id: number) {
  const idx = state.value.pactBoonCantripIds.indexOf(id)
  if (idx >= 0) state.value.pactBoonCantripIds.splice(idx, 1)
  else if (state.value.pactBoonCantripIds.length < 3) state.value.pactBoonCantripIds.push(id)
}

function toggleSpell(id: number) {
  if (currentSpellIds.value.includes(id)) return
  const idx = state.value.newSpellIds.indexOf(id)
  if (idx >= 0) state.value.newSpellIds.splice(idx, 1)
  else if (state.value.newSpellIds.length < spellsToLearn.value) state.value.newSpellIds.push(id)
}
</script>
