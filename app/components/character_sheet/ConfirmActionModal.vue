<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <p class="font-semibold text-lg">
            {{ title }}
          </p>
        </template>

        <div class="space-y-3 text-sm">
          <slot />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="open = false"
            >
              Annuler
            </UButton>
            <UButton
              :color="confirmColor"
              :icon="confirmIcon"
              @click="confirm"
            >
              {{ confirmLabel }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  title: string
  confirmLabel: string
  confirmColor?: 'primary' | 'error' | 'warning'
  confirmIcon?: string
}>(), { confirmColor: 'primary', confirmIcon: undefined })

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { required: true })

const confirm = () => {
  open.value = false
  emit('confirm')
}
</script>
