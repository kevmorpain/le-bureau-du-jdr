<template>
  <KnCard storage-key="madness">
    <template #header>
      <KnCardHeader title="Folie et Pourriture">
        À 0 en Santé mentale, le survivant est pris par la folie : on tire sur la table de Folie (D10). Les résultats cumulatifs se
        retiennent ici ; les dégâts et l'XP se prennent par un bouton.
        <template #extra>
          <UButton
            class="ml-auto"
            size="sm"
            icon="i-heroicons:cube"
            color="secondary"
            :variant="atZero ? 'solid' : 'soft'"
            @click="draw"
          >
            Tirer une Folie (D10)
          </UButton>
        </template>
      </KnCardHeader>
    </template>

    <div class="space-y-6">
      <UAlert
        v-if="atZero"
        color="error"
        variant="subtle"
        icon="i-heroicons:exclamation-triangle"
        title="Santé mentale à 0"
        description="Le survivant est pris par la folie : tirez sur la table de Folie."
      />

      <div
        v-if="last"
        class="space-y-2 rounded-md bg-elevated p-3 text-sm"
      >
        <p class="font-medium">
          D10 → {{ last.roll }}<span v-if="last.modified !== last.roll"> ({{ signed(last.modified - last.roll) }} Esprit fragile = {{ Math.max(1, last.modified) }})</span>
          : {{ outcomeText }}
        </p>
        <UButton
          v-if="last.outcome.kind === 'damage' || last.outcome.kind === 'xp'"
          size="xs"
          variant="soft"
          :disabled="applied"
          @click="applyOutcome"
        >
          {{ applied ? 'Appliqué' : last.outcome.kind === 'damage' ? 'Subir 2D6 de dégâts contondants' : `Gagner ${KN_MADNESS_XP} XP` }}
        </UButton>
      </div>

      <KnRotMadnessEditor v-model:status="character.status" />
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_MADNESS_DAMAGE, KN_MADNESS_XP, knDrawMadness } from '~~/shared/ker-nethalas/madnessDraw'
import { knRollDie } from '~~/shared/ker-nethalas/run'

const props = defineProps<{
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const toast = useToast()
const { t } = useI18n()
const { signed } = useKnLabels()
const { applyEffects } = useKnApplyEffects(character, () => props.resolved)

const atZero = computed(() => character.value.sanityCurrent === 0)

const last = ref<ReturnType<typeof knDrawMadness>>()
const applied = ref(false)

const outcomeText = computed(() => {
  const outcome = last.value?.outcome
  if (!outcome) return ''
  if (outcome.kind === 'death') return 'l\'esprit se brise : le survivant est perdu à la folie, il est mort.'
  if (outcome.kind === 'counter') return `${t(`ker_nethalas.madnessNames.${outcome.key}`)}, un cumul de plus (ajouté ci-dessous).`
  if (outcome.kind === 'lostSkill') return 'souvenir bloqué : choisissez la compétence réduite de 10 dans la liste ci-dessous.'
  if (outcome.kind === 'damage') return 'le survivant se gifle pour reprendre ses esprits : 2D6 de dégâts contondants qui ignorent l\'armure.'
  return `les épreuves ont enseigné quelque chose au survivant : +${KN_MADNESS_XP} XP.`
})

function draw() {
  const drawn = knDrawMadness(character.value.status.madness, knRollDie(10))
  character.value.status = { ...character.value.status, madness: drawn.madness }
  last.value = drawn
  applied.value = false
  if (drawn.outcome.kind === 'death') toast.add({ title: 'La table de Folie : le survivant est mort.', color: 'error' })
}

function applyOutcome() {
  const kind = last.value?.outcome.kind
  if (applied.value) return
  if (kind === 'damage') applyEffects([{ kind: 'damage', dice: { ...KN_MADNESS_DAMAGE } }], 'Folie : coup à la tête')
  else if (kind === 'xp') applyEffects([{ kind: 'xp', amount: KN_MADNESS_XP }], 'Folie : leçon retenue')
  else return
  applied.value = true
}
</script>
