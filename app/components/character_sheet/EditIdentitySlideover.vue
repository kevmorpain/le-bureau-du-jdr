<template>
  <USlideover
    v-model:open="open"
    title="Identité & description"
    description="Nom, portrait, apparence, histoire — modifications enregistrées automatiquement."
  >
    <UButton
      icon="i-heroicons:pencil-square"
      variant="ghost"
      size="xs"
      color="neutral"
      aria-label="Modifier l'identité du personnage"
    />

    <template #body>
      <div class="space-y-6">
        <UFormField
          label="Nom"
          :error="nameDraft.trim() ? undefined : 'Le nom ne peut pas être vide.'"
        >
          <UInput
            v-model="nameDraft"
            placeholder="Nom du personnage"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Alignement">
          <USelect
            v-model="alignment"
            :items="alignmentItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Portrait (URL)"
          hint="http(s) ou chemin du site"
        >
          <UInput
            v-model="portraitUrl"
            placeholder="https://…"
            class="w-full"
          />

          <!-- Aperçu : c'est ici, au moment de la saisie, qu'on dit si l'URL charge —
               l'en-tête de la fiche se contente de masquer un portrait injoignable. -->
          <div
            v-if="portraitSrc"
            class="mt-2 flex items-center gap-2"
          >
            <img
              :src="portraitSrc"
              alt="Aperçu du portrait"
              class="size-16 rounded-lg object-cover border border-default"
              @error="portraitFailed = true"
              @load="portraitFailed = false"
            >
            <span
              v-if="portraitFailed"
              class="text-xs text-warning"
            >
              Image introuvable à cette adresse.
            </span>
          </div>
          <p
            v-else-if="portraitUrl.trim()"
            class="mt-2 text-xs text-warning"
          >
            Adresse ignorée : seules les URL en http(s) ou les chemins du site sont affichés.
          </p>
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField
            v-for="field in appearanceInputs"
            :key="field.key"
            :label="field.label"
          >
            <UInput
              v-model="field.model.value"
              :placeholder="field.placeholder"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Histoire du personnage">
          <UTextarea
            v-model="backstory"
            :rows="8"
            placeholder="D'où vient ton personnage ? Qu'est-ce qui l'a mis sur la route ?"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Alliés & organisations">
          <UTextarea
            v-model="allies"
            :rows="4"
            placeholder="Factions, mentors, contacts, dettes…"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="open = false"
      >
        Fermer
      </UButton>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import { ALIGNMENTS } from '~~/shared/rules/alignments'

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const {
  name,
  age,
  height,
  weight,
  eyes,
  hair,
  skin,
  deity,
  backstory,
  allies,
  portraitUrl,
  portraitSrc,
  alignment,
} = useCharacterSheet(characterSheet)

const portraitFailed = ref(false)
watch(portraitSrc, () => {
  portraitFailed.value = false
})

const alignmentItems = ALIGNMENTS.map(a => ({ label: `${a.name} (${a.short})`, value: a.code }))

const open = ref(false)

// Le nom passe par un brouillon local : `name` refuse d'écrire une valeur vide
// (contrat de `updateCharacterSheetSchema`), et un `v-model` direct empêcherait
// alors d'effacer le champ pour le retaper.
const nameDraft = ref(name.value)
watch(open, (isOpen) => {
  if (isOpen) nameDraft.value = name.value
})
watch(nameDraft, (v) => {
  name.value = v
})

const appearanceInputs = [
  { key: 'age', label: 'Âge', placeholder: '27 ans', model: age },
  { key: 'height', label: 'Taille', placeholder: '1,75 m', model: height },
  { key: 'weight', label: 'Poids', placeholder: '68 kg', model: weight },
  { key: 'eyes', label: 'Yeux', placeholder: 'Verts', model: eyes },
  { key: 'hair', label: 'Cheveux', placeholder: 'Bruns, mi-longs', model: hair },
  { key: 'skin', label: 'Peau', placeholder: 'Hâlée', model: skin },
  { key: 'deity', label: 'Divinité', placeholder: 'Tyr', model: deity },
]
</script>
