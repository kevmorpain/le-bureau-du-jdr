<template>
  <div class="min-h-screen bg-(--ui-bg) flex flex-col">
  <!-- Header : même format que le wizard, sans les step pills -->
  <header class="sticky top-0 z-50 flex items-center gap-3 px-4 h-11 bg-(--ui-bg-elevated) border-b border-(--ui-border) shadow-sm">
    <NuxtLink
      :to="`/characters/${charSheet?.id}`"
      class="text-xs text-muted hover:text-(--ui-text) transition-colors"
    >← Fiche</NuxtLink>
    <USeparator orientation="vertical" class="h-4" />
    <span class="text-sm font-bold text-(--ui-text)">Montée de niveau</span>
    <span class="text-xs text-amber-400">D&amp;D 5e 2014</span>
    <span class="text-xs text-muted ml-2 truncate">
      {{ charSheet?.name }} · {{ charClasses.map(c => `${c.className} ${c.level}`).join(' / ') }}
    </span>
  </header>

  <div class="max-w-4xl mx-auto w-full px-6 py-8">

    <!-- Hero : radial gradient + watermark + badge symétrique -->
    <div
      v-if="pickedClass"
      class="relative overflow-hidden rounded-2xl mb-6 px-7 py-8 text-center"
      :style="{
        background: `radial-gradient(circle at 50% 0%, ${pickedClass.color}30 0%, var(--ui-bg-elevated) 60%)`,
        border: `1px solid ${pickedClass.color}60`,
        boxShadow: `0 0 60px ${pickedClass.color}25 inset`,
      }"
    >
      <!-- Watermark emoji géant -->
      <div
        class="absolute inset-0 flex items-center justify-center text-[300px] leading-none opacity-[0.05] pointer-events-none select-none"
      >{{ pickedClass.emoji }}</div>

      <div class="relative">
        <!-- Badge symétrique -->
        <div
          class="text-xs font-bold tracking-[0.25em] uppercase mb-2"
          :style="{ color: pickedClass.color }"
        >
          {{ state.isMulticlass ? '✦ MULTI-CLASSAGE ✦' : '▲ NIVEAU SUPÉRIEUR ▲' }}
        </div>

        <!-- Nom du personnage -->
        <div class="text-4xl font-black text-(--ui-text) tracking-tight mb-1.5">
          {{ charSheet?.name ?? '—' }}
        </div>

        <!-- "devient ClassName niv. X → Y" -->
        <div class="text-sm text-muted mb-4">
          {{ state.isMulticlass ? 'devient aussi ' : '' }}
          <span class="font-bold" :style="{ color: pickedClass.color }">{{ pickedClass.name }}</span>
          <span class="font-mono ml-1.5">
            niv. {{ state.fromLevel }} →
            <span class="text-lg font-black" :style="{ color: pickedClass.color }">{{ state.toLevel }}</span>
          </span>
        </div>

        <!-- Pill "Niveau total X → Y" -->
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-(--ui-border) bg-(--ui-bg)"
        >
          <span class="text-xs text-muted">Niveau total</span>
          <span class="font-mono font-black text-sm" :style="{ color: pickedClass.color }">
            {{ totalLevel }} → {{ totalLevel + 1 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Avant / Après côte à côte -->
    <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-6">
      <!-- AVANT -->
      <div
        class="rounded-xl p-4"
        style="opacity: 0.72"
        :style="{
          background: 'var(--ui-bg-elevated)',
          border: '1px solid var(--ui-border)',
        }"
      >
        <div class="text-xs font-bold tracking-[0.18em] uppercase text-muted mb-3">AVANT</div>
        <!-- PV + Maîtrise -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="px-2 py-2 rounded-lg bg-(--ui-bg) text-center">
            <div class="text-xs text-muted mb-0.5">PV MAX</div>
            <div class="font-mono font-black text-xl text-muted">{{ currentHpMax }}</div>
          </div>
          <div class="px-2 py-2 rounded-lg bg-(--ui-bg) text-center">
            <div class="text-xs text-muted mb-0.5">MAÎTRISE</div>
            <div class="font-mono font-black text-xl text-muted">+{{ oldProfBonus }}</div>
          </div>
        </div>
        <!-- 6 caractéristiques -->
        <div class="grid grid-cols-6 gap-1">
          <div v-for="ab in ABILITIES" :key="ab" class="rounded-md bg-(--ui-bg) py-1 text-center">
            <div class="text-xs text-muted uppercase">{{ ABILITY_SHORT[ab] }}</div>
            <div class="font-mono text-sm font-black text-muted">{{ oldAbilities[ab] ?? 10 }}</div>
            <div class="text-xs font-mono text-muted/60">{{ formatMod(abilityMod(oldAbilities[ab] ?? 10)) }}</div>
          </div>
        </div>
      </div>

      <!-- Flèche -->
      <div class="flex items-center justify-center text-[28px] text-amber-400 px-1">→</div>

      <!-- APRÈS -->
      <div
        v-if="pickedClass"
        class="rounded-xl p-4"
        :style="{
          background: `${pickedClass.color}10`,
          border: `1px solid ${pickedClass.color}55`,
        }"
      >
        <div
          class="text-xs font-bold tracking-[0.18em] uppercase mb-3"
          :style="{ color: pickedClass.color }"
        >APRÈS</div>
        <!-- PV + Maîtrise -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="px-2 py-2 rounded-lg bg-(--ui-bg) text-center">
            <div class="text-xs text-muted mb-0.5">PV MAX</div>
            <div class="font-mono font-black text-xl text-(--ui-text)">{{ currentHpMax + (state.hpGained ?? 0) }}</div>
          </div>
          <div class="px-2 py-2 rounded-lg bg-(--ui-bg) text-center">
            <div class="text-xs text-muted mb-0.5">MAÎTRISE</div>
            <div class="font-mono font-black text-xl text-(--ui-text)">+{{ newProfBonus }}</div>
          </div>
        </div>
        <!-- 6 caractéristiques -->
        <div class="grid grid-cols-6 gap-1">
          <div v-for="ab in ABILITIES" :key="ab" class="rounded-md bg-(--ui-bg) py-1 text-center">
            <div class="text-xs text-muted uppercase">{{ ABILITY_SHORT[ab] }}</div>
            <div
              class="font-mono text-sm font-black"
              :class="(state.asiBonuses[ab] ?? 0) > 0 ? 'text-amber-400' : 'text-(--ui-text)'"
            >{{ newAbilities[ab] ?? 10 }}</div>
            <div
              class="text-xs font-mono"
              :class="abilityMod(newAbilities[ab] ?? 10) >= 0 ? 'text-amber-400' : 'text-red-400'"
              :style="(state.asiBonuses[ab] ?? 0) > 0 ? {} : { color: pickedClass?.color, opacity: 0.8 }"
            >{{ formatMod(abilityMod(newAbilities[ab] ?? 10)) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acquis ce niveau -->
    <div v-if="gains.length" class="mb-7">
      <div class="text-xs font-bold tracking-[0.15em] uppercase text-muted mb-3">✦ Acquis ce niveau</div>
      <div class="flex flex-col gap-2">
        <div
          v-for="g in gains"
          :key="g.label"
          class="flex items-center gap-3 px-4 py-3 rounded-xl"
          :style="{
            background: 'var(--ui-bg-elevated)',
            border: `1px solid ${pickedClass?.color ?? '#f59e0b'}40`,
            boxShadow: `0 0 14px ${pickedClass?.color ?? '#f59e0b'}10 inset`,
          }"
        >
          <span
            class="size-2 rounded-full shrink-0"
            :style="{
              background: pickedClass?.color ?? '#f59e0b',
              boxShadow: `0 0 10px ${pickedClass?.color ?? '#f59e0b'}`,
            }"
          />
          <span class="text-sm font-bold text-(--ui-text) flex-1">{{ g.label }}</span>
          <span v-if="g.detail" class="text-xs text-muted">{{ g.detail }}</span>
        </div>
      </div>
    </div>

    <p
      v-if="!online"
      class="text-center text-sm text-warning mb-2"
    >
      ⚠ La montée de niveau nécessite une connexion.
    </p>

    <!-- Boutons -->
    <div class="flex gap-3 justify-center">
      <button
        class="px-6 py-3 rounded-xl text-sm font-semibold text-muted border border-(--ui-border) hover:text-(--ui-text) transition-colors cursor-pointer"
        style="background: transparent"
        @click="$emit('back')"
      >
        ← Modifier
      </button>
      <button
        class="px-8 py-3 rounded-xl text-sm font-extrabold cursor-pointer transition-all"
        :class="submitting ? 'opacity-70 cursor-wait' : ''"
        :style="{
          background: submitting ? '#15803d' : '#f59e0b',
          color: '#18181b',
          border: 'none',
          boxShadow: submitting ? 'none' : '0 0 28px rgba(245,158,11,0.5)',
        }"
        :disabled="submitting || !online"
        @click="handleSubmit"
      >
        {{ submitting ? '✓ Niveau monté !' : '✦ Valider la montée de niveau' }}
      </button>
    </div>
  </div>
  </div>
</template>

<script lang="ts" setup>
import type { AbilityKey } from '~/data/character-builder'

defineEmits<{ back: [] }>()

const charSheet = inject('charSheet') as any
const router = useRouter()
const online = useOnline()

const {
  state,
  charClasses,
  totalLevel,
  pickedClass,
  finalAbilities,
  submit,
  ABILITIES,
  ABILITY_SHORT,
  profBonusAtLevel,
  abilityMod,
  formatMod,
  resetWizard,
  toast,
  CLASSES,
} = useLevelUp(charSheet)

const { getById: getFeatById } = useFeats()

const submitting = ref(false)

// Spell names shared from StepSpells via useState
const spellNamesById = useState<Record<number, string>>('level-up-spell-names', () => ({}))

// Invocation names (pour affichage du récap)
const { data: allInvocations } = useFetch<Array<{ id: number, name: string }>>('/api/invocations', {
  default: () => [],
})
const invocationNamesById = computed(() => {
  const map: Record<number, string> = {}
  for (const inv of allInvocations.value ?? []) map[inv.id] = inv.name
  return map
})

const currentHpMax = computed(() => charSheet?.value?.maxHp ?? 0)
const oldProfBonus = computed(() => profBonusAtLevel(totalLevel.value))
const newProfBonus = computed(() => profBonusAtLevel(totalLevel.value + 1))

// Abilities before (base + previous ASI, no new bonuses)
const oldAbilities = computed(() => finalAbilities.value)

// Abilities after (+ new ASI bonuses)
const newAbilities = computed<Record<AbilityKey, number>>(() => {
  const result = { ...finalAbilities.value }
  for (const ab of ABILITIES) {
    result[ab] = (result[ab] ?? 10) + (state.value.asiBonuses[ab] ?? 0)
  }
  return result
})

// Features unlocked at the new level (from class data)
const newFeatureNames = computed<string[]>(() => {
  if (!pickedClass.value) return []
  const lvl = state.value.toLevel
  const text = pickedClass.value.levelMilestones?.[lvl]
  return text ? text.split(/[,+]/).map((s: string) => s.trim()).filter(Boolean) : []
})

const gains = computed(() => {
  const list: Array<{ label: string, detail: string }> = []
  const cls = pickedClass.value
  const s = state.value

  // HP
  if (s.hpGained) {
    list.push({ label: `+${s.hpGained} PV`, detail: `max ${currentHpMax.value} → ${currentHpMax.value + s.hpGained}` })
  }

  // Proficiency bonus
  if (newProfBonus.value !== oldProfBonus.value) {
    list.push({ label: `Maîtrise +${newProfBonus.value}`, detail: `auparavant +${oldProfBonus.value}` })
  }

  // Subclass
  if (s.newSubclassName && cls) {
    list.push({ label: `${cls.subclassLabel} : ${s.newSubclassName}`, detail: 'choisie ce niveau' })
  }

  // Fighting style
  if (s.fightingStyle) {
    list.push({ label: `Style de combat : ${s.fightingStyle}`, detail: '' })
  }

  // ASI
  if (s.asiChoice === 'asi') {
    const bonuses = (Object.entries(s.asiBonuses) as Array<[AbilityKey, number]>)
      .filter(([, v]) => v > 0)
      .map(([ab, v]) => `${ABILITY_SHORT[ab]} +${v}`)
    if (bonuses.length) {
      list.push({ label: 'Amélioration de caractéristiques', detail: bonuses.join(' · ') })
    }
  }

  // Feat
  if (s.asiChoice === 'feat' && s.featureId) {
    const feat = getFeatById(s.featureId)
    list.push({ label: 'Don acquis', detail: feat?.name ?? `Don #${s.featureId}` })
  }

  // Class features
  for (const f of newFeatureNames.value) {
    list.push({ label: f, detail: 'capacité de classe' })
  }

  // Expertise
  if (s.expertiseSkills.length) {
    list.push({ label: 'Expertise', detail: s.expertiseSkills.join(', ') })
  }

  // New cantrips
  if (s.newCantripIds.length) {
    const names = s.newCantripIds.map(id => spellNamesById.value[id]).filter(Boolean).join(', ')
    list.push({ label: `${s.newCantripIds.length} nouveau(x) tour(s) de magie`, detail: names })
  }

  // New spells
  if (s.newSpellIds.length) {
    const names = s.newSpellIds.map(id => spellNamesById.value[id]).filter(Boolean).join(', ')
    list.push({ label: `${s.newSpellIds.length} nouveau(x) sort(s)`, detail: names })
  }

  // Pact Boon (Warlock niveau 3)
  if (s.pactBoon) {
    list.push({
      label: `Faveur du Pacte : ${({ chain: 'Chaîne', blade: 'Lame', tome: 'Tome' } as const)[s.pactBoon]}`,
      detail: '',
    })
  }

  // Invocations gagnées / remplacées
  if (s.newInvocationIds.length || s.replacedInvocationId) {
    const newNames = s.newInvocationIds.map(id => invocationNamesById.value[id]).filter(Boolean)
    const replacedName = s.replacedInvocationId ? invocationNamesById.value[s.replacedInvocationId] : null
    if (replacedName && newNames.length) {
      // Si remplacement actif, distinguer la dernière comme remplacement (par convention picker)
      const learned = newNames.slice(0, -1)
      const replacement = newNames[newNames.length - 1]
      if (learned.length) {
        list.push({ label: `${learned.length} nouvelle(s) manifestation(s)`, detail: learned.join(', ') })
      }
      list.push({ label: `Remplacement : ${replacedName} → ${replacement}`, detail: '' })
    } else if (newNames.length) {
      list.push({ label: `${newNames.length} nouvelle(s) manifestation(s)`, detail: newNames.join(', ') })
    }
  }

  // Multiclass skills
  if (s.newSkills.length) {
    list.push({ label: `${s.newSkills.length} compétence(s) multiclasse`, detail: '' })
  }

  // Hit die
  if (cls) {
    list.push({ label: `+1 dé de vie`, detail: `d${cls.hitDie}` })
  }

  return list
})

async function handleSubmit() {
  if (!online.value) {
    toast.add({ title: 'Montée de niveau indisponible hors-ligne', description: 'Reconnecte-toi pour valider.', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    await submit()
    toast.add({
      title: '▲ Niveau monté !',
      description: `${charSheet?.value?.name ?? 'Personnage'} est maintenant niveau ${totalLevel.value + 1}.`,
      color: 'success',
      duration: 4000,
    })
    resetWizard()
    await router.push(`/characters/${charSheet?.value?.id}`)
  } catch (e) {
    toast.add({ title: 'Erreur lors de la montée de niveau', color: 'error' })
    console.error('[level-up] submit error:', e)
    submitting.value = false
  }
}
</script>
