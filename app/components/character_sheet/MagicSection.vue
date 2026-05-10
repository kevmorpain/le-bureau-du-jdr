<template>
  <div class="space-y-4">
    <!-- Alerte armure -->
    <UAlert
      v-if="armorSpellcastingWarning"
      :title="armorSpellcastingWarning"
      color="error"
      variant="soft"
      icon="i-heroicons:no-symbol"
    />

    <!-- Stats d'incantation -->
    <div
      v-if="spellcastingStats"
      class="flex gap-x-6"
    >
      <div>
        <p class="text-sm text-muted">
          Caractéristique
        </p>
        <p class="font-semibold uppercase">
          {{ spellcastingStats.ability }}
        </p>
      </div>
      <div>
        <p class="text-sm text-muted">
          DD de sauvegarde
        </p>
        <p class="font-semibold">
          {{ spellcastingStats.dc }}
        </p>
      </div>
      <div>
        <p class="text-sm text-muted">
          Bonus d'attaque
        </p>
        <p class="font-semibold">
          {{ formatModifier(spellcastingStats.attackBonus) }}
        </p>
      </div>
    </div>

    <!-- Stats de Magie du Pacte -->
    <div
      v-if="pactMagicStats"
      class="flex gap-x-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2"
    >
      <div class="flex items-center pr-2">
        <UBadge color="violet" variant="subtle" size="xs">Pacte</UBadge>
      </div>
      <div>
        <p class="text-sm text-muted">
          Caractéristique
        </p>
        <p class="font-semibold uppercase">
          {{ pactMagicStats.ability }}
        </p>
      </div>
      <div>
        <p class="text-sm text-muted">
          DD de sauvegarde
        </p>
        <p class="font-semibold">
          {{ pactMagicStats.dc }}
        </p>
      </div>
      <div>
        <p class="text-sm text-muted">
          Bonus d'attaque
        </p>
        <p class="font-semibold">
          {{ formatModifier(pactMagicStats.attackBonus) }}
        </p>
      </div>
    </div>

    <!-- Filtres + bouton ajouter -->
    <div class="flex flex-wrap items-center gap-2">
      <USwitch
        v-model="showPreparedOnly"
        label="Préparés"
        size="sm"
      />

      <!-- Filtre type d'action -->
      <div class="flex gap-1">
        <button
          v-for="f in actionTypeFilters"
          :key="f.value"
          class="px-2 py-0.5 text-xs rounded-full border transition-colors"
          :class="activeActionFilter === f.value
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-default text-muted hover:border-muted'"
          @click="activeActionFilter = activeActionFilter === f.value ? null : f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Filtre composantes -->
      <div class="flex gap-1">
        <button
          v-for="c in ['V', 'S', 'M']"
          :key="c"
          class="px-2 py-0.5 text-xs rounded-full border transition-colors"
          :class="activeComponentFilters.includes(c)
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-default text-muted hover:border-muted'"
          @click="activeComponentFilters.includes(c) ? activeComponentFilters.splice(activeComponentFilters.indexOf(c), 1) : activeComponentFilters.push(c)"
        >
          {{ c }}
        </button>
      </div>

      <!-- Filtre niveau -->
      <div class="flex gap-1">
        <button
          v-for="lvl in availableLevels"
          :key="lvl"
          class="px-2 py-0.5 text-xs rounded-full border transition-colors"
          :class="activeLevelFilters.includes(lvl)
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-default text-muted hover:border-muted'"
          @click="activeLevelFilters.includes(lvl) ? activeLevelFilters.splice(activeLevelFilters.indexOf(lvl), 1) : activeLevelFilters.push(lvl)"
        >
          {{ lvl === 0 ? 'Tour' : `N${lvl}` }}
        </button>
      </div>

      <UButton
        class="ml-auto"
        icon="i-heroicons:plus"
        variant="outline"
        size="sm"
        @click="showAddSpell = true"
      >
        Ajouter un sort
      </UButton>
    </div>

    <!-- Liste des sorts groupés par niveau -->
    <div
      v-if="characterSpells && characterSpells.length > 0"
      class="space-y-4"
    >
      <div
        v-for="group in filteredByLevel(spellsByLevel)"
        :key="group.level"
        class="space-y-1"
      >
        <!-- En-tête de niveau avec emplacements -->
        <div
          class="flex items-center gap-3 border-b border-default pb-1 cursor-pointer select-none"
          @click="toggleLevelCollapse(group.level)"
        >
          <UIcon
            :name="collapsedLevels.has(group.level) ? 'i-heroicons:chevron-right-16-solid' : 'i-heroicons:chevron-down-16-solid'"
            class="size-3.5 text-muted shrink-0"
          />
          <span class="font-semibold text-sm">
            {{ group.level === 0 ? 'Tours de magie' : `Niveau ${group.level}` }}
          </span>

          <!-- Bulles d'emplacements (niveaux ≥ 1 seulement) -->
          <div
            v-if="group.level > 0"
            class="flex items-center gap-1.5 flex-wrap"
            @click.stop
          >
            <!-- Spellcasting -->
            <template v-if="spellSlots.spellcasting[group.level]">
              <button
                v-if="spellSlots.spellcasting[group.level]!.max > 0"
                class="size-4 flex items-center justify-center rounded text-muted hover:text-default hover:bg-elevated transition-colors text-xs leading-none"
                @click="adjustSlotMax(group.level, 'spellcasting', -1)"
              >
                −
              </button>
              <button
                v-for="n in spellSlots.spellcasting[group.level]!.max"
                :key="`sc-${n}`"
                class="border-2 size-3.5 rounded-full transition-colors"
                :class="n <= spellSlots.spellcasting[group.level]!.max - spellSlots.spellcasting[group.level]!.current ? 'bg-primary/60 border-primary hover:bg-primary/80' : 'bg-transparent border-muted hover:border-primary/50'"
                @click="toggleSlot(group.level, 'spellcasting', n)"
              />
              <button
                class="size-4 flex items-center justify-center rounded text-muted hover:text-default hover:bg-elevated transition-colors text-xs leading-none"
                @click="adjustSlotMax(group.level, 'spellcasting', 1)"
              >
                +
              </button>
            </template>

            <!-- Pact Magic -->
            <template v-if="spellSlots.pact_magic[group.level] && spellSlots.pact_magic[group.level]!.max > 0">
              <UBadge color="violet" variant="subtle" size="xs" class="ml-2">
                Pacte
              </UBadge>
              <button
                v-for="n in spellSlots.pact_magic[group.level]!.max"
                :key="`pm-${n}`"
                class="border-2 size-3.5 rounded-full transition-colors"
                :class="n <= spellSlots.pact_magic[group.level]!.max - spellSlots.pact_magic[group.level]!.current ? 'bg-violet-500/60 border-violet-500 hover:bg-violet-500/80' : 'bg-transparent border-violet-400/40 hover:border-violet-400'"
                @click="toggleSlot(group.level, 'pact_magic', n)"
              />
            </template>
          </div>
        </div>

        <!-- Sorts du groupe -->
        <template v-if="!collapsedLevels.has(group.level)">
          <div
            v-for="cs in filteredSpells(group.spells)"
            :key="cs.spellId"
            class="flex items-center gap-1"
          >
            <CharacterSpellRow
              class="flex-1 min-w-0"
              :spell="cs.spell"
              :is-prepared="cs.isPrepared"
              :has-somatic-warning="isIncapacitated && cs.spell.components.includes(SpellComponent.Somatic)"
              :character-level="characterLevel"
              :spellcasting-modifier="spellcastingModifier"
              @click="openSpellDetail(cs)"
              @toggle-prepared="(val) => togglePrepared(cs.spellId, val)"
              @remove="removeSpell(cs.spellId)"
            />
            <!-- Bouton Lancer inline -->
            <UButton
              v-if="cs.spell.level > 0 && cs.isPrepared"
              size="xs"
              variant="soft"
              icon="i-game-icons:magic-swirl"
              class="shrink-0"
              @click.stop="openCastModalFor(cs)"
            >
              Lancer
            </UButton>
          </div>
        </template>
      </div>
    </div>

    <p
      v-else-if="characterSpells && characterSpells.length === 0"
      class="text-muted text-sm text-center py-4"
    >
      Aucun sort ajouté. Cliquez sur "Ajouter un sort" pour commencer.
    </p>

    <!-- Slideover détail du sort + lancer -->
    <USlideover
      v-model:open="showSpellDetail"
      :title="selectedSpell?.spell.name"
    >
      <template #body>
        <div
          v-if="selectedSpell"
          class="p-4 space-y-4"
        >
          <SpellCard :spell="selectedSpell.spell" />

          <div class="flex gap-2">
            <UButton
              v-if="selectedSpell.spell.level > 0"
              block
              icon="i-game-icons:magic-swirl"
              @click="openCastModal"
            >
              Lancer
            </UButton>
            <UButton
              v-else
              block
              icon="i-game-icons:magic-swirl"
              variant="outline"
              disabled
            >
              Sort de tour (aucun emplacement requis)
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Modal choix d'emplacement -->
    <CastSpellModal
      v-if="selectedSpell"
      v-model:open="showCastModal"
      :spell="selectedSpell.spell"
      :spell-slots="spellSlots"
      @cast="handleCast"
    />

    <!-- Slideover ajout de sort -->
    <AddSpellSlideover
      v-model:open="showAddSpell"
      :already-added-ids
      @add="addSpell"
    />
  </div>
</template>

<script lang="ts" setup>
import { SpellComponent } from '~~/server/db/schema/spells'
import type { CharacterSpellWithSpell } from '~/composables/character/useCharacterSpells'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const characterSheetRef = toRef(props, 'characterSheet')

provide('isSpellbook', true)

type SlotState = { max: number, current: number }
type SlotsByType = {
  spellcasting: Record<number, SlotState>
  pact_magic: Record<number, SlotState>
}
type SlotType = 'spellcasting' | 'pact_magic'

const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!

const {
  spellcastingModifier,
  spellcastingStats,
  pactMagicStats,
  armorSpellcastingWarning,
  characterLevel,
  activeConditions,
  toggleCondition,
  characterSpells,
  spellsByLevel,
  showPreparedOnly,
  togglePrepared,
  addSpell,
  removeSpell,
} = useCharacterSheet(characterSheetRef)

const castSpell = (slotLevel: number, slotType: SlotType) => {
  const slot = spellSlots.value[slotType][slotLevel]
  if (slot && slot.current > 0) slot.current--
}

const isIncapacitated = computed(() => activeConditions.value.includes('incapacitated'))

provide<SpellContext>('spellContext', { characterLevel, spellcastingModifier })

// ─── Filtres supplémentaires ─────────────────────────────────────────────────

const activeActionFilter = ref<string | null>(null)
const activeComponentFilters = ref<string[]>([])
const activeLevelFilters = ref<number[]>([])
const collapsedLevels = ref(new Set<number>())

const availableLevels = computed(() =>
  spellsByLevel.value.map(g => g.level),
)

const filteredByLevel = (groups: typeof spellsByLevel.value) =>
  activeLevelFilters.value.length
    ? groups.filter(g => activeLevelFilters.value.includes(g.level))
    : groups

const toggleLevelCollapse = (level: number) => {
  const s = new Set(collapsedLevels.value)
  if (s.has(level)) s.delete(level)
  else s.add(level)
  collapsedLevels.value = s
}

const actionTypeFilters = [
  { value: 'action', label: 'Action' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'reaction', label: 'Réaction' },
]

const filteredSpells = (spells: typeof spellsByLevel.value[number]['spells']) => {
  return spells.filter((cs) => {
    if (activeActionFilter.value) {
      const ct = cs.spell.castingTime?.toLowerCase() ?? ''
      if ((activeActionFilter.value === 'action' && !ct.includes('action')) || ct.includes('bonus')) return false
      if (activeActionFilter.value === 'bonus' && !ct.includes('bonus')) return false
      if (activeActionFilter.value === 'reaction' && !ct.includes('réaction') && !ct.includes('reaction')) return false
    }
    if (activeComponentFilters.value.length) {
      if (!activeComponentFilters.value.every(f => cs.spell.components.includes(f as SpellComponent)))
        return false
    }
    return true
  })
}

// ─── Slideover détail ────────────────────────────────────────────────────────

const showSpellDetail = ref(false)
const selectedSpell = ref<CharacterSpellWithSpell | null>(null)

const openSpellDetail = (cs: CharacterSpellWithSpell) => {
  selectedSpell.value = cs
  showSpellDetail.value = true
}

// ─── Modal lancer ────────────────────────────────────────────────────────────

const showCastModal = ref(false)

const openCastModal = () => {
  showSpellDetail.value = false
  showCastModal.value = true
}

// Ouverture directe depuis le bouton inline
const openCastModalFor = (cs: CharacterSpellWithSpell) => {
  selectedSpell.value = cs
  showCastModal.value = true
}

const handleCast = (slotLevel: number, slotType: SlotType) => {
  castSpell(slotLevel, slotType)
  // Activer la concentration si le sort la requiert
  if (selectedSpell.value?.spell.concentration) {
    if (!activeConditions.value.includes('concentrating' as never)) {
      toggleCondition('concentrating' as never)
    }
    try {
      localStorage.setItem('cs-concentration-spell', selectedSpell.value.spell.name)
    } catch { /* localStorage non disponible */ }
    useToast().add({
      title: `Concentration active — ${selectedSpell.value.spell.name}`,
      color: 'info',
    })
  }
}

// ─── Emplacements (toggle manuel) ────────────────────────────────────────────

const toggleSlot = (level: number, slotType: SlotType, n: number) => {
  const slot = spellSlots.value[slotType][level]
  if (!slot) return
  const used = slot.max - slot.current
  if (n <= used) slot.current = slot.max - (n - 1) // plein → libérer jusqu'à n
  else slot.current = slot.max - n // vide → utiliser jusqu'à n
}

const adjustSlotMax = (level: number, slotType: SlotType, delta: number) => {
  const slot = spellSlots.value[slotType][level]
  if (!slot) return
  const newMax = Math.max(0, Math.min(9, slot.max + delta))
  slot.max = newMax
  if (delta > 0) slot.current = slot.current + 1 // nouveau slot = disponible
  else slot.current = Math.min(slot.current, newMax)
}

// ─── Ajout de sort ───────────────────────────────────────────────────────────

const showAddSpell = ref(false)

const alreadyAddedIds = computed(() =>
  new Set((characterSpells.value ?? []).map(cs => cs.spellId)),
)
</script>
