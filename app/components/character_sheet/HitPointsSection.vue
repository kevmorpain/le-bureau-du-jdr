<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">Points de vie</span>
      <span class="font-mono font-bold text-sm">
        {{ characterSheet.currentHp }}<span class="text-muted">/{{ characterSheet.maxHp }}</span>
        <span
          v-if="characterSheet.temporaryHp > 0"
          class="text-blue-400 ml-1"
        >+{{ characterSheet.temporaryHp }}</span>
      </span>
    </div>

    <!-- Barre HP -->
    <div class="h-1.5 rounded-full bg-elevated overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :style="{ width: `${hpPercent}%`, background: hpColor }"
      />
    </div>

    <!-- Avertissement PV max réduit -->
    <UTooltip
      v-if="effectiveMaxHp !== characterSheet.maxHp"
      text="Épuisement niv. 4 : PV max ÷ 2"
    >
      <span class="text-xs text-rose-400 font-semibold">→ Max effectif : {{ effectiveMaxHp }}</span>
    </UTooltip>

    <!-- Flash résultat -->
    <Transition name="slide-in">
      <p
        v-if="flashResult"
        class="text-xs font-semibold"
        :class="flashResult.startsWith('+') ? 'text-green-400' : 'text-red-400'"
      >
        {{ flashResult }}
      </p>
    </Transition>

    <!-- Boutons Soins / Dégâts -->
    <div class="flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm border transition-colors"
        :class="mode === 'heal'
          ? 'bg-green-500/15 border-green-500/40 text-green-400'
          : 'bg-green-500/8 border-green-500/25 text-green-500 hover:bg-green-500/15'"
        @click="toggleMode('heal')"
      >
        <UIcon
          name="i-game-icons:heart-plus"
          class="size-4"
        />
        Soins
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm border transition-colors"
        :class="mode === 'damage'
          ? 'bg-red-500/15 border-red-500/40 text-red-400'
          : 'bg-red-500/8 border-red-500/25 text-red-500 hover:bg-red-500/15'"
        @click="toggleMode('damage')"
      >
        <UIcon
          name="i-game-icons:heart-minus"
          class="size-4"
        />
        Dégâts
      </button>
    </div>

    <!-- Formulaire de saisie -->
    <div
      v-if="mode"
      class="space-y-2"
    >
      <!-- Sélecteur type de dégâts (mode dégâts seulement) -->
      <template v-if="mode === 'damage'">
        <USelect
          v-model="damageType"
          :items="damageTypeOptions"
          size="sm"
        />
        <p
          v-if="resistanceLabel"
          class="text-xs font-semibold"
          :class="resistanceColor"
        >
          {{ resistanceLabel }}
        </p>
      </template>

      <!-- Saisie PV temporaires (mode soins) -->
      <div
        v-if="mode === 'heal'"
        class="flex items-center gap-1 text-xs text-muted"
      >
        <UCheckbox
          v-model="isTemporary"
          label="PV temporaires"
          size="sm"
        />
      </div>

      <div class="flex gap-2">
        <UInput
          ref="inputRef"
          v-model="amount"
          type="number"
          min="0"
          :placeholder="mode === 'heal' ? 'PV récupérés' : 'Dégâts bruts'"
          class="flex-1 font-mono text-center"
          size="sm"
          @keydown.enter="commit"
        />
        <UButton
          size="sm"
          :color="mode === 'heal' ? 'success' : 'error'"
          @click="commit"
        >
          OK
        </UButton>
      </div>
    </div>

    <!-- Édition directe -->
    <details class="text-xs">
      <summary class="text-muted cursor-pointer hover:text-default transition-colors">
        Édition directe
      </summary>
      <div class="flex items-center gap-1 mt-1.5">
        <div class="ring ring-inset ring-accented rounded-md focus-within:ring-2 focus-within:ring-primary">
          <UInputNumber
            v-model="characterSheet.currentHp"
            :min="0"
            :max="characterSheet.maxHp"
            :increment="false"
            :decrement="false"
            variant="none"
            size="sm"
          />
          /
          <UInputNumber
            v-model="characterSheet.maxHp"
            :min="0"
            :increment="false"
            :decrement="false"
            variant="none"
            size="sm"
          />
        </div>
        <span class="text-muted">+</span>
        <UInputNumber
          v-model="characterSheet.temporaryHp"
          :min="0"
          :increment="false"
          :decrement="false"
          size="sm"
          class="w-16"
        />
        <span class="text-muted">temp</span>
      </div>
    </details>
  </div>

  <!-- Modal vérification de concentration -->
  <UModal v-model:open="showConcentrationCheck">
    <template #content>
      <div class="p-5 space-y-4">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-game-icons:magic-swirl"
            class="size-5 text-amber-400"
          />
          <h3 class="font-bold">
            Vérification de concentration
          </h3>
        </div>
        <p class="text-sm text-muted">
          Vous maintenez la concentration sur
          <strong class="text-default">{{ concentrationSpellName || 'un sort' }}</strong>.
          Les dégâts reçus ({{ concentrationDamage }}) nécessitent un jet de sauvegarde.
        </p>
        <div class="bg-elevated rounded-lg p-3 text-sm space-y-1">
          <p class="font-semibold">
            DD de Constitution : <span class="text-primary">{{ concentrationDC }}</span>
          </p>
          <p class="text-muted">
            JS CON = {{ formatModifier(conSaveMod) }} — réussite sur ≥ {{ concentrationDC }}
          </p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <UButton
            color="primary"
            @click="rollConcentrationSave"
          >
            Lancer le jet ({{ formatModifier(conSaveMod) }})
          </UButton>
          <UButton
            color="success"
            variant="outline"
            @click="concentrationSuccess"
          >
            Réussi ✓
          </UButton>
          <UButton
            color="error"
            variant="outline"
            @click="concentrationFail"
          >
            Raté ✗ — perdre la concentration
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { damageTypeLabels } from '~~/shared/utils/labels'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const props = defineProps<{
  roll?: (label: string, modifier: number, sides?: number, count?: number) => number
}>()

const { effectiveMaxHp, defenseEntries, activeConditions, toggleCondition, savingThrows } = useCharacterSheet(characterSheet)

// ── HP bar ───────────────────────────────────────────────────────────────────
const hpPercent = computed(() => {
  const max = effectiveMaxHp.value || 1
  return Math.min(100, Math.max(0, (characterSheet.value.currentHp / max) * 100))
})

const hpColor = computed(() => {
  if (hpPercent.value > 50) return '#22c55e'
  if (hpPercent.value > 25) return '#f59e0b'
  return '#ef4444'
})

// ── Mode soin / dégâts ───────────────────────────────────────────────────────
const mode = ref<'heal' | 'damage' | null>(null)
const amount = ref('')
const damageType = ref('none')
const isTemporary = ref(false)
const flashResult = ref<string | null>(null)
const inputRef = ref()

const toggleMode = (m: 'heal' | 'damage') => {
  mode.value = mode.value === m ? null : m
  amount.value = ''
  damageType.value = 'none'
  isTemporary.value = false
  nextTick(() => inputRef.value?.input?.focus())
}

// ── Types de dégâts ──────────────────────────────────────────────────────────
const damageTypeOptions = computed(() => [
  { label: 'Type non spécifié', value: 'none' },
  ...Object.entries(damageTypeLabels)
    .filter(([key]) => key !== 'draconic_ancestry')
    .map(([value, label]) => ({ label, value })),
])

const activeDefense = computed(() => {
  if (damageType.value === 'none') return null
  return defenseEntries.value.find(e => e.key === `dmg:${damageType.value}`)
    ?? defenseEntries.value.find(e => e.key === 'dmg:all')
    ?? null
})

const resistanceLabel = computed(() => {
  const d = activeDefense.value
  if (!d) return null
  return { immunity: 'Immunité → 0 dégât', resistance: 'Résistance → dégâts ÷ 2', vulnerability: 'Vulnérabilité → dégâts × 2' }[d.level] ?? null
})

const resistanceColor = computed(() => {
  const d = activeDefense.value
  if (!d) return ''
  return { immunity: 'text-green-400', resistance: 'text-blue-400', vulnerability: 'text-red-400' }[d.level] ?? ''
})

// ── Sauvegarde de concentration ───────────────────────────────────────────────
const showConcentrationCheck = ref(false)
const concentrationDamage = ref(0)
const concentrationDC = ref(10)

const concentrationSpellName = computed(() => {
  try {
    return localStorage.getItem('cs-concentration-spell') ?? ''
  } catch {
    return ''
  }
})

const conSaveMod = computed(() => savingThrows.value.con?.modifier ?? 0)

const rollConcentrationSave = () => {
  const result = props.roll?.(`JS Constitution — Concentration (DD ${concentrationDC.value})`, conSaveMod.value) ?? 0
  if (result >= concentrationDC.value) concentrationSuccess()
  else concentrationFail()
}

const concentrationSuccess = () => {
  showConcentrationCheck.value = false
  useToast().add({ title: 'Concentration maintenue', color: 'success' })
}

const concentrationFail = () => {
  toggleCondition('concentrating' as never)
  showConcentrationCheck.value = false
  const spellName = concentrationSpellName.value
  useToast().add({
    title: 'Concentration perdue',
    description: spellName ? `Vous n'êtes plus concentré sur ${spellName}.` : undefined,
    color: 'error',
  })
  try {
    localStorage.removeItem('cs-concentration-spell')
  } catch { /* localStorage non disponible */ }
}

// ── Commit action soins / dégâts ─────────────────────────────────────────────
const commit = () => {
  const raw = parseInt(amount.value) || 0
  if (!raw) {
    mode.value = null
    return
  }

  if (mode.value === 'heal') {
    if (isTemporary.value) {
      characterSheet.value.temporaryHp = Math.max(characterSheet.value.temporaryHp, raw)
      showFlash(`+${raw} PV temp`)
    } else {
      characterSheet.value.currentHp = Math.min(effectiveMaxHp.value, characterSheet.value.currentHp + raw)
      showFlash(`+${raw} PV`)
    }
  } else if (mode.value === 'damage') {
    let final = raw
    const d = activeDefense.value
    if (d?.level === 'immunity') final = 0
    else if (d?.level === 'resistance') final = Math.floor(raw / 2)
    else if (d?.level === 'vulnerability') final = raw * 2

    // Absorb temporary HP first
    const absorbedByTemp = Math.min(characterSheet.value.temporaryHp, final)
    characterSheet.value.temporaryHp -= absorbedByTemp
    characterSheet.value.currentHp = Math.max(0, characterSheet.value.currentHp - (final - absorbedByTemp))

    const suffix = d?.level === 'immunity' ? ' (immunité)' : d?.level === 'resistance' ? ' (résistance)' : d?.level === 'vulnerability' ? ' (vulnérabilité)' : ''
    showFlash(`−${final} PV${suffix}`)

    // Vérification concentration si concentré
    if (activeConditions.value.includes('concentrating' as never) && final > 0) {
      concentrationDamage.value = final
      concentrationDC.value = Math.max(10, Math.floor(final / 2))
      showConcentrationCheck.value = true
    }
  }

  amount.value = ''
  mode.value = null
  damageType.value = 'none'
}

const showFlash = (msg: string) => {
  flashResult.value = msg
  setTimeout(() => {
    flashResult.value = null
  }, 3000)
}
</script>

<style scoped>
.slide-in-enter-active {
  transition: all 0.2s ease;
}
.slide-in-enter-from {
  transform: translateX(8px);
  opacity: 0;
}
</style>
