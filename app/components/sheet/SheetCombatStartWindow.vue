<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.combat.start_title')"
  >
    <div class="initiative">
      <span class="ds-label">{{ $t('sheet.combat.initiative_formula', { modifier: formatModifier(initiativeBonus) }) }}</span>
      <template v-if="isRolling">
        <span
          class="ds-number initiative__total"
          role="status"
        >{{ rolled?.total ?? '—' }}</span>
        <span
          v-if="rolled"
          class="hint"
        >{{ $t('sheet.combat.roll_detail', { natural: rolled.natural, modifier: formatModifier(rolled.total - rolled.natural) }) }}</span>
      </template>
      <span
        v-else
        class="initiative__manual"
      >
        <DsNumberField
          v-model="natural"
          :label="$t('sheet.combat.natural')"
          :min="1"
          :max="20"
          :width="120"
          placeholder="d20"
        />
        <span class="hint">{{ $t('sheet.combat.manual_total', { modifier: formatModifier(initiativeBonus), total: manualRecord?.total ?? '—' }) }}</span>
      </span>
      <DsLinkButton
        v-if="rollsEnabled"
        :label="isManual ? $t('sheet.combat.use_app') : $t('sheet.combat.enter_manually')"
        @click="handleToggleManual"
      />
    </div>

    <DsGroupTitle :label="$t('sheet.combat.at_start')" />
    <ul class="rules">
      <li>{{ $t('sheet.combat.rule_round') }}</li>
      <li>{{ $t('sheet.combat.rule_reset') }}</li>
    </ul>

    <template #footer>
      <DsLinkButton
        :label="$t('sheet.combat.cancel')"
        @click="open = false"
      />
      <DsButton
        :label="$t('sheet.combat.start')"
        :disabled="!record"
        @click="handleStart"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { useCombatTurn } from '~/composables/character/useCombatTurn'
import type { InitiativeRecord } from '~/composables/character/useCombatTracker'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })

const { initiativeBonus } = useCharacterSheet(characterSheet)
const { initiative, rollInitiative, startCombat } = useCombatTurn(characterSheet)
const { rollsEnabled } = useDiceRoller()

const isManual = ref(false)
const isRolling = computed(() => rollsEnabled.value && !isManual.value)
const rolled = ref<InitiativeRecord | null>(null)
const natural = ref<number | null>(null)

const manualRecord = computed<InitiativeRecord | null>(() =>
  Number.isInteger(natural.value) && natural.value! >= 1 && natural.value! <= 20
    ? { natural: natural.value!, total: natural.value! + initiativeBonus.value }
    : null)
const record = computed(() => (isRolling.value ? rolled.value : manualRecord.value))

// Rolling writes the sheet's initiative right away: a cancelled start puts the previous one back.
let previous: InitiativeRecord | null = null
let isStarted = false

const handleOpen = () => {
  previous = initiative.value
  isStarted = false
  isManual.value = false
  natural.value = null
  rolled.value = rollsEnabled.value ? rollInitiative() : null
}

watch(open, (isOpen) => {
  if (isOpen) handleOpen()
  else if (!isStarted && rolled.value) initiative.value = previous
})

// The stored initiative is only read once mounted: a window mounted open snapshots it then.
onMounted(() => {
  if (open.value) handleOpen()
})

const handleToggleManual = () => {
  isManual.value = !isManual.value
  if (!isManual.value) rolled.value = rollInitiative()
}

const handleStart = () => {
  if (!record.value) return
  isStarted = true
  startCombat(record.value)
  open.value = false
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.initiative {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: var(--color-ds-panel-raised);
}

.initiative__total { font-size: 44px; }

.initiative__manual {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rules {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 16px;
  font-size: 12.5px;
  list-style: disc;
}

.rules li::marker { color: var(--color-ds-gold); }
</style>
