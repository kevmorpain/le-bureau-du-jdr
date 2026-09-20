<template>
  <UAlert
    v-if="!online"
    color="warning"
    variant="subtle"
    icon="i-heroicons:signal-slash"
    title="Hors-ligne"
    description="La création de personnage nécessite une connexion."
    class="m-3"
  />

  <BuilderSummary
    v-if="showSummary"
    :submitting="submitting"
    @back="showSummary = false"
    @submit="handleSubmit"
  />

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
    <div v-else-if="currentStepId === 'asi'">
      <StepAsi />
    </div>
    <div v-else-if="currentStepId === 'feats'">
      <StepFeats />
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
import { useOnline } from '@vueuse/core'
import { BACKGROUNDS, chosenToolProficiencies } from '~/data/character-builder'

definePageMeta({ layout: 'blank' })

const {
  currentStepId,
  state,
  classData,
  subraceData,
  raceData,
  selectedLineageId,
  lineageBaseSpeciesId,
  backgroundData,
  finalAbilities,
  hpMax,
  resetBuilder,
  needsPactBoon,
  asiLevelsForCharacter,
} = useCharacterBuilder()

const {
  resolveClassId,
  resolveSubclassId,
  resolveSpeciesId,
  resolveBackgroundId,
  resolveItemIds,
} = useBuilderEntities()

const router = useRouter()
const online = useOnline()
const showSummary = ref(false)
const submitting = ref(false)
const toast = useToast()

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom du personnage',
  maxHp: 'Points de vie',
  classId: 'Classe',
  abilityScores: 'Caractéristiques',
  classSkills: 'Compétences de classe',
  backgroundSkills: 'Compétences d\'historique',
  spellIds: 'Sorts',
  inventoryItemIds: 'Équipement',
  alignment: 'Alignement',
  speciesId: 'Race',
  backgroundId: 'Historique',
}

async function handleSubmit() {
  if (!classData.value || !hpMax.value) return
  if (!online.value) {
    toast.add({ title: 'Création indisponible hors-ligne', description: 'Reconnecte-toi pour créer le personnage.', color: 'warning' })
    return
  }
  submitting.value = true

  try {
    const isVariantHuman = state.value.raceId === 'human' && state.value.isVariantHuman

    // Résolution du nom de l'espèce — Humain variant : pas de lien espèce pour éviter le cumul +1 universel
    const speciesDbName = isVariantHuman
      ? null
      : (subraceData.value?.dbName ?? raceData.value?.dbName ?? null)

    const bgData = BACKGROUNDS.find(b => b.id === state.value.backgroundId)
    const isCustomBg = bgData?.id === 'custom'

    // Historique SEEDÉ : compétences DÉRIVÉES du porteur (F3), plus envoyées. Custom : pas de porteur en
    // base → les compétences choisies restent matérialisées (avec la compétence d'Humain variant).
    const backgroundSkills = isCustomBg
      ? state.value.customBackgroundSkills
      : []

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

    // Résolution name → dbId au moment du submit
    const classId = resolveClassId(classData.value.dbName)
    if (!classId) {
      toast.add({
        title: 'Classe introuvable en base',
        description: `Aucune classe "${classData.value.dbName}" en DB — vérifier le seed.`,
        color: 'error',
      })
      submitting.value = false
      return
    }
    const subclassId = resolveSubclassId(classData.value.dbName, state.value.subclass ?? null)
    if (state.value.subclass && !subclassId) {
      toast.add({
        title: 'Sous-classe introuvable',
        description: `"${state.value.subclass}" n'existe pas pour ${classData.value.dbName} — vérifier le seed.`,
        color: 'error',
      })
      submitting.value = false
      return
    }
    // Espèce « base + lignée » (D17, lot 5b) : si la sous-race choisie vient du catalogue (elle
    // porte un lineageId), on envoie l'Elfe BASE + le choix de lignée (chemin serveur du lot 5a),
    // au lieu de résoudre l'ancienne espèce séparée par nom.
    const lineageId = selectedLineageId.value
    const speciesId = lineageId != null ? lineageBaseSpeciesId.value : resolveSpeciesId(speciesDbName)
    const backgroundId = isCustomBg ? null : resolveBackgroundId(bgData?.dbName ?? null)
    const { ids: inventoryItemIds, unresolved: inventoryItemNamesUnresolved } = resolveItemIds(itemNames)
    const pactWeaponItemId = needsPactBoon.value && state.value.pactBoon === 'blade' && state.value.pactWeaponItemName
      ? resolveItemIds([state.value.pactWeaponItemName]).ids[0] ?? null
      : null

    const payload = {
      name: state.value.name,
      alignment: state.value.alignment ?? undefined,
      maxHp: hpMax.value,
      classId,
      subclassId,
      // Style de combat choisi (F2 tranche 2) : envoyé au serveur, qui le résout + matérialise (le
      // choix était auparavant collecté puis PERDU). Le serveur gate par niveau (Paladin/Rôdeur niv 2).
      fightingStyle: state.value.fightingStyle ?? undefined,
      expertiseSkills: state.value.expertiseSkills,
      level: state.value.level,
      speciesId,
      selectedLineageId: lineageId,
      backgroundId,
      customBackgroundName: isCustomBg ? state.value.customBackgroundName : null,
      personality: state.value.personality,
      ideals: state.value.ideals,
      bonds: state.value.bonds,
      flaws: state.value.flaws,
      age: state.value.age,
      height: state.value.height,
      weight: state.value.weight,
      eyes: state.value.eyes,
      hair: state.value.hair,
      skin: state.value.skin,
      deity: state.value.deity,
      backstory: state.value.backstory,
      allies: state.value.allies,
      portraitUrl: state.value.portraitUrl,
      abilityScores: (() => {
        const scores: Record<string, number> = Object.fromEntries(
          Object.entries(state.value.abilities).filter(([, v]) => v != null),
        ) as Record<string, number>
        // Les bonus d'espèce FIXES viennent des effets : les ajouter ici les compterait deux fois.
        for (const [ab, amount] of Object.entries(chosenRaceAbilityBonuses(state.value)))
          scores[ab] = (scores[ab] ?? 0) + (amount ?? 0)
        return scores
      })(),
      classSkills: state.value.skills,
      classSavingThrows: classData.value.savingThrows,
      // F5 : plus de `armorProficiencyKeys`/`weaponProficiencyKeys` — les maîtrises de base de
      // classe sont DÉRIVÉES côté serveur du porteur de classe (volet B), ces champs étaient
      // vestigiaux (acceptés puis ignorés par createCharacter). Le schéma les garde optionnels.
      backgroundSkills: [
        ...backgroundSkills,
        ...(isVariantHuman && state.value.variantHumanSkill ? [state.value.variantHumanSkill] : []),
      ],
      selectedLanguages: [
        ...state.value.selectedLanguages,
        // Humain variant : 'Commun' n'est plus apporté par les effets d'espèce (lien espèce absent)
        ...(isVariantHuman ? ['Commun'] : []),
      ],
      toolProficiencyChoices: chosenToolProficiencies(state.value.selectedToolProficiencies),
      spellIds: [...state.value.selectedCantrips, ...state.value.selectedSpells],
      pactBoon: needsPactBoon.value ? state.value.pactBoon : null,
      pactWeaponItemId,
      pactBoonCantripIds: needsPactBoon.value && state.value.pactBoon === 'tome' ? state.value.selectedPactBoonCantripIds : [],
      invocationIds: state.value.invocationIds,
      metamagicIds: state.value.metamagicIds,
      inventoryItemIds,
      inventoryItemNamesUnresolved,
      // Seuls les paliers où le joueur a choisi 'asi' (pas 'feat') sont envoyés.
      asiBonuses: asiLevelsForCharacter.value
        .filter(lvl => state.value.asiChoice[lvl] === 'asi')
        .flatMap(lvl =>
          Object.entries(state.value.asiBonuses[lvl] ?? {})
            .filter(([, amount]) => (amount ?? 0) > 0)
            .map(([ability, amount]) => ({
              classLevel: lvl,
              ability: ability as string,
              amount: amount as number,
            })),
        ),
      asiFeats: asiLevelsForCharacter.value
        .filter(lvl => state.value.asiChoice[lvl] === 'feat')
        .map(lvl => ({
          classLevel: lvl,
          featureId: state.value.asiFeats[lvl],
          choices: state.value.featChoices[state.value.asiFeats[lvl]] ?? null,
        }))
        .filter(f => f.featureId != null),
      bonusFeatureId: state.value.bonusFeatureId,
      bonusFeatChoices: state.value.bonusFeatureId != null
        ? (state.value.featChoices[state.value.bonusFeatureId] ?? null)
        : null,
      arcaneMysteria: Object.entries(state.value.arcaneMysteriumSpellIds)
        .map(([spellLevel, spellId]) => ({ spellLevel: Number(spellLevel), spellId })),
      bookOfAncientSecretsSpellIds: state.value.bookOfAncientSecretsSpellIds,
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
