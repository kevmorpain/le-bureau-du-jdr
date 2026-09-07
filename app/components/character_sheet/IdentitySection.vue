<template>
  <div class="space-y-4">
    <div class="flex items-start gap-4">
      <!-- Portrait -->
      <img
        v-if="portraitSrc"
        :src="portraitSrc"
        :alt="`Portrait de ${name}`"
        class="size-20 rounded-lg object-cover border border-default shrink-0"
        @error="portraitFailed = true"
      >
      <div
        v-else
        class="size-20 rounded-lg border border-dashed border-default flex items-center justify-center shrink-0 text-muted"
      >
        <UIcon
          name="i-heroicons:user-circle"
          class="size-8"
        />
      </div>

      <div class="flex-1 min-w-0 space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h2 class="font-semibold truncate">
              {{ name || 'Personnage sans nom' }}
            </h2>
            <p
              v-if="playerName"
              class="text-xs text-muted"
            >
              Joueur : {{ playerName }}
            </p>
          </div>
          <EditIdentitySlideover v-model:character-sheet="characterSheet" />
        </div>

        <!-- Apparence physique -->
        <dl
          v-if="appearanceFields.length"
          class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2"
        >
          <div
            v-for="field in appearanceFields"
            :key="field.key"
          >
            <dt class="text-xs text-muted uppercase tracking-wide">
              {{ field.label }}
            </dt>
            <dd class="text-sm">
              {{ field.value }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Histoire & alliés -->
    <div
      v-if="backstory"
      class="space-y-1"
    >
      <h3 class="text-xs font-bold uppercase tracking-widest text-muted">
        Histoire
      </h3>
      <p class="text-sm whitespace-pre-line leading-relaxed">
        {{ backstory }}
      </p>
    </div>

    <div
      v-if="allies"
      class="space-y-1"
    >
      <h3 class="text-xs font-bold uppercase tracking-widest text-muted">
        Alliés & organisations
      </h3>
      <p class="text-sm whitespace-pre-line leading-relaxed">
        {{ allies }}
      </p>
    </div>

    <p
      v-if="isEmpty"
      class="text-sm text-muted italic"
    >
      Aucune description renseignée — âge, apparence, histoire, alliés…
    </p>

    <p
      v-if="portraitFailed"
      class="text-xs text-warning"
    >
      Le portrait n'a pas pu être chargé (URL inaccessible).
    </p>
  </div>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  name,
  backstory,
  allies,
  portraitSrc,
  appearanceFields,
} = useCharacterSheet(characterSheet)

// Nom du joueur : porté par le compte propriétaire de la fiche (`users.name`),
// pas par une colonne dédiée.
const playerName = computed<string>(() => characterSheet.value.owner?.name ?? '')

const isEmpty = computed<boolean>(() =>
  !appearanceFields.value.length && !backstory.value && !allies.value && !portraitSrc.value,
)

const portraitFailed = ref(false)
watch(portraitSrc, () => {
  portraitFailed.value = false
})
</script>
