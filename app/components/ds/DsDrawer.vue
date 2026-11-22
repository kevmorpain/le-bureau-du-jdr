<template>
  <USlideover
    v-model:open="open"
    side="right"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :close="false"
    :ui="{
      overlay: 'bg-black/70',
      content: 'bg-transparent ring-0 sm:ring-0 shadow-none sm:shadow-none divide-y-0 max-w-lg w-full p-2',
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
  </USlideover>
</template>

<script lang="ts" setup>
const { title, description, dismissible = true } = defineProps<{
  title: string
  description?: string
  dismissible?: boolean
}>()

defineSlots<{
  default?: (props: { close: () => void }) => unknown
  modes?: () => unknown
  footer?: (props: { close: () => void }) => unknown
}>()

const open = defineModel<boolean>('open', { default: false })
</script>
