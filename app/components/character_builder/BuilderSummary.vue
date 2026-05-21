<template>
  <div class="min-h-screen bg-(--ui-bg) flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-50 flex items-center gap-3 px-4 h-11 bg-(--ui-bg-elevated) border-b border-(--ui-border) shadow-sm">
      <button class="text-xs text-muted hover:text-(--ui-text) transition-colors cursor-pointer" @click="$emit('back')">
        ← Modifier
      </button>
      <USeparator orientation="vertical" class="h-4" />
      <span class="text-sm font-bold text-(--ui-text)">Récapitulatif</span>
    </header>

    <div class="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">

      <!-- Identité -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">{{ classData?.emoji ?? '⚔️' }}</div>
        <h1 class="text-3xl font-black text-(--ui-text) mb-2">{{ state.name }}</h1>
        <div class="text-sm text-muted flex flex-wrap justify-center items-center gap-2">
          <span>{{ raceName }}</span>
          <span v-if="classData" class="font-medium" :style="`color: ${classData.color}`">
            {{ classData.name }} niveau {{ state.level }}
          </span>
          <span v-if="backgroundData">{{ backgroundData.name }}</span>
          <span
            v-if="alignmentData"
            class="px-2 py-0.5 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs"
          >{{ alignmentData.name }}</span>
        </div>
        <div v-if="state.subclass" class="text-sm text-amber-400 mt-1">{{ state.subclass }}</div>
      </div>

      <!-- Stats clés -->
      <div class="grid grid-cols-3 gap-2.5 mb-4">
        <div
          v-for="stat in keyStats"
          :key="stat.label"
          class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3 text-center"
        >
          <div class="font-black font-mono text-2xl text-(--ui-text)">{{ stat.value }}</div>
          <div class="text-xs text-muted uppercase tracking-wider mt-1" style="font-size:9px">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Caractéristiques -->
      <div class="grid grid-cols-6 gap-2 mb-4">
        <div
          v-for="ab in ABILITIES"
          :key="ab"
          class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-2 text-center"
        >
          <div class="font-black font-mono text-xl text-(--ui-text) leading-none">{{ finalAbilities[ab] ?? '—' }}</div>
          <div
            class="text-xs font-mono mt-0.5 leading-none"
            :class="finalAbilities[ab] != null && abilityMod(finalAbilities[ab]!) >= 0 ? 'text-amber-400' : 'text-red-400'"
          >{{ finalAbilities[ab] != null ? formatMod(abilityMod(finalAbilities[ab]!)) : '' }}</div>
          <div class="text-muted mt-1 leading-none" style="font-size: 9px">{{ ABILITY_SHORT[ab] }}</div>
        </div>
      </div>

      <!-- Jets de sauvegarde + Compétences -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <!-- Jets de sauvegarde -->
        <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Jets de sauvegarde</p>
          <div class="space-y-1.5">
            <div v-for="ab in ABILITIES" :key="ab" class="flex items-center gap-2">
              <span
                class="size-2 rounded-full shrink-0"
                :class="savingThrows.includes(ab) ? 'bg-amber-500' : 'bg-muted/30'"
              />
              <span class="text-xs text-muted flex-1">{{ ABILITY_LABELS[ab] }}</span>
              <span
                class="text-xs font-mono font-bold"
                :class="savingThrows.includes(ab) ? 'text-amber-400' : 'text-muted'"
              >{{ formatMod(saveBonus(ab)) }}</span>
            </div>
          </div>
        </div>

        <!-- Compétences -->
        <div class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3">
          <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Compétences maîtrisées</p>
          <div v-if="allSkills.length" class="space-y-1.5">
            <div v-for="sk in allSkills" :key="sk.key" class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-amber-500 shrink-0" />
              <span class="text-xs text-muted flex-1">{{ sk.label }}</span>
              <span class="text-xs font-mono font-bold text-amber-400">{{ formatMod(skillBonus(sk)) }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted italic">Aucune compétence</p>
        </div>
      </div>

      <!-- Sorts (si caster) -->
      <div v-if="selectedSpellNames.length" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3 mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">
          Sorts <span class="text-amber-400 ml-1">{{ selectedSpellNames.length }}</span>
        </p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="name in selectedSpellNames"
            :key="name"
            class="text-xs px-2 py-0.5 rounded-full border border-(--ui-border) bg-(--ui-bg) text-muted"
          >{{ name }}</span>
        </div>
      </div>

      <!-- Équipement -->
      <div v-if="state.equipment.length" class="rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) p-3 mb-8">
        <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">
          Équipement <span class="text-amber-400 ml-1">{{ state.equipment.length }} objets</span>
        </p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(item, i) in state.equipment"
            :key="i"
            class="text-xs px-2 py-0.5 rounded-full border border-(--ui-border) bg-(--ui-bg) text-muted"
          >{{ item }}</span>
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex gap-3 justify-center">
        <UButton
          size="lg"
          color="warning"
          :loading="submitting"
          @click="$emit('submit')"
        >
          Créer le personnage
        </UButton>
        <UButton
          size="lg"
          variant="ghost"
          color="neutral"
          @click="$emit('back')"
        >
          Modifier
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ABILITY_LABELS } from '~/data/character-builder'

defineProps<{ submitting?: boolean }>()
defineEmits<{ back: [], submit: [] }>()

const {
  state,
  classData,
  backgroundData,
  alignmentData,
  raceData,
  subraceData,
  finalAbilities,
  hpMax,
  baseAC,
  speed,
  initiative,
  profBonus,
  passivePerception,
  ABILITIES,
  ABILITY_SHORT,
  SKILLS,
  abilityMod,
  formatMod,
} = useCharacterBuilder()

const spellNamesById = useState<Record<number, string>>('builder-spell-names', () => ({}))

const raceName = computed(() =>
  subraceData.value?.name ?? raceData.value?.name ?? '—',
)

const keyStats = computed(() => [
  { label: 'PV max', value: hpMax.value != null ? String(hpMax.value) : '—' },
  { label: 'CA', value: String(baseAC.value) },
  { label: 'Vitesse', value: `${speed.value}m` },
  { label: 'Initiative', value: formatMod(initiative.value) },
  { label: 'Maîtrise', value: formatMod(profBonus.value) },
  { label: 'Perc. passive', value: String(passivePerception.value) },
])

const savingThrows = computed(() => classData.value?.savingThrows ?? [])

function saveBonus(ab: string) {
  const score = finalAbilities.value[ab as keyof typeof finalAbilities.value] ?? 10
  const mod = abilityMod(score)
  return savingThrows.value.includes(ab) ? mod + profBonus.value : mod
}

const allSkillKeys = computed(() => [
  ...new Set([
    ...state.value.skills,
    ...(backgroundData.value?.skillProficiencies ?? []),
  ]),
])

const allSkills = computed(() =>
  allSkillKeys.value.map(key => SKILLS.find(s => s.key === key)).filter(Boolean) as typeof SKILLS,
)

function skillBonus(sk: { ability: string }) {
  const score = finalAbilities.value[sk.ability as keyof typeof finalAbilities.value] ?? 10
  return abilityMod(score) + profBonus.value
}

const selectedSpellNames = computed(() => {
  const map = spellNamesById.value
  const s = state.value
  const names: string[] = [
    ...s.selectedCantrips.map(id => map[id]).filter(Boolean) as string[],
    ...s.selectedSpells.map(id => map[id]).filter(Boolean) as string[],
    ...s.selectedPactBoonCantripIds.map(id => map[id]).filter(Boolean) as string[],
  ]
  if (s.pactBoon === 'chain') names.push('Appel de familier')
  return names
})
</script>
