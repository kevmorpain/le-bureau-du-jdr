<template>
  <div class="space-y-3 rounded-md border border-default p-3">
    <h3 class="font-medium">
      Tour d'une créature
    </h3>

    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Créature">
        <USelect
          v-model="who"
          :items="whoItems"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Défense du survivant (contre une attaque physique)">
        <USelect
          v-model="defense"
          :items="defenseItems"
          class="w-full"
        />
      </UFormField>
      <KnNumberField
        v-model="bonus"
        label="Bonus ou malus à la défense"
        :min="-99"
        :max="99"
      />
      <div class="self-end text-sm text-muted">
        Défenses déjà faites ce round : {{ combat?.reactions ?? 0 }}
        (malus de {{ knReactionPenalty(combat?.reactions ?? 0) }} à la prochaine)
      </div>
    </div>

    <UButton
      variant="soft"
      icon="i-heroicons:cube"
      :disabled="!canAct"
      @click="drawNow"
    >
      Tirer l'action de la créature (D6)
    </UButton>

    <div
      v-if="drawn"
      class="space-y-2 rounded-md bg-elevated p-3"
    >
      <p class="text-sm">
        <span class="mr-1 text-xs text-muted tabular-nums">D6 → {{ drawn.d6 }}</span>
        <span class="font-medium">{{ drawn.action.name }}</span>
        <UBadge
          v-if="drawn.action.tag"
          :label="drawn.action.tag === 'magical' ? 'Magique' : 'Physique'"
          :color="drawn.action.tag === 'magical' ? 'info' : 'neutral'"
          variant="subtle"
          size="md"
          class="ml-1"
        />
      </p>
      <p class="text-sm text-muted">
        {{ drawn.action.text }}
      </p>
      <UFormField
        v-if="drawn.action.tag === 'magical'"
        label="Test que l'action demande (Résistance magique par défaut, sauf si son texte en nomme un autre)"
      >
        <USelect
          v-model="magicCheck"
          :items="magicItems"
          class="w-full"
        />
      </UFormField>
      <UButton
        v-if="drawn.action.tag"
        size="sm"
        @click="resolveNow"
      >
        {{ drawn.action.tag === 'magical' ? 'Faire le test du survivant' : 'Se défendre' }}
      </UButton>
      <p
        v-else
        class="text-xs text-muted"
      >
        Action sans étiquette : suivez son texte, avec les tests qu'il demande.
      </p>
    </div>

    <div
      v-if="result?.defense || result?.check"
      class="space-y-1 rounded-md bg-elevated p-3"
    >
      <KnCheckLine
        v-if="result.check"
        label="Attaque de la créature"
        :check="result.check"
      />
      <KnCheckLine
        v-if="result.defense"
        :label="result.action.tag === 'magical' ? 'Test du survivant' : 'Défense du survivant'"
        :check="result.defense"
      />
      <p
        v-if="result.exchange"
        class="font-medium"
      >
        {{ exchangeText }}
      </p>
      <p
        v-if="result.action.tag === 'magical'"
        class="font-medium"
      >
        {{ result.defense?.success ? 'Résistée : aucun effet de dégâts.' : 'Ratée : les effets de l\'action s\'appliquent.' }}
      </p>
      <p
        v-if="result.survivorMove"
        class="text-sm"
      >
        <span class="font-medium">Mouvement défensif du survivant (D10 : {{ result.survivorMove }})</span> :
        {{ moveText('survivorDefensiveMoves', result.survivorMove) }}
      </p>
      <p
        v-if="result.monsterFumble"
        class="text-sm"
      >
        <span class="font-medium">Maladresse de la créature (D10 : {{ result.monsterFumble }})</span> :
        {{ moveText('monsterFumbles', result.monsterFumble) }}
      </p>
      <p
        v-if="result.location"
        class="text-sm"
      >
        <span class="text-muted">Localisation :</span> {{ $t(`ker_nethalas.hitLocations.${result.location}`) }}
        <span class="text-muted">· Armure du survivant : {{ survivorArmor(result.location) }}</span>
      </p>
      <p
        v-if="result.damage"
        class="text-sm"
      >
        <span class="text-muted">Dégâts :</span>
        {{ result.damageRoll?.dice.map(die => `D${die.sides} → ${die.roll}`).join(', ') }}
        → <span class="font-semibold">{{ result.damage.damage }}</span>
        <span v-if="result.damage.armorAbsorbed"> (Armure : −{{ result.damage.armorAbsorbed }})</span>
      </p>
      <div
        v-if="canApply"
        class="flex flex-wrap items-end gap-2"
      >
        <KnNumberField
          v-model="manualAmount"
          :label="result.amount === undefined ? 'Dégâts du texte à retirer' : 'Dégâts à retirer (modifiables)'"
          :min="0"
          :max="999"
          class="w-40"
        />
        <UButton
          size="sm"
          variant="soft"
          :disabled="result.applied"
          @click="apply"
        >
          {{ result.applied ? 'Appliqué' : 'Appliquer au survivant' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knReactionPenalty } from '~~/shared/ker-nethalas/combatState'
import type { KnCreature, KnCreatureAction } from '~~/shared/ker-nethalas/creatures'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_WEAPON_SKILL_KEYS, type KnResistanceKey, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
import type { KnTurnResult } from '~/composables/useKnCombat'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const { combat, creatureOf, drawAction, takeTurn, applyToSurvivor, moveText, survivorArmor } = useKnCombat(character, () => props.resolved, () => props.bestiary)

const who = ref(0)
const defense = ref<KnSkillKey>('dodge')
const magicCheck = ref<KnSkillKey | KnResistanceKey>('spellward')
const bonus = ref(0)
const manualAmount = ref(0)
const drawn = ref<{ d6: number, action: KnCreatureAction } | undefined>()
const result = ref<KnTurnResult | undefined>()

const whoItems = computed<SelectItem[]>(() =>
  (combat.value?.creatures ?? []).flatMap((creature, index) => creature.health > 0
    ? [{ label: `${creature.name} (${creature.health}/${creature.maxHealth})`, value: index }]
    : []),
)

watch(whoItems, (items) => {
  if (!items.some(item => item.value === who.value) && items[0]) who.value = items[0].value as number
}, { immediate: true })

// Un trait Sauvage interdit la parade : seule l'Esquive évite ses attaques.
const savage = computed(() => !!creatureOf(who.value)?.traits.some(trait => trait.key === 'savage'))
const magicItems: SelectItem[] = [
  { label: t('ker_nethalas.resistances.spellward'), value: 'spellward' },
  { label: t('ker_nethalas.resistances.endurance'), value: 'endurance' },
  { label: t('ker_nethalas.resistances.resolve'), value: 'resolve' },
  { label: t('ker_nethalas.skills.dodge'), value: 'dodge' },
]
const defenseItems = computed<SelectItem[]>(() =>
  ['dodge', ...(savage.value ? [] : KN_WEAPON_SKILL_KEYS)].map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key })),
)

watch([who, savage], () => {
  drawn.value = undefined
  result.value = undefined
  if (savage.value) defense.value = 'dodge'
})

const canAct = computed(() => whoItems.value.some(item => item.value === who.value) && !!creatureOf(who.value))

function drawNow() {
  result.value = undefined
  drawn.value = drawAction(who.value)
}

function resolveNow() {
  if (!drawn.value) return
  result.value = takeTurn({ index: who.value, d6: drawn.value.d6, action: drawn.value.action, defense: defense.value, magicCheck: magicCheck.value, bonus: bonus.value })
  manualAmount.value = result.value?.amount ?? 0
}

const canApply = computed(() => {
  const r = result.value
  if (!r) return false
  if (r.action.tag === 'magical') return !!r.defense && !r.defense.success
  return r.exchange?.outcome === 'hit' || r.exchange?.outcome === 'bothFail'
})

function apply() {
  if (result.value) applyToSurvivor(result.value, manualAmount.value)
}

const exchangeText = computed(() => {
  const exchange = result.value?.exchange
  if (!exchange) return ''
  if (exchange.outcome === 'hit') return exchange.criticalStrike ? 'La créature touche : Coup critique.' : 'La créature touche.'
  if (exchange.outcome === 'defended') return 'Le survivant pare ou esquive.'
  if (exchange.outcome === 'bothFail') return 'Les deux ratent : le survivant subit 1 dégât inévitable.'
  return 'Égalité parfaite : relancez.'
})
</script>
