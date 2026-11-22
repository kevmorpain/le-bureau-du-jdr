<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :close="false"
    :ui="{
      overlay: 'bg-black/70',
      content: `bg-transparent ring-0 shadow-none rounded-none divide-y-0 ${WIDTH[width]}`,
    }"
  >
    <template #content="{ close }">
      <DsWindowLayout
        :title="title"
        :closable="dismissible"
        @close="close"
      >
        <template
          v-if="$slots.modes"
          #modes
        >
          <slot name="modes" />
        </template>
        <slot :close="close" />
        <template
          v-if="$slots.footer"
          #footer
        >
          <slot
            name="footer"
            :close="close"
          />
        </template>
      </DsWindowLayout>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  title: string
  // Lu par les lecteurs d'écran seulement : le corps de la fenêtre dit le reste.
  description?: string
  dismissible?: boolean
  width?: 'md' | 'lg'
}>(), { description: undefined, dismissible: true, width: 'md' })

defineSlots<{
  default?: (props: { close: () => void }) => unknown
  modes?: () => unknown
  footer?: (props: { close: () => void }) => unknown
}>()

const open = defineModel<boolean>('open', { default: false })

const WIDTH = { md: 'max-w-lg', lg: 'max-w-2xl' }
</script>
