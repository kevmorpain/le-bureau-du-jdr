<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Compétences et résistances
      </h2>
      <p class="text-sm text-muted">
        Le score de base est modifiable ; le score effectif s'affiche à droite. Case cochée : compétence marquée pour amélioration.
      </p>
    </template>

    <h3 class="mb-3 text-sm font-medium text-muted">
      Compétences
    </h3>

    <div class="grid gap-x-8 gap-y-3 md:grid-cols-2">
      <div
        v-for="key in KN_SKILL_KEYS"
        :key
        class="flex items-center gap-3"
      >
        <UCheckbox
          v-model="character.skills[key].marked"
          :aria-label="`${$t(`ker_nethalas.skills.${key}`)} : à améliorer`"
        />
        <span class="flex-1 min-w-0">{{ $t(`ker_nethalas.skills.${key}`) }}</span>
        <KnNumberField
          v-model="character.skills[key].score"
          :aria-label="$t(`ker_nethalas.skills.${key}`)"
          :min="KN_BOUNDS.skill.min"
          :max="KN_BOUNDS.skill.max"
          class="w-24"
        />
        <div class="w-24">
          <KnEffectiveScore
            :check="resolved.skills[key]"
            :name="$t(`ker_nethalas.skills.${key}`)"
          />
        </div>
        <UButton
          size="xs"
          variant="soft"
          :aria-label="`Jet : ${$t(`ker_nethalas.skills.${key}`)}`"
          @click="emit('roll', `skill:${key}`)"
        >
          Jet
        </UButton>
      </div>
    </div>

    <div
      v-for="(extra, index) in character.extraSkills"
      :key="index"
      class="mt-3 flex items-center gap-3"
    >
      <UCheckbox
        v-model="extra.marked"
        :aria-label="`${extra.name} : à améliorer`"
      />
      <UInput
        :model-value="extra.name"
        :maxlength="50"
        class="flex-1"
        @update:model-value="renameExtra(index, $event)"
      />
      <KnNumberField
        v-model="extra.score"
        :aria-label="`${extra.name} : score`"
        :min="KN_BOUNDS.skill.min"
        :max="KN_BOUNDS.skill.max"
        class="w-24"
      />
      <div class="w-24">
        <KnEffectiveScore
          :check="resolved.extraSkills[index]!"
          :name="extra.name"
        />
      </div>
      <UButton
        size="xs"
        variant="soft"
        :aria-label="`Jet : ${extra.name}`"
        @click="emit('roll', `extra:${index}`)"
      >
        Jet
      </UButton>
      <UButton
        icon="i-heroicons:trash"
        color="error"
        variant="ghost"
        size="sm"
        :aria-label="`Retirer ${extra.name}`"
        @click="character.extraSkills.splice(index, 1)"
      />
    </div>

    <UButton
      icon="i-heroicons:plus"
      variant="soft"
      size="sm"
      class="mt-4"
      :disabled="character.extraSkills.length >= KN_BOUNDS.extraSkills"
      @click="addExtra"
    >
      Ajouter une compétence
    </UButton>

    <hr class="my-6 border-default">

    <h3 class="mb-3 text-sm font-medium text-muted">
      Résistances
      <span class="font-normal">(plafonnées à {{ KN_BOUNDS.resistance.max }}, quel que soit l'équipement)</span>
    </h3>

    <div class="grid gap-x-8 gap-y-3 md:grid-cols-2">
      <div
        v-for="key in KN_RESISTANCE_KEYS"
        :key
        class="flex items-center gap-3"
      >
        <span
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        <span class="flex-1 min-w-0">{{ $t(`ker_nethalas.resistances.${key}`) }}</span>
        <KnNumberField
          v-model="character.resistances[key]"
          :aria-label="$t(`ker_nethalas.resistances.${key}`)"
          :min="KN_BOUNDS.resistance.min"
          :max="KN_BOUNDS.resistance.max"
          class="w-24"
        />
        <div class="w-24">
          <KnEffectiveScore
            :check="resolved.resistances[key]"
            :name="$t(`ker_nethalas.resistances.${key}`)"
          />
        </div>
        <UButton
          size="xs"
          variant="soft"
          :aria-label="`Jet : ${$t(`ker_nethalas.resistances.${key}`)}`"
          @click="emit('roll', `resistance:${key}`)"
        >
          Jet
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from '~~/shared/ker-nethalas/skills'

defineProps<{
  resolved: KnResolvedSheet
}>()

const emit = defineEmits<{
  roll: [selection: string]
}>()

const character = defineModel<KnCharacter>('character', { required: true })

function addExtra() {
  character.value.extraSkills.push({ name: 'Nouvelle compétence', score: 0, marked: false })
}

// Un nom vidé en cours de frappe n'est pas écrit : le schéma le refuserait et l'auto-save échouerait.
function renameExtra(index: number, value: string | number | null | undefined) {
  if (typeof value === 'string' && value.trim() !== '') character.value.extraSkills[index]!.name = value
}
</script>
