<template>
  <DsModal
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #default>
      <div class="confirm__body">
        <slot>{{ description }}</slot>
      </div>
    </template>
    <template #footer="{ close }">
      <DsLinkButton
        :label="cancelLabel ?? $t('ds.cancel')"
        @click="close"
      />
      <DsButton
        variant="danger"
        :label="confirmLabel"
        @click="confirm(close)"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
const { title, confirmLabel, description, cancelLabel } = defineProps<{
  title: string
  confirmLabel: string
  description?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })

const confirm = (close: () => void) => {
  emit('confirm')
  close()
}
</script>

<style scoped>
.confirm__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--color-ds-panel-raised);
  font-size: 13px;
  line-height: 1.5;
}
</style>
