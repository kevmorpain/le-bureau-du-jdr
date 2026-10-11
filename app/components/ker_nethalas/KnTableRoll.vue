<template>
  <li class="flex flex-wrap items-start gap-2">
    <UIcon
      :name="roll === undefined ? 'i-heroicons:minus-circle' : 'i-heroicons:check-circle'"
      class="mt-0.5 size-5 shrink-0"
      :class="roll === undefined ? 'text-muted' : 'text-success'"
    />

    <div class="min-w-0 flex-1">
      <p>
        {{ label }}
        <span
          v-if="roll !== undefined"
          class="text-muted"
        >
          · D{{ die }} → {{ roll }}
        </span>
        <span
          v-else-if="!active"
          class="text-muted"
        >
          · non tiré
        </span>
      </p>

      <template v-if="roll !== undefined">
        <template v-if="!plain">
          <p
            v-if="entry"
            class="text-sm"
          >
            <span
              v-if="entry.title"
              class="font-medium"
            >{{ entry.title }}. </span>{{ entry.text }}
          </p>
          <p
            v-else
            class="text-sm text-muted"
          >
            {{ table ? 'Résultat absent de la table chargée.' : 'Contenu de la table non chargé : notez le résultat du livre.' }}
          </p>
        </template>
        <slot name="result" />
      </template>
    </div>

    <div
      v-if="active && roll === undefined"
      class="flex flex-wrap items-center gap-1"
    >
      <UButton
        size="sm"
        variant="soft"
        @click="emit('roll')"
      >
        Tirer
      </UButton>
      <UInputNumber
        v-model="manual"
        :min="1"
        :max="die"
        :increment="false"
        :decrement="false"
        size="sm"
        :aria-label="`${label} : résultat saisi`"
        class="w-20"
      />
      <UButton
        size="sm"
        variant="outline"
        :disabled="manual === null || manual === undefined"
        :aria-label="`${label} : valider le résultat saisi`"
        @click="submit"
      >
        Saisir
      </UButton>
    </div>
  </li>
</template>

<script lang="ts" setup>
import { knTableEntry, type KnRollTable } from '~~/shared/ker-nethalas/tables'

const props = defineProps<{
  label: string
  die: number
  roll?: number
  table?: KnRollTable | null
  active?: boolean
  // Un jet qui n'a pas de table de texte : seul le résultat s'affiche, par la fente `result`.
  plain?: boolean
}>()

const emit = defineEmits<{
  roll: [manual?: number]
}>()

const manual = ref<number | null>(null)

const entry = computed(() => props.roll === undefined ? undefined : knTableEntry(props.table ?? null, props.roll))

function submit() {
  if (typeof manual.value === 'number') emit('roll', manual.value)
  manual.value = null
}
</script>
