<template>
  <div>
    <LevelBanner
      :class-data="pickedClass"
      :from-level="state.fromLevel"
      :to-level="state.toLevel"
      :is-multiclass="state.isMulticlass"
    />

    <h2 class="text-xl font-extrabold text-(--ui-text) mb-1.5">Aptitudes</h2>

    <div class="mb-5">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">Nouvelles aptitudes</p>
      <template v-if="newFeatures.length">
        <div class="flex flex-col gap-2">
          <div
            v-for="feat in newFeatures"
            :key="feat"
            class="flex items-start gap-3 px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated)"
          >
            <span class="text-amber-400 mt-0.5 shrink-0">✦</span>
            <span class="text-sm text-(--ui-text) font-medium">{{ feat }}</span>
          </div>
        </div>
      </template>
      <div v-else class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-sm text-muted italic">
        Pas de nouvelle aptitude à ce niveau — vous gagnez néanmoins +PV et la progression continue.
      </div>
    </div>

    <div
      v-if="profBonusChange"
      class="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8 text-sm"
    >
      <span class="text-amber-400 text-lg">⬆</span>
      <span class="text-amber-400 font-semibold">Bonus de maîtrise :</span>
      <span class="text-muted">{{ formatMod(oldProfBonus) }} → </span>
      <span class="text-amber-400 font-bold font-mono">{{ formatMod(profBonusChange) }}</span>
    </div>

    <div v-if="isSubclassLevel && subclasses.length" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-3">
        ⚡ Choisissez votre {{ pickedClass?.subclassLabel ?? 'sous-classe' }}
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          v-for="sub in subclasses"
          :key="sub.id"
          class="text-left px-4 py-3 rounded-xl border transition-all"
          :class="state.newSubclassId === sub.id
            ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) hover:border-(--ui-border-strong) text-(--ui-text)'"
          @click="selectSubclass(sub)"
        >
          <div class="font-semibold text-sm">{{ sub.name }}</div>
          <div v-if="sub.description" class="text-xs text-muted mt-0.5 leading-snug line-clamp-2">{{ sub.description }}</div>
        </button>
      </div>
    </div>

    <div
      v-if="visiblePickChoices.length"
      class="mb-6 space-y-3"
    >
      <template
        v-for="choice in visiblePickChoices"
        :key="choice.progressionId"
      >
        <FeaturePickPicker
          v-model="state.featurePicks[choice.progressionId]"
          v-model:replaced="state.featureReplacements[choice.progressionId]"
          :title="choiceTitle(choice) ?? 'Choix'"
          :count="choice.count"
          :options="choice.options"
          :owner-level="choice.classLevel"
          :accent="choiceAccent(choice)"
          :replaceable-ids="choice.replaceable ? ownedFeatureIds : []"
          :excluded-ids="featurePicksUnavailable(choice.progressionId)"
          :projection="eligibility"
        />

        <template v-if="choice.kind === 'pact_boon'">
          <div
            v-if="pickedPactBoon === 'chain'"
            class="px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 text-xs text-emerald-400"
          >
            ✦ Le sort <strong>Appel de familier</strong> sera automatiquement ajouté à votre grimoire.
          </div>

          <div v-else-if="pickedPactBoon === 'blade'">
            <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">
              Arme de pacte (facultatif)
            </p>
            <div
              v-if="meleeWeapons.length"
              class="flex flex-col gap-1.5"
            >
              <button
                class="text-left px-3 py-2 rounded-lg border text-xs transition-all"
                :class="state.pactWeaponInventoryId === null
                  ? 'border-violet-500/60 bg-violet-500/10 text-violet-400 font-semibold'
                  : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-(--ui-border-strong)'"
                @click="state.pactWeaponInventoryId = null"
              >
                Choisir plus tard
              </button>
              <button
                v-for="inv in meleeWeapons"
                :key="inv.inventory.id"
                class="text-left px-3 py-2 rounded-lg border text-xs transition-all"
                :class="state.pactWeaponInventoryId === inv.inventory.id
                  ? 'border-violet-500/60 bg-violet-500/10 text-violet-400 font-semibold'
                  : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-(--ui-border-strong)'"
                @click="state.pactWeaponInventoryId = inv.inventory.id"
              >
                {{ inv.item.name }}
              </button>
            </div>
            <div
              v-else
              class="px-3 py-2 rounded-lg border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-muted italic"
            >
              Aucune arme de corps-à-corps dans l'inventaire — vous pourrez lier une arme depuis votre fiche.
            </div>
          </div>

          <div
            v-else-if="pickedPactBoon === 'tome'"
            class="px-3 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 text-xs text-amber-400"
          >
            ✦ Rendez-vous à l'étape <strong>Magie</strong> pour choisir vos 3 sorts mineurs du Tome.
          </div>
        </template>
      </template>
    </div>

    <div v-if="needsExpertise" class="mb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-muted mb-2">
        ★ Expertise
        <span class="ml-1 text-muted/60 normal-case font-normal tracking-normal">
          — Choisissez {{ newExpertiseCount }} compétence{{ newExpertiseCount > 1 ? 's' : '' }} sur lesquelles doubler le bonus de maîtrise
        </span>
      </p>
      <p class="text-xs text-muted mb-3">
        Sélectionné : <span :class="state.expertiseSkills.length >= newExpertiseCount ? 'text-green-400' : 'text-amber-400'">{{ state.expertiseSkills.length }}/{{ newExpertiseCount }}</span>
      </p>
      <p v-if="alreadyExpertLabels.length" class="text-xs text-muted/70 mb-3">
        Déjà expert : {{ alreadyExpertLabels.join(', ') }}
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        <button
          v-for="sk in eligibleExpertiseSkills"
          :key="sk.key"
          class="text-left px-3 py-2 rounded-lg border text-xs transition-all"
          :class="state.expertiseSkills.includes(sk.key)
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-semibold'
            : 'border-(--ui-border) bg-(--ui-bg-elevated) text-muted hover:border-(--ui-border-strong)'"
          :disabled="!state.expertiseSkills.includes(sk.key) && state.expertiseSkills.length >= newExpertiseCount"
          @click="toggleExpertise(sk.key)"
        >
          {{ sk.label }}
        </button>
      </div>
    </div>

    <div
      v-if="!isSubclassLevel && !visiblePickChoices.length && !needsExpertise"
      class="px-4 py-3 rounded-xl border border-(--ui-border) bg-(--ui-bg-elevated) text-xs text-muted"
    >
      Aucun choix requis à cette étape. Cliquez sur Suivant pour continuer.
    </div>
  </div>
</template>

<script lang="ts" setup>
const charSheet = inject('charSheet') as any

const {
  state,
  pickedClass,
  isSubclassLevel,
  newFeaturePickChoices,
  ownedFeatureIds,
  featurePicksUnavailable,
  needsExpertise,
  newExpertiseCount,
  pickedPactBoon,
  effectivePactBoon,
  knownInvocationNames,
  knownSpellNames,
  eligibleExpertiseSkills,
  expertSkills,
  CLASSES,
  SKILLS,
  profBonusAtLevel,
  formatMod,
  totalLevel,
} = useLevelUp(charSheet)

const { extendedQuery } = useExtendedContent()

// L'état du personnage qui décide des prérequis des manifestations (pacte, sorts connus, manifestations déjà prises).
const eligibility = computed(() => ({
  pactBoon: effectivePactBoon.value,
  knownSpellNames: knownSpellNames.value,
  knownInvocationNames: knownInvocationNames.value,
}))

// Un point de choix sans option à prendre ne s'affiche que s'il permet d'échanger une option déjà portée.
const visiblePickChoices = computed(() => newFeaturePickChoices.value.filter(c =>
  c.count > 0 || (c.replaceable && c.options.some(o => o.featureId != null && ownedFeatureIds.value.includes(o.featureId)))))

const meleeWeapons = computed(() => {
  const inventory: Array<{ inventory: any, item: any }> = (charSheet.value as any)?.inventory ?? []
  return inventory.filter((inv) => {
    const props = inv.item?.properties as any
    return props?.weapon_category === 'simple_melee' || props?.weapon_category === 'martial_melee'
  })
})

const newFeatures = computed<string[]>(() => {
  if (!pickedClass.value) return []
  const lvl = state.value.toLevel
  const text = pickedClass.value.levelMilestones?.[lvl]
  return text ? text.split(/[,+]/).map((s: string) => s.trim()).filter(Boolean) : []
})

const oldProfBonus = computed(() => profBonusAtLevel(totalLevel.value))
const newProfBonus = computed(() => profBonusAtLevel(totalLevel.value + 1))
const profBonusChange = computed(() =>
  newProfBonus.value > oldProfBonus.value ? newProfBonus.value : null,
)

const { data: subclassesData } = useFetch(
  () => pickedClass.value ? `/api/catalog/classes/${encodeURIComponent(pickedClass.value!.dbName)}/subclasses` : '',
  { query: extendedQuery, watch: [pickedClass, () => extendedQuery.value], immediate: true },
)
const subclasses = computed(() => (subclassesData.value ?? []) as Array<{ id: number, name: string, description?: string | null }>)

const alreadyExpertLabels = computed(() => {
  const already = new Set(expertSkills.value)
  return SKILLS.filter(s => already.has(s.key)).map(s => s.label)
})

function selectSubclass(sub: { id: number, name: string }) {
  state.value.newSubclassId = sub.id
  state.value.newSubclassName = sub.name
}

function toggleExpertise(skillKey: string) {
  const idx = state.value.expertiseSkills.indexOf(skillKey)
  if (idx >= 0) {
    state.value.expertiseSkills.splice(idx, 1)
  } else if (state.value.expertiseSkills.length < newExpertiseCount.value) {
    state.value.expertiseSkills.push(skillKey)
  }
}
</script>
