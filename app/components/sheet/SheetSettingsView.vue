<template>
  <div class="settings">
    <DsBlock :ribbon="$t('sheet.settings.appearance')">
      <div class="setting">
        <p class="setting__label">
          {{ $t('sheet.settings.design') }}
        </p>
        <DsSegmented
          :model-value="newSheet ? 'new' : 'old'"
          :options="designOptions"
          :label="$t('sheet.settings.design')"
          @update:model-value="value => emit('chooseDesign', value === 'new')"
        />
        <p class="setting__help">
          {{ $t('sheet.settings.design_help') }}
        </p>
      </div>
    </DsBlock>
  </div>
</template>

<script lang="ts" setup>
const { newSheet } = defineProps<{ newSheet: boolean }>()

const emit = defineEmits<{ chooseDesign: [newSheet: boolean] }>()

const { t } = useI18n()

const designOptions = computed(() => [
  { value: 'new' as const, label: t('sheet.settings.design_new') },
  { value: 'old' as const, label: t('sheet.settings.design_old') },
])
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 560px;
}

.setting {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px 16px;
}

.setting__label {
  font-weight: 700;
  color: var(--color-ds-ink);
}

.setting__help {
  grid-column: 1 / -1;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-ds-mute);
}
</style>
