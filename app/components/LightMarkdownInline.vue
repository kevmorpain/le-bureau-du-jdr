<template>
  <span
    v-for="(node, i) in nodes"
    :key="i"
    :class="{ 'font-semibold': node.bold, 'italic': node.italic }"
  >{{ node.text }}</span>
</template>

<script lang="ts" setup>
import type { InlineNode } from '~/utils/lightMarkdown'

defineProps<{
  nodes: InlineNode[]
}>()
</script>
