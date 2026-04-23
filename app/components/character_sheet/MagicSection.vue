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
    <div class="md:flex gap-x-4 space-y-4 md:space-y-0 items-end">
      <UFormField label="Caractéristique d'incantation">
        <USelect
          v-model="spellcastingAbility"
          :items="spellcastingAbilityOptions"
          placeholder="Aucune"
          class="min-w-32"
        />
      </UFormField>

      <template v-if="spellcastingAbility">
        <div>
          <p class="text-sm text-muted">
            DD de sauvegarde des sorts
          </p>
          <p class="font-semibold">
            {{ spellSaveDC ?? '—' }}
          </p>
        </div>

        <div>
          <p class="text-sm text-muted">
            Bonus d'attaque avec un sort
          </p>
          <p class="font-semibold">
            {{ spellAttackModifier !== null ? formatModifier(spellAttackModifier) : '—' }}
          </p>
        </div>
      </template>
    </div>

    <!-- Filtres + bouton ajouter -->
    <div class="flex items-center gap-3 flex-wrap">
      <USwitch
        v-model="showPreparedOnly"
        label="Préparés seulement"
      />
      <USwitch
        v-model="showAvailableOnly"
        label="Disponibles seulement"
      />
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
        v-for="group in spellsByLevel"
        :key="group.level"
        class="space-y-1"
      >
        <!-- En-tête de niveau avec emplacements -->
        <div class="flex items-center gap-3 border-b border-default pb-1">
          <span class="font-semibold text-sm">
            {{ group.level === 0 ? 'Tours de magie' : `Niveau ${group.level}` }}
          </span>

          <!-- Bulles d'emplacements (niveaux ≥ 1 seulement) -->
          <div
            v-if="group.level > 0 && spellSlots[group.level]"
            class="flex items-center gap-1"
          >
            <button
              v-for="n in spellSlots[group.level]!.max"
              :key="n"
              class="border size-3.5 rounded-full transition-colors hover:bg-primary/50"
              :class="n <= spellSlots[group.level]!.current ? 'bg-primary' : 'bg-transparent'"
              @click="toggleSlot(group.level, n)"
            />
            <span
              v-if="spellSlots[group.level]!.max === 0"
              class="text-xs text-muted italic"
            >
              aucun emplacement
            </span>
          </div>
        </div>

        <!-- Sorts du groupe -->
        <CharacterSpellRow
          v-for="cs in group.spells"
          :key="cs.spellId"
          :spell="cs.spell"
          :is-prepared="cs.isPrepared"
          :is-available="isSpellAvailable(cs.spell)"
          :has-somatic-warning="isIncapacitated && cs.spell.components.includes(SpellComponent.Somatic)"
          :character-level="characterLevel"
          :spellcasting-modifier="spellcastingModifier"
          @click="openSpellDetail(cs)"
          @toggle-prepared="(val) => togglePrepared(cs.spellId, val)"
          @remove="removeSpell(cs.spellId)"
        />
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
      :already-added-ids="alreadyAddedIds"
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

const { t } = useI18n()

provide('isSpellbook', true)

const {
  spellcastingAbility,
  spellcastingModifier,
  spellAttackModifier,
  spellSaveDC,
  spellSlots,
  armorSpellcastingWarning,
  characterLevel,
  activeConditions,
  characterSpells,
  spellsByLevel,
  showPreparedOnly,
  showAvailableOnly,
  isSpellAvailable,
  togglePrepared,
  addSpell,
  removeSpell,
  castSpell,
} = useCharacterSheet(characterSheetRef)

const isIncapacitated = computed(() => activeConditions.value.includes('incapacitated'))

provide<SpellContext>('spellContext', { characterLevel, spellcastingModifier })

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

const handleCast = (slotLevel: number) => {
  castSpell(slotLevel)
}

// ─── Emplacements (toggle manuel) ────────────────────────────────────────────

const toggleSlot = (level: number, n: number) => {
  const slot = spellSlots.value[level]
  if (!slot) return
  if (n === slot.current) slot.current--
  else if (n <= slot.max) slot.current = n
}

// ─── Ajout de sort ───────────────────────────────────────────────────────────

const showAddSpell = ref(false)

const alreadyAddedIds = computed(() =>
  new Set((characterSpells.value ?? []).map(cs => cs.spellId)),
)

// ─── Spellcasting ability options ────────────────────────────────────────────

const spellcastingAbilityOptions = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(key => ({
  label: t(`ability_scores.${key}`),
  value: key,
}))
</script>
