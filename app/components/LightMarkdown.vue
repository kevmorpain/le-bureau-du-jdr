<template>
  <div class="space-y-2">
    <template
      v-for="(block, i) in blocks"
      :key="i"
    >
      <p
        v-if="block.type === 'paragraph'"
        class="whitespace-pre-line"
      >
        <span
          v-for="(node, j) in block.inline"
          :key="j"
          :class="{ 'font-semibold': node.bold, 'italic': node.italic }"
        >{{ node.text }}</span>
      </p>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else
        class="pl-5 space-y-0.5"
        :class="block.ordered ? 'list-decimal' : 'list-disc'"
      >
        <li
          v-for="(item, j) in block.items"
          :key="j"
        >
          <span
            v-for="(node, k) in item"
            :key="k"
            :class="{ 'font-semibold': node.bold, 'italic': node.italic }"
          >{{ node.text }}</span>
        </li>
      </component>
    </template>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  source: string
}>()

const blocks = computed(() => parseMarkdown(props.source))
</script>
