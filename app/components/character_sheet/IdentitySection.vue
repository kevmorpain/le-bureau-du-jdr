<template>
  <div class="space-y-4">
    <!-- Identité : nom, alignement, joueur, apparence -->
    <div class="space-y-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="font-semibold truncate">
              {{ name || 'Personnage sans nom' }}
            </h2>
            <UBadge
              variant="soft"
              color="neutral"
              size="sm"
            >
              {{ alignmentLabel }}
            </UBadge>
          </div>
          <p
            v-if="playerName"
            class="text-xs text-muted"
          >
            Joueur : {{ playerName }}
          </p>
        </div>
        <EditIdentitySlideover v-model:character-sheet="characterSheet" />
      </div>

      <!-- Apparence physique + catégorie de taille de l'espèce -->
      <dl
        v-if="identityFields.length"
        class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2"
      >
        <div
          v-for="field in identityFields"
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

      <p
        v-if="isAppearanceEmpty"
        class="text-sm text-muted italic"
      >
        Aucune apparence renseignée — âge, taille, yeux, cheveux…
      </p>
    </div>

    <!-- Historique + traits de personnalité -->
    <div class="border-t border-default pt-4">
      <BackgroundSection v-model:character-sheet="characterSheet" />
    </div>

    <!-- Histoire & alliés -->
    <div
      v-if="backstory"
      class="border-t border-default pt-4 space-y-1"
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
      class="border-t border-default pt-4 space-y-1"
    >
      <h3 class="text-xs font-bold uppercase tracking-widest text-muted">
        Alliés & organisations
      </h3>
      <p class="text-sm whitespace-pre-line leading-relaxed">
        {{ allies }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  name,
  backstory,
  allies,
  appearanceFields,
  alignmentLabel,
  sizeLabel,
} = useCharacterSheet(characterSheet)

// Apparence saisie + donnée déjà en base mais jusqu'ici invisible sur la fiche :
// la catégorie de taille de l'espèce (`character_species.size`).
const identityFields = computed(() => [
  ...appearanceFields.value,
  ...(sizeLabel.value ? [{ key: 'size', label: 'Catégorie de taille', value: sizeLabel.value }] : []),
])

// Nom du joueur : porté par le compte propriétaire de la fiche (`users.name`),
// pas par une colonne dédiée.
const playerName = computed<string>(() => characterSheet.value.owner?.name ?? '')

// Le portrait n'est PAS rendu ici : il vit dans l'en-tête de la fiche
// (`DashboardHeaderSection`), visible quelle que soit la section ouverte. Son URL
// reste éditable dans `EditIdentitySlideover`.
const isAppearanceEmpty = computed<boolean>(() => appearanceFields.value.length === 0)
</script>
