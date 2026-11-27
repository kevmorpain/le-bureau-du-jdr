<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.inventory.purse')"
    :description="$t('sheet.purse.help')"
  >
    <template #modes>
      <DsSegmented
        v-model="mode"
        :options="modeOptions"
        :label="$t('sheet.purse.mode')"
      />
    </template>

    <p class="hint">
      {{ $t(`sheet.purse.hints.${mode}`) }}
    </p>
    <div class="coins">
      <label
        v-for="key in COIN_KEYS"
        :key="key"
        class="coin"
      >
        <span class="ds-label">{{ $t(`sheet.inventory.coins.${key}`) }}</span>
        <span class="coin__current">{{ $t('sheet.purse.current', { n: purse[key] }) }}</span>
        <DsNumberField
          v-model="amounts[key]"
          :label="$t(`sheet.purse.amount`, { coin: $t(`sheet.inventory.coins.${key}`) })"
          :min="0"
          :width="70"
          placeholder="0"
        />
      </label>
    </div>
    <p
      v-if="lastMove"
      class="result"
      role="status"
    >
      {{ lastMove }}
    </p>

    <template #footer="{ close }">
      <DsLinkButton
        :label="$t('sheet.purse.close')"
        @click="close"
      />
      <DsButton
        :label="$t(`sheet.purse.apply.${mode}`)"
        :disabled="!hasAmount"
        @click="handleApply"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { usePurse, type PurseMode } from '~/composables/character/usePurse'
import { COIN_KEYS, type CoinKey } from '~~/shared/rules/currency'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { purse, applyMove, setCoin } = usePurse(characterSheet)

type Mode = PurseMode | 'set'
const mode = ref<Mode>('gain')
const modeOptions = computed(() => (['gain', 'spend', 'set'] as const).map(value => ({ value, label: t(`sheet.purse.modes.${value}`) })))

const emptyAmounts = () => Object.fromEntries(COIN_KEYS.map(key => [key, null])) as Record<CoinKey, number | null>
const amounts = ref(emptyAmounts())
const lastMove = ref<string | null>(null)

const hasAmount = computed(() => COIN_KEYS.some(key => amounts.value[key] !== null && (mode.value === 'set' || amounts.value[key]! > 0)))

watch([open, mode], () => {
  amounts.value = emptyAmounts()
  lastMove.value = null
})

const coinLabel = (key: CoinKey) => t(`sheet.inventory.coins.${key}`)

const handleApply = () => {
  if (mode.value === 'set') {
    const changed = COIN_KEYS.filter(key => amounts.value[key] !== null)
    for (const key of changed) setCoin(key, amounts.value[key]!)
    lastMove.value = t('sheet.purse.result.set', { coins: changed.map(key => `${purse.value[key]} ${coinLabel(key)}`).join(', ') })
  } else {
    const sign = mode.value === 'spend' ? '−' : '+'
    const moves = applyMove(mode.value, Object.fromEntries(COIN_KEYS.map(key => [key, amounts.value[key] ?? 0])))
    lastMove.value = t('sheet.purse.result.moved', { coins: moves.map(({ key, amount }) => `${sign}${amount} ${coinLabel(key)}`).join(', ') })
  }
  amounts.value = emptyAmounts()
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.coins {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.coin {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.coin__current {
  font-size: 11px;
  color: var(--color-ds-mute);
}

.result {
  font-size: 13px;
  color: var(--color-ds-gold);
}
</style>
