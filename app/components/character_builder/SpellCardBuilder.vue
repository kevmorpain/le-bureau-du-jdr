<template>
  <div
    class="rounded-lg border transition-all overflow-hidden"
    :class="selected
      ? 'border-amber-500 bg-amber-500/10'
      : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-amber-500/40'"
  >
    <!-- Ligne principale (cliquable pour sélectionner) -->
    <div class="flex items-center gap-2 px-2.5 py-2 cursor-pointer" @click="$emit('click')">
      <!-- Dot sélection -->
      <span
        class="w-2.5 h-2.5 rounded-full shrink-0 border transition-colors"
        :class="selected ? 'bg-amber-500 border-amber-500' : 'bg-transparent border-muted'"
      />

      <div class="flex-1 min-w-0">
        <div class="font-semibold text-xs text-(--ui-text) leading-snug">{{ spell.name }}</div>
        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
          <span class="text-xs" :style="`color: ${schoolColor}`">{{ schoolName }}</span>
          <span v-if="rangeDisplay" class="text-xs text-muted">{{ rangeDisplay }}</span>
        </div>
      </div>

      <!-- Icônes indicateurs -->
      <div class="flex items-center gap-1 shrink-0">
        <UTooltip v-if="spell.concentration" :text="$t('concentration')" :delay-duration="0">
          <ConcentrationIcon class="size-4 text-amber-400" />
        </UTooltip>
        <UTooltip v-if="spell.ritual" :text="$t('ritual')" :delay-duration="0">
          <MagicSquareIcon class="size-4 text-emerald-400" />
        </UTooltip>
        <UTooltip v-if="spell.dc" :text="`JdS ${$t('ability_scores.' + spell.dc.ability)}`" :delay-duration="0">
          <ShieldIcon class="size-4 text-blue-400" />
        </UTooltip>
        <!-- Composantes -->
        <UTooltip v-for="comp in (spell.components ?? [])" :key="comp" :text="comp" :delay-duration="0">
          <VoiceActivateIcon v-if="comp === 'V'" class="size-4 text-muted" />
          <HandGestureIcon v-else-if="comp === 'S'" class="size-4 text-muted" />
          <CauldronIcon v-else-if="comp === 'M'" class="size-4 text-muted" />
        </UTooltip>
      </div>

      <!-- Bouton expand -->
      <button
        class="w-7 h-7 flex items-center justify-center rounded-md text-sm text-muted hover:text-(--ui-text) hover:bg-(--ui-bg) transition-all shrink-0 cursor-pointer"
        :class="expanded ? 'rotate-180' : ''"
        @click.stop="expanded = !expanded"
      >▾</button>
    </div>

    <!-- Détail déplié -->
    <div v-if="expanded" class="border-t border-(--ui-border) px-3 py-2.5 space-y-2">
      <!-- Métadonnées -->
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span v-if="spell.castingTime">⏱ {{ spell.castingTime }}</span>
        <span v-if="spell.duration">⌛ {{ spell.duration }}</span>
        <span v-if="spell.dc">
          JdS {{ $t('ability_scores.' + spell.dc.ability) }}
          <span v-if="spellSaveDC" class="text-amber-400 font-semibold"> DD {{ spellSaveDC }}</span>
          <span v-if="spell.dc.success" class="text-muted"> ({{ spell.dc.success === 'half' ? 'demi dégâts' : 'annulé' }})</span>
        </span>
      </div>

      <!-- Matériau si composante M -->
      <p v-if="spell.material" class="text-xs text-muted italic">{{ spell.material }}</p>

      <!-- Dégâts -->
      <div v-if="damageDisplay" class="text-xs font-semibold" :class="`text-${spell.damage!.damage_type}`">
        {{ damageDisplay.die }}
        <span v-if="spellcastingMod != null && spell.damage!.isSpellcastingModifierAdded">
          {{ spellcastingMod >= 0 ? ` +${spellcastingMod}` : ` ${spellcastingMod}` }}
        </span>
        <span class="text-muted font-normal ml-1">{{ damageDisplay.type }}</span>
      </div>

      <!-- Soins -->
      <div v-if="healDisplay" class="text-xs font-semibold text-heal">
        {{ healDisplay.die }}
        <span v-if="spellcastingMod != null && spell.heal!.isSpellcastingModifierAdded">
          {{ spellcastingMod >= 0 ? ` +${spellcastingMod}` : ` ${spellcastingMod}` }}
        </span>
        <span class="text-muted font-normal ml-1">{{ healDisplay.type }}</span>
      </div>

      <!-- Description -->
      <p class="text-xs text-muted leading-relaxed">{{ spell.description ?? 'Aucune description.' }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const SCHOOL_COLORS: Record<string, string> = {
  'Abjuration': '#60a5fa',
  'Conjuration': '#34d399',
  'Divination': '#a78bfa',
  'Enchantment': '#f472b6',
  'Evocation': '#f97316',
  'Illusion': '#818cf8',
  'Necromancy': '#6b7280',
  'Transmutation': '#fbbf24',
}

const props = defineProps<{
  spell: {
    id: number
    name: string
    level: number
    castingTime: string | null
    range: number | null
    components: string[] | null
    material: string | null
    duration: string | null
    concentration: boolean
    ritual: boolean
    description: string | null
    dc: { ability: string, success?: string } | null
    damage: {
      damage_type: string
      isSpellcastingModifierAdded?: boolean
      damage_at_character_level?: Record<string, string>
      damage_at_slot_level?: Record<string, string>
    } | null
    heal: {
      heal_type: string
      isSpellcastingModifierAdded?: boolean
      heal_at_character_level?: Record<string, string>
      heal_at_slot_level?: Record<string, string>
    } | null
    school: { name: string } | null
  }
  selected: boolean
  characterLevel?: number
  spellcastingMod?: number | null
}>()

defineEmits<{ click: [] }>()

const expanded = ref(false)

const schoolColor = computed(() => SCHOOL_COLORS[props.spell.school?.name ?? ''] ?? '#9ca3af')
const schoolName = computed(() => {
  const name = props.spell.school?.name
  return name ? t(`schools.${name}`, name) : ''
})

const rangeDisplay = computed(() => {
  const r = props.spell.range
  if (r == null) return ''
  if (r === 0) return 'contact'
  if (r === -1) return 'personnelle'
  return `${r} m`
})

// Trouver le dé approprié pour le niveau de personnage
function closestLevelDie(table: Record<string, string>, level: number): string | null {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  const best = keys.filter(k => k <= level).at(-1) ?? keys[0]
  return best !== undefined ? table[String(best)] ?? null : null
}

const damageDisplay = computed(() => {
  const d = props.spell.damage
  if (!d) return null
  const die = d.damage_at_character_level
    ? closestLevelDie(d.damage_at_character_level, props.characterLevel ?? 1)
    : d.damage_at_slot_level
      ? closestLevelDie(d.damage_at_slot_level, props.spell.level || 1)
      : null
  if (!die) return null
  return { die, type: t(`damage_types.${d.damage_type}`, 2) }
})

const healDisplay = computed(() => {
  const h = props.spell.heal
  if (!h) return null
  const die = h.heal_at_character_level
    ? closestLevelDie(h.heal_at_character_level, props.characterLevel ?? 1)
    : h.heal_at_slot_level
      ? closestLevelDie(h.heal_at_slot_level, props.spell.level || 1)
      : null
  if (!die) return null
  return { die, type: t(`heal_types.${h.heal_type}`, 2) }
})

const spellSaveDC = computed(() => {
  if (!props.spell.dc || props.spellcastingMod == null) return null
  // profBonus would ideally come from parent but we don't have it here — display DC only if passed
  return null // DC calculation requires profBonus from parent
})
</script>
