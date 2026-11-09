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
        <LightMarkdownInline :nodes="block.inline" />
      </p>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        class="pl-5 space-y-0.5"
        :class="block.ordered ? 'list-decimal' : 'list-disc'"
      >
        <li
          v-for="(item, j) in block.items"
          :key="j"
        >
          <LightMarkdownInline :nodes="item" />
        </li>
      </component>

      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default">
              <th
                v-for="(cell, j) in block.header"
                :key="j"
                class="px-2 py-1 text-left font-semibold"
              >
                <LightMarkdownInline :nodes="cell" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, j) in block.rows"
              :key="j"
              class="border-b border-muted last:border-0"
            >
              <td
                v-for="(cell, k) in row"
                :key="k"
                class="px-2 py-1 align-top"
              >
                <LightMarkdownInline :nodes="cell" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  source: string
}>()

const blocks = computed(() => parseMarkdown(props.source))
</script>
