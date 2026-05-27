<template>
  <!-- Écran de résumé final -->
  <BuilderSummary
    v-if="showSummary"
    :submitting="submitting"
    @back="showSummary = false"
    @submit="handleSubmit"
  />

  <!-- Wizard en 6 étapes -->
  <BuilderShell v-else @finish="showSummary = true">
    <div v-if="currentStepId === 'race'">
      <StepRace />
    </div>
    <div v-else-if="currentStepId === 'class'">
      <StepClass />
    </div>
    <div v-else-if="currentStepId === 'abilities'">
      <StepAbilities />
    </div>
    <div v-else-if="currentStepId === 'spells'">
      <StepSpells />
    </div>
    <div v-else-if="currentStepId === 'description'">
      <StepDescription />
    </div>
    <div v-else-if="currentStepId === 'equipment'">
      <StepEquipment />
    </div>
  </BuilderShell>
</template>

<script lang="ts" setup>
import { RACES, BACKGROUNDS, ARMOR_PROF_KEYS, WEAPON_PROF_KEYS } from '~/data/character-builder'

definePageMeta({ layout: 'blank' })

const {
  currentStepId,
  state,
  classData,
  subraceData,
  raceData,
  backgroundData,
  finalAbilities,
  hpMax,
  resetBuilder,
  needsPactBoon,
} = useCharacterBuilder()

const router = useRouter()
const showSummary = ref(false)
const submitting = ref(false)
const toast = useToast()

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom du personnage',
  maxHp: 'Points de vie',
  className: 'Classe',
  abilityScores: 'Caractéristiques',
  classSkills: 'Compétences de classe',
  backgroundSkills: 'Compétences d\'historique',
  spellIds: 'Sorts',
  inventoryItemNames: 'Équipement',
  alignment: 'Alignement',
  speciesDbName: 'Race',
  backgroundDbName: 'Historique',
}

async function handleSubmit() {
  if (!classData.value || !hpMax.value) return
  submitting.value = true

  try {
    const isVariantHuman = state.value.raceId === 'human' && state.value.isVariantHuman

    // Résolution du nom de l'espèce — Humain variant : pas de lien espèce pour éviter le cumul +1 universel
    const speciesDbName = isVariantHuman
      ? null
      : (subraceData.value?.dbName ?? raceData.value?.dbName ?? null)

    // Résolution du background
    const bgData = BACKGROUNDS.find(b => b.id === state.value.backgroundId)
    const isCustomBg = bgData?.id === 'custom'

    // Compétences de background (custom ou prédéfini)
    const backgroundSkills = isCustomBg
      ? state.value.customBackgroundSkills
      : bgData?.skillProficiencies ?? []

    // Extraire les pièces ("15 po", "5 pa"…) de l'équipement
    const CURRENCY_RE = /^(\d+)\s*(pp|po|pe|pa|pc)$/i
    const CURRENCY_FIELDS: Record<string, string> = { pp: 'pp', po: 'po', pe: 'pe', pa: 'pa', pc: 'pc' }
    const currency: Record<string, number> = {}
    const itemNames = state.value.equipment.filter((name) => {
      const m = name.match(CURRENCY_RE)
      if (m) {
        const field = CURRENCY_FIELDS[m[2].toLowerCase()]
        if (field) currency[field] = (currency[field] ?? 0) + parseInt(m[1])
        return false
      }
      return true
    })

    const payload = {
      name: state.value.name,
      alignment: state.value.alignment ?? undefined,
      dragonbornAncestry: state.value.dragonAncestry ?? null,
      maxHp: hpMax.value,
      className: classData.value.dbName,
      subclassName: state.value.subclass ?? null,
      level: state.value.level,
      speciesDbName: speciesDbName ?? null,
      backgroundDbName: isCustomBg ? null : (bgData?.dbName ?? null),
      customBackgroundName: isCustomBg ? state.value.customBackgroundName : null,
      personality: state.value.personality,
      ideals: state.value.ideals,
      bonds: state.value.bonds,
      flaws: state.value.flaws,
      abilityScores: (() => {
        const scores: Record<string, number> = Object.fromEntries(
          Object.entries(state.value.abilities).filter(([, v]) => v != null),
        ) as Record<string, number>
        // Half-Elf : ajouter les +1/+1 choisis (le +2 CHA vient des effets d'espèce)
        if (state.value.raceId === 'half-elf') {
          for (const ab of state.value.halfElfBonuses)
            scores[ab] = (scores[ab] ?? 0) + 1
        }
        // Humain variant : ajouter les +1/+1 choisis (pas de lien espèce → pas de double cumul)
        if (isVariantHuman) {
          for (const ab of state.value.variantHumanBonuses)
            scores[ab] = (scores[ab] ?? 0) + 1
        }
        return scores
      })(),
      classSkills: state.value.skills,
      classSavingThrows: classData.value.savingThrows,
      armorProficiencyKeys: [...new Set(classData.value.armorProficiencies.map(p => ARMOR_PROF_KEYS[p] ?? p))],
      weaponProficiencyKeys: [...new Set(classData.value.weaponProficiencies.map(p => WEAPON_PROF_KEYS[p] ?? p))],
      backgroundSkills: [
        ...backgroundSkills,
        // Compétence bonus Humain variant
        ...(isVariantHuman && state.value.variantHumanSkill ? [state.value.variantHumanSkill] : []),
      ],
      selectedLanguages: [
        ...state.value.selectedLanguages,
        // Humain variant : 'Commun' n'est plus apporté par les effets d'espèce (lien espèce absent)
        ...(isVariantHuman ? ['Commun'] : []),
      ],
      toolProficiencyChoices: Object.values(state.value.selectedToolProficiencies).filter(Boolean),
      spellIds: [...state.value.selectedCantrips, ...state.value.selectedSpells],
      pactBoon: needsPactBoon.value ? state.value.pactBoon : null,
      pactWeaponItemName: needsPactBoon.value && state.value.pactBoon === 'blade' ? state.value.pactWeaponItemName : null,
      pactBoonCantripIds: needsPactBoon.value && state.value.pactBoon === 'tome' ? state.value.selectedPactBoonCantripIds : [],
      invocationIds: state.value.invocationIds,
      inventoryItemNames: itemNames,
      ...currency,
    }

    const result = await $fetch<{ id: number }>('/api/character_sheets', {
      method: 'POST',
      body: payload,
    })

    await router.push(`/characters/${result.id}`)
    resetBuilder()
  }
  catch (e: any) {
    const issues = e?.data?.issues ?? e?.cause?.data?.issues
    if (issues?.length) {
      const fields = [...new Set(issues.map((i: any) => FIELD_LABELS[i.path?.[0]] ?? i.path?.[0] ?? 'Champ inconnu'))]
      toast.add({
        title: 'Impossible de créer le personnage',
        description: `Champ(s) manquant(s) ou invalide(s) : ${fields.join(', ')}`,
        color: 'error',
        duration: 6000,
      })
    }
    else {
      toast.add({
        title: 'Erreur lors de la création',
        description: 'Une erreur inattendue s\'est produite.',
        color: 'error',
      })
    }
    console.error('[builder] Erreur création :', e)
    submitting.value = false
  }
}
</script>
