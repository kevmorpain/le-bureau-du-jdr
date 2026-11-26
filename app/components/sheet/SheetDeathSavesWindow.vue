<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.death_saves.title')"
  >
    <p class="hint">
      {{ $t('sheet.death_saves.intro', { name: characterSheet.name }) }}
    </p>

    <div class="saves">
      <DsDeathSaves
        v-model:successes="successes"
        v-model:failures="failures"
      />
    </div>

    <p
      class="status ds-number"
      :class="{ 'status--dead': isDead, 'status--stable': isStable }"
      role="status"
    >
      {{ status }}
    </p>

    <template v-if="!isDead && !isStable">
      <div
        v-if="isRolling"
        class="center"
      >
        <DsButton
          :label="$t('sheet.death_saves.roll')"
          detail="d20"
          @click="rollSave(roll)"
        />
      </div>
      <form
        v-else
        class="center"
        @submit.prevent="handleEnter"
      >
        <DsNumberField
          v-model="natural"
          :label="$t('sheet.death_saves.natural')"
          :min="1"
          :max="20"
          placeholder="d20"
        />
        <DsButton
          type="submit"
          :label="$t('sheet.death_saves.validate')"
          :disabled="!isNaturalValid"
        />
      </form>
    </template>

    <DsRibbon :label="$t('sheet.death_saves.reading')" />
    <dl class="legend">
      <template
        v-for="row in LEGEND"
        :key="row"
      >
        <dt class="ds-number">
          {{ $t(`sheet.death_saves.legend.${row}.value`) }}<small>{{ $t(`sheet.death_saves.legend.${row}.qualifier`) }}</small>
        </dt>
        <dd>{{ $t(`sheet.death_saves.legend.${row}.effect`) }}</dd>
      </template>
    </dl>
    <p class="hint">
      {{ $t('sheet.death_saves.rules') }}
    </p>

    <template #footer>
      <DsLinkButton
        v-if="rollsEnabled"
        class="mr-auto"
        :label="isManual ? $t('sheet.death_saves.use_app') : $t('sheet.death_saves.enter_manually')"
        @click="isManual = !isManual"
      />
      <DsButton
        variant="secondary"
        :label="$t('sheet.hit_points.modes.heal')"
        @click="emit('open-hit-points', 'heal')"
      />
      <DsButton
        variant="secondary"
        :label="$t('sheet.hit_points.modes.damage')"
        @click="emit('open-hit-points', 'damage')"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { useDeathSaves } from '~/composables/character/useDeathSaves'

const LEGEND = ['success', 'failure', 'twenty', 'one'] as const

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ 'open-hit-points': [mode: 'heal' | 'damage'] }>()

const { t } = useI18n()
const { successes, failures, isDead, isStable, lastOutcome, applyNatural, rollSave } = useDeathSaves(characterSheet)
const { roll, rollsEnabled } = useDiceRoller()

const isManual = ref(false)
const isRolling = computed(() => rollsEnabled.value && !isManual.value)
const natural = ref<number | null>(null)
const isNaturalValid = computed(() => Number.isInteger(natural.value) && natural.value! >= 1 && natural.value! <= 20)

watch(open, (isOpen) => {
  if (isOpen) lastOutcome.value = null
})

const status = computed(() => {
  if (isDead.value) return t('sheet.death_saves.status.dead')
  if (isStable.value) return t('sheet.death_saves.status.stable')
  if (!lastOutcome.value) return t('sheet.death_saves.status.waiting')
  return t(`sheet.death_saves.status.${lastOutcome.value.outcome}`, { natural: lastOutcome.value.natural })
})

const handleEnter = () => {
  if (!isNaturalValid.value) return
  applyNatural(natural.value!)
  natural.value = null
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.saves {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: var(--color-ds-panel-raised);
}

.status {
  font-size: 20px;
  text-align: center;
}

.status--dead { color: var(--color-ds-bad); }
.status--stable { color: var(--color-ds-gain); }

.center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.legend {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  align-items: baseline;
  font-size: 12.5px;
}

.legend dt {
  font-size: 18px;
  text-align: right;
}

.legend small {
  margin-left: 4px;
  font-family: var(--font-atkinson);
  font-size: 10.5px;
  color: var(--color-ds-mute);
}
</style>
