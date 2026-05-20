<template>
  <div
    v-if="classData"
    class="relative overflow-hidden rounded-xl mb-5 px-5 py-4"
    :style="{
      background: `linear-gradient(135deg, ${classData.color}28 0%, var(--ui-bg-elevated) 65%)`,
      border: `1px solid ${classData.color}55`,
      boxShadow: `0 0 28px ${classData.color}22 inset`,
    }"
  >
    <!-- Emoji background watermark -->
    <div
      class="absolute top-0 right-0 text-[120px] leading-none opacity-[0.06] pointer-events-none select-none"
      style="transform: translate(15px, -20px)"
    >
      {{ classData.emoji }}
    </div>

    <div class="relative flex items-center gap-4">
      <!-- Class icon -->
      <div
        class="size-14 rounded-xl shrink-0 flex items-center justify-center text-3xl"
        :style="{
          background: `${classData.color}22`,
          border: `1.5px solid ${classData.color}66`,
          boxShadow: `0 0 16px ${classData.color}44`,
        }"
      >
        {{ classData.emoji }}
      </div>

      <div class="flex-1 min-w-0">
        <div
          class="text-[11px] font-bold tracking-[0.18em] uppercase mb-1"
          :style="{ color: classData.color }"
        >
          {{ isMulticlass ? '✦ Multi-classage' : '▲ Niveau supérieur' }}
        </div>
        <div class="text-xl font-extrabold text-(--ui-text)">
          {{ classData.name }}
          <span
            class="ml-2 font-mono text-sm"
            :style="{ color: classData.color }"
          >
            niv. {{ fromLevel }} → <span class="text-[22px]">{{ toLevel }}</span>
          </span>
        </div>
        <div v-if="subtitle" class="text-xs text-muted mt-1">{{ subtitle }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ClassData } from '~/data/character-builder'

defineProps<{
  classData: ClassData | null
  fromLevel: number
  toLevel: number
  isMulticlass?: boolean
  subtitle?: string
}>()
</script>
