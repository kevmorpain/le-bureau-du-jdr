<template>
  <DsModal
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #default>
      <div class="flex flex-col gap-1.5 bg-ds-panel-raised px-3 py-2.5 text-[13px] leading-normal">
        <slot>{{ description }}</slot>
      </div>
    </template>
    <template #footer="{ close }">
      <DsLinkButton
        :label="cancelLabel"
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
// Toute action destructive passe par ici : le corps rappelle ce qui sera perdu.
withDefaults(defineProps<{
  title: string
  confirmLabel: string
  description?: string
  cancelLabel?: string
}>(), { description: undefined, cancelLabel: 'Annuler' })

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })

const confirm = (close: () => void) => {
  emit('confirm')
  close()
}
</script>
