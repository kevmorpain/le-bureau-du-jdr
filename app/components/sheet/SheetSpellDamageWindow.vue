<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.spell_damage.title', { spell: spell.name })"
  >
    <p class="hint">
      {{ $t('sheet.spell_damage.intro') }}
    </p>
    <div
      class="levels"
      role="group"
      :aria-label="$t('sheet.spell_damage.level_label')"
    >
      <DsCard
        v-for="level in levels"
        :key="level"
        as="button"
        :selected="level === selected"
        class="level"
        @click="selected = level"
      >
        <span class="level__name">{{ $t('sheet.spell_damage.level', { level }) }}</span>
        <span class="level__dice ds-number">{{ previewAt(spell, level) }}</span>
      </DsCard>
    </div>
    <DsCheckbox
      v-model="pending.crit"
      :label="$t('sheet.spell_damage.critical')"
    />
    <p class="hint">
      {{ $t('sheet.spell_damage.note') }}
    </p>

    <template #footer="{ close }">
      <DsLinkButton
        :label="$t('ds.cancel')"
        @click="close"
      />
      <DsButton
        :label="$t('sheet.spell_damage.roll')"
        @click="handleRoll(close)"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import { baseSlotLevel, damageRollLevels } from '~~/shared/rules/spellScaling'

const open = defineModel<boolean>('open', { default: false })
const { spell, ownedLevels, castLevel } = defineProps<{
  spell: Spell
  ownedLevels: number[]
  castLevel?: number
}>()
const emit = defineEmits<{ roll: [slotLevel: number] }>()

const { previewAt } = useSpellEffectPreview()
const { engine } = useDiceRoller()
const pending = engine.pending

const levels = computed(() => damageRollLevels(spell, ownedLevels, castLevel))
const selected = ref(castLevel ?? baseSlotLevel(spell))

watch(open, (isOpen) => {
  if (isOpen) selected.value = castLevel ?? baseSlotLevel(spell)
})

const handleRoll = (close: () => void) => {
  emit('roll', selected.value)
  close()
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.levels {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}

.level :deep(.card__fill) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.level__name { font-size: 12.5px; }
.level__dice { font-size: 16px; }
</style>
