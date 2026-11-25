<template>
  <div class="rounded-xl border border-default bg-default p-3 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest text-muted">Points de vie</span>
      <span class="font-mono font-bold text-sm">
        {{ characterSheet.currentHp }}<span class="text-muted">/{{ fullMaxHp }}</span>
        <span
          v-if="characterSheet.temporaryHp > 0"
          class="text-blue-400 ml-1"
        >+{{ characterSheet.temporaryHp }}</span>
      </span>
    </div>

    <p
      v-if="isDead"
      class="text-xs font-bold text-red-400"
    >
      ☠ Mort
    </p>

    <div class="h-1.5 rounded-full bg-elevated overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :style="{ width: `${hpPercent}%`, background: hpColor }"
      />
    </div>

    <UTooltip
      v-if="effectiveMaxHp !== fullMaxHp"
      text="Épuisement niv. 4 : PV max ÷ 2"
    >
      <span class="text-xs text-rose-400 font-semibold">→ Max effectif : {{ effectiveMaxHp }}</span>
    </UTooltip>

    <Transition name="slide-in">
      <p
        v-if="flashResult"
        class="text-xs font-semibold"
        :class="flashResult.startsWith('+') ? 'text-green-400' : 'text-red-400'"
      >
        {{ flashResult }}
      </p>
    </Transition>

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

    <div
      v-if="mode"
      class="space-y-2"
    >
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
        <UCheckbox
          v-if="canDodge"
          v-model="dodged"
          label="Esquive instinctive (réaction) : dégâts ÷ 2"
          size="sm"
        />
        <UCheckbox
          v-if="isDying"
          v-model="isCritical"
          label="Coup critique (2 échecs aux jets contre la mort)"
          size="sm"
        />
      </template>

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

    <details class="text-xs">
      <summary class="text-muted cursor-pointer hover:text-default transition-colors">
        Édition directe
      </summary>
      <div class="flex items-center gap-1 mt-1.5">
        <div class="ring ring-inset ring-accented rounded-md focus-within:ring-2 focus-within:ring-primary">
          <UInputNumber
            v-model="characterSheet.currentHp"
            :min="0"
            :max="effectiveMaxHp"
            :increment="false"
            :decrement="false"
            variant="none"
            size="sm"
          />
          /
          <UInputNumber
            v-model="maxHpInput"
            :min="1"
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
          <strong class="text-default">{{ concentrationName }}</strong>.
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
            v-if="rollsEnabled"
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
import type { RollFn } from '~/composables/useDiceRoller'
import { useHitPointActions } from '~/composables/character/useHitPointActions'
import type { DamageTypeKey } from '~~/server/db/schema/effects'
import { damageTypeLabels } from '~~/shared/utils/labels'
import { hpBaseFromTotal } from '~~/shared/rules/hitPoints'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const props = defineProps<{
  roll?: RollFn
}>()

const {
  fullMaxHp, effectiveMaxHp, concentrationName, characterLevel, abilityModifiers, hpPerLevelBonus, isDying, isDead,
} = useCharacterSheet(characterSheet)
const { canDodge, defenseFor, damageOf, applyDamage, heal, gainTemporary, concentration } = useHitPointActions(characterSheet)

// On saisit le maximum affiché ; la fiche ne stocke que ce qui reste hors CON et hors bonus par niveau.
const maxHpInput = computed({
  get: () => fullMaxHp.value,
  set: (total: number | null | undefined) => {
    characterSheet.value.hpBase = Math.max(0, hpBaseFromTotal(total ?? 1, characterLevel.value, abilityModifiers.value.con ?? 0, hpPerLevelBonus.value))
  },
})

const hpPercent = computed(() => {
  const max = effectiveMaxHp.value || 1
  return Math.min(100, Math.max(0, (characterSheet.value.currentHp / max) * 100))
})

const hpColor = computed(() => {
  if (hpPercent.value > 50) return '#22c55e'
  if (hpPercent.value > 25) return '#f59e0b'
  return '#ef4444'
})

// Mode soin / dégâts
const mode = ref<'heal' | 'damage' | null>(null)
const amount = ref('')
const damageType = ref<DamageTypeKey | 'none'>('none')
const isTemporary = ref(false)
const isCritical = ref(false)
const dodged = ref(false)
const flashResult = ref<string | null>(null)
const inputRef = ref()

const toggleMode = (m: 'heal' | 'damage') => {
  mode.value = mode.value === m ? null : m
  amount.value = ''
  damageType.value = 'none'
  isTemporary.value = false
  isCritical.value = false
  dodged.value = false
  nextTick(() => inputRef.value?.input?.focus())
}

const damageTypeOptions = computed(() => [
  { label: 'Type non spécifié', value: 'none' },
  ...Object.entries(damageTypeLabels).map(([value, label]) => ({ label, value })),
])

const activeDefense = computed(() => defenseFor(damageType.value === 'none' ? null : damageType.value))

const resistanceLabel = computed(() => {
  const d = activeDefense.value
  if (!d) return null
  return { immunity: 'Immunité → 0 dégât', resistance: 'Résistance → dégâts ÷ 2', vulnerability: 'Vulnérabilité → dégâts × 2' }[d]
})

const resistanceColor = computed(() => {
  const d = activeDefense.value
  if (!d) return ''
  return { immunity: 'text-green-400', resistance: 'text-blue-400', vulnerability: 'text-red-400' }[d]
})

const showConcentrationCheck = computed({
  get: () => !!concentration.current.value,
  set: (open: boolean) => {
    if (!open && concentration.current.value) concentration.dismiss()
  },
})
const concentrationDamage = computed(() => concentration.current.value?.damage ?? 0)
const concentrationDC = computed(() => concentration.current.value?.dc ?? 10)
const conSaveMod = concentration.saveModifier
const rollsEnabled = useRollsEnabled()

const rollConcentrationSave = () => {
  if (props.roll) concentration.rollSave(props.roll)
}
const concentrationSuccess = () => concentration.succeed()
const concentrationFail = () => concentration.fail()

const commit = () => {
  const raw = parseInt(amount.value) || 0
  if (!raw) {
    mode.value = null
    return
  }

  if (mode.value === 'heal') {
    if (isTemporary.value) {
      gainTemporary(raw)
      showFlash(`+${raw} PV temp`)
    } else {
      heal(raw)
      showFlash(`+${raw} PV`)
    }
  } else if (mode.value === 'damage') {
    const source = { lines: [{ amount: raw, type: damageType.value === 'none' ? null : damageType.value }], dodged: dodged.value }
    const final = damageOf(source)
    applyDamage([source], { critical: isCritical.value })
    const d = activeDefense.value
    const defenseSuffix = d === 'immunity' ? ' (immunité)' : d === 'resistance' ? ' (résistance)' : d === 'vulnerability' ? ' (vulnérabilité)' : ''
    showFlash(`−${final} PV${dodged.value ? ' (esquive)' : ''}${defenseSuffix}`)
  }

  amount.value = ''
  mode.value = null
  damageType.value = 'none'
  isCritical.value = false
  dodged.value = false
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
