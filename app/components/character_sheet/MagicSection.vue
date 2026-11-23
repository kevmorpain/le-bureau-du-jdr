<template>
  <div class="space-y-4">
    <UAlert
      v-if="armorSpellcastingWarning"
      :title="armorSpellcastingWarning"
      color="error"
      variant="soft"
      icon="i-heroicons:no-symbol"
    />

    <UAlert
      v-if="spellcastingBlockedWarning"
      :title="spellcastingBlockedWarning"
      color="warning"
      variant="soft"
      icon="i-heroicons:exclamation-triangle"
    />

    <div
      v-if="spellcasterClasses.length > 1"
      class="flex items-center gap-2"
    >
      <span class="text-sm text-muted">Lance comme :</span>
      <USelect
        :items="casterClassItems"
        value-key="value"
        :model-value="selectedCasterClassId ?? activeCasterClass?.classId ?? null"
        size="sm"
        @update:model-value="(v: number | null) => setSelectedCaster(v)"
      />
    </div>

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

    <div
      v-if="preparedLimit !== null"
      class="flex items-center gap-2 text-sm"
    >
      <span class="text-muted">Sorts préparés</span>
      <span
        class="font-semibold"
        :class="preparedCount > preparedLimit ? 'text-warning' : ''"
      >
        {{ preparedCount }} / {{ preparedLimit }}
      </span>
      <span
        v-if="preparedCount > preparedLimit"
        class="text-xs text-warning"
      >
        au-dessus de la limite du jour
      </span>
    </div>

    <div
      v-if="pactMagicStats"
      class="flex gap-x-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2"
    >
      <div class="flex items-center pr-2">
        <UBadge
          color="violet"
          variant="subtle"
          size="md"
        >
          Pacte
        </UBadge>
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

    <div class="flex flex-wrap items-center gap-2">
      <UInput
        v-model="spellSearch"
        icon="i-heroicons:magnifying-glass"
        placeholder="Rechercher un sort"
        size="sm"
        class="w-48"
      />

      <USwitch
        v-model="showPreparedOnly"
        label="Préparés"
        size="sm"
      />

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

    <div
      v-if="characterSpells && characterSpells.length > 0"
      class="space-y-4"
    >
      <div
        v-for="group in filteredByLevel(spellsByLevel)"
        :key="group.level"
        class="space-y-1"
      >
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

          <div
            v-if="group.level > 0"
            class="flex items-center gap-1.5 flex-wrap"
            @click.stop
          >
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

            <template v-if="spellSlots.pact_magic[group.level] && spellSlots.pact_magic[group.level]!.max > 0">
              <UBadge
                color="violet"
                variant="subtle"
                size="md"
                class="ml-2"
              >
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

        <template v-if="!collapsedLevels.has(group.level)">
          <UCollapsible
            v-for="cs in filteredSpells(group.spells)"
            :key="cs.spellId"
          >
            <div class="flex items-center gap-1">
              <CharacterSpellRow
                class="flex-1 min-w-0"
                :spell="cs.spell"
                :is-prepared="cs.isPrepared"
                :always-prepared="cs.alwaysPrepared"
                :has-somatic-warning="isIncapacitated && cs.spell.components.includes(SpellComponent.Somatic)"
                :character-level="characterLevel"
                :spellcasting-modifier="casterStatsOf(cs)?.modifier ?? null"
                :source="cs.source"
                :eldritch-blast-agonizing="eldritchBlastMods.agonizing"
                :eldritch-blast-repelling="eldritchBlastMods.repelling"
                :eldritch-blast-range-extended="eldritchBlastMods.rangeExtended"
                :eldritch-blast-source-names="eldritchBlastMods.sourceNames"
                :charisma-modifier="charismaModifier"
                @toggle-prepared="(val) => togglePrepared(cs.spellId, val)"
                @remove="removeSpell(cs.spellId)"
              />
              <!-- Bouton Lancer : consomme l'emplacement et fait le jet pour toucher (sorts
                   d'attaque) ou le jet d'effet (dégâts/soin des autres sorts) -->
              <UButton
                v-if="cs.spell.level === 0 || cs.isPrepared || isArcanumSpell(cs)"
                size="xs"
                variant="soft"
                icon="i-game-icons:magic-swirl"
                class="shrink-0"
                @click.stop="
                  cs.spell.level === 0
                    ? castCantrip(cs)
                    : isArcanumSpell(cs)
                      ? castArcanum(cs)
                      : openCastModalFor(cs)
                "
              >
                Lancer
              </UButton>
              <!-- Dégâts (sorts d'attaque) : jet au niveau du lancement, sans reconsommer
                   d'emplacement. Le chevron permet de changer ce niveau quand il y a un choix. -->
              <UFieldGroup
                v-if="isAttackSpell(cs) && cs.spell.damages?.length && (cs.spell.level === 0 || cs.isPrepared || isArcanumSpell(cs))"
                size="xs"
                class="shrink-0"
              >
                <RollButton
                  variant="soft"
                  color="warning"
                  icon="i-game-icons:blood"
                  @click.stop="rollSpellEffect(cs, getCastLevel(cs))"
                >
                  {{ damageButtonLabel(cs) }}
                </RollButton>
                <UTooltip
                  v-if="rollsEnabled && scalingSpellIds.has(cs.spellId)"
                  :delay-duration="0"
                  text="Jeter à un autre niveau"
                >
                  <UButton
                    variant="soft"
                    color="warning"
                    icon="i-heroicons:chevron-down"
                    :aria-label="`Jeter les dégâts de ${cs.spell.name} à un autre niveau`"
                    @click.stop="openDamageLevelPicker(cs)"
                  />
                </UTooltip>
              </UFieldGroup>
            </div>

            <template #content>
              <div class="px-2 pb-2 pt-1 space-y-3">
                <SpellDetails
                  :spell="cs.spell"
                  :save-dc="casterStatsOf(cs)?.dc ?? null"
                  :attack-bonus="casterStatsOf(cs)?.attackBonus ?? null"
                />

                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-if="isArcanumSpell(cs)"
                    icon="i-game-icons:magic-swirl"
                    @click="castArcanum(cs)"
                  >
                    Lancer (Arcane Mystérieux — 1/repos long)
                  </UButton>
                  <UButton
                    v-else-if="cs.spell.level > 0"
                    icon="i-game-icons:magic-swirl"
                    @click="openCastModalFor(cs)"
                  >
                    Lancer
                  </UButton>
                  <UButton
                    v-else
                    icon="i-game-icons:magic-swirl"
                    @click="castCantrip(cs)"
                  >
                    Lancer (aucun emplacement requis)
                  </UButton>
                  <UTooltip
                    v-if="canRitual(cs)"
                    :delay-duration="0"
                    text="+10 minutes d'incantation, aucun emplacement dépensé, pas de montée en puissance"
                  >
                    <UButton
                      variant="soft"
                      icon="i-heroicons:clock"
                      @click="castAsRitual(cs)"
                    >
                      Lancer en rituel
                    </UButton>
                  </UTooltip>
                </div>
              </div>
            </template>
          </UCollapsible>
        </template>
      </div>
    </div>

    <p
      v-else-if="characterSpells && characterSpells.length === 0"
      class="text-muted text-sm text-center py-4"
    >
      Aucun sort ajouté. Cliquez sur "Ajouter un sort" pour commencer.
    </p>

    <CastSpellModal
      v-if="selectedSpell"
      v-model:open="showCastModal"
      :spell="selectedSpell.spell"
      :spell-slots="spellSlots"
      :caster-choices="spellcasterClasses"
      :initial-caster-class-id="selectedCasterClassId ?? activeCasterClass?.classId ?? null"
      :warning="spellcastingBlockedWarning"
      @cast="handleCast"
    />

    <!-- Choix du niveau pour le jet de dégâts (aucun emplacement dépensé) -->
    <RollDamageModal
      v-if="selectedSpell"
      v-model:open="showDamageModal"
      :spell="selectedSpell.spell"
      :owned-levels="ownedSlotLevels"
      :initial-level="getCastLevel(selectedSpell)"
      @roll="handleRollDamage"
    />

    <AddSpellSlideover
      v-model:open="showAddSpell"
      :already-added-ids
      :ruleset="characterSheet.ruleset"
      @add="spellId => addSpell(spellId, activeCasterClass?.classId ?? null)"
    />
  </div>
</template>

<script lang="ts" setup>
import { SpellComponent } from '~~/server/db/schema/spells'
import type { ActionCost } from '~~/shared/rules/actionCost'
import { classSlugFromName } from '~~/shared/rules/classSlugs'
import { countPreparedSpells, preparedSpellsLimit } from '~~/shared/rules/spellsKnown'
import { baseSlotLevel } from '~~/shared/rules/spellScaling'
import type { CharacterSpellWithSpell, SlotType } from '~/composables/character/useCharacterSpells'
import type { SlotsByType } from '~/composables/character/useCharacterSpellcasting'
import { useSpellCasting } from '~/composables/character/useSpellCasting'

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const characterSheetRef = toRef(props, 'characterSheet')

provide('isSpellbook', true)

const spellSlots = inject<Ref<SlotsByType>>('spellSlots')!

const characterSheetApi = useCharacterSheet(characterSheetRef)
const {
  spellcastingModifier,
  statsForCasterClass,
  statsForSpell,
  spellcasterClasses,
  activeCasterClass,
  selectedCasterClassId,
  armorSpellcastingWarning,
  spellcastingBlockedWarning,
  spellcastingStats,
  pactMagicStats,
  setSelectedCaster,
  characterLevel,
  activeConditions,
  characterSpells,
  spellsByLevel,
  showPreparedOnly,
  togglePrepared,
  addSpell,
  removeSpell,
} = characterSheetApi

const {
  isAttackSpell,
  isArcanumSpell,
  canRitual,
  getCastLevel,
  rememberCastLevel,
  ownedSlotLevels,
  scalingSpellIds,
  charismaModifier,
  eldritchBlastMods,
  rollSpellEffect,
  castWithSlot,
  castCantrip,
  castAsRitual,
  castArcanum,
} = useSpellCasting(characterSheetRef, { ...characterSheetApi, spellSlots })

const abilityShortLabels: Record<string, string> = {
  str: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'SAG', cha: 'CHA',
}

const casterStatsOf = (cs: CharacterSpellWithSpell) => statsForSpell(cs)

const preparedLimit = computed<number | null>(() => {
  const caster = activeCasterClass.value
  const slug = caster ? classSlugFromName(caster.className) : undefined
  const classLevel = characterSheetRef.value.classes?.find(c => c.classId === caster?.classId)?.level
  if (!caster || !slug || !classLevel) return null
  return preparedSpellsLimit(props.characterSheet.ruleset, slug, classLevel, statsForCasterClass(caster.classId)?.modifier ?? 0)
})

const preparedCount = computed(() => {
  const caster = activeCasterClass.value
  if (!caster) return 0
  return countPreparedSpells((characterSpells.value ?? []).map(cs => ({ ...cs, level: cs.spell.level })), caster.classId)
})

const casterClassItems = computed(() =>
  spellcasterClasses.value.map(c => ({
    label: `${c.className} (${abilityShortLabels[c.ability] ?? c.ability.toUpperCase()})`,
    value: c.classId,
  })),
)

const isIncapacitated = computed(() => activeConditions.value.includes('incapacitated'))

const activeActionFilter = ref<ActionCost | null>(null)
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

const actionTypeFilters: { value: ActionCost, label: string }[] = [
  { value: 'action', label: 'Action' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'reaction', label: 'Réaction' },
]

const spellSearch = ref('')

const filteredSpells = (spells: typeof spellsByLevel.value[number]['spells']) =>
  spells.filter(cs => matchesSpellFilters(cs.spell, {
    search: spellSearch.value,
    cost: activeActionFilter.value,
    components: activeComponentFilters.value as SpellComponent[],
  }))

const selectedSpell = ref<CharacterSpellWithSpell | null>(null)

const showCastModal = ref(false)

const openCastModalFor = (cs: CharacterSpellWithSpell) => {
  selectedSpell.value = cs
  showCastModal.value = true
}

const { rollsEnabled } = useDiceRoller()

const showDamageModal = ref(false)

// Le niveau retenu est affiché : un niveau mémorisé en silence serait un piège.
const damageButtonLabel = (cs: CharacterSpellWithSpell): string => {
  const level = getCastLevel(cs)
  return level > baseSlotLevel(cs.spell) ? `Dégâts (niv. ${level})` : 'Dégâts'
}

const openDamageLevelPicker = (cs: CharacterSpellWithSpell) => {
  selectedSpell.value = cs
  showDamageModal.value = true
}

const handleRollDamage = (slotLevel: number) => {
  if (!selectedSpell.value) return
  rememberCastLevel(selectedSpell.value.spellId, slotLevel)
  rollSpellEffect(selectedSpell.value, slotLevel)
}

const handleCast = (slotLevel: number, slotType: SlotType, casterClassId: number | null) => {
  if (selectedSpell.value) castWithSlot(selectedSpell.value, slotLevel, slotType, casterClassId)
}

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

const showAddSpell = ref(false)

const alreadyAddedIds = computed(() =>
  new Set((characterSpells.value ?? []).map(cs => cs.spellId)),
)

provide<SpellContext>('spellContext', {
  characterLevel,
  spellcastingModifier,
  eldritchBlastAgonizing: computed(() => eldritchBlastMods.value.agonizing),
  eldritchBlastRepelling: computed(() => eldritchBlastMods.value.repelling),
  eldritchBlastRangeExtended: computed(() => eldritchBlastMods.value.rangeExtended),
  eldritchBlastSourceNames: computed(() => eldritchBlastMods.value.sourceNames),
  charismaModifier,
})
</script>
