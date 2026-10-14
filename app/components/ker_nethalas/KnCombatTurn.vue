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
      <UFormField
        v-if="minions.length"
        label="Cible de l'action"
      >
        <USelect
          v-model="victim"
          :items="victimItems"
          class="w-full"
        />
      </UFormField>
      <UFormField
        v-if="onSurvivor"
        label="Défense du survivant (contre une attaque physique)"
      >
        <USelect
          v-model="defenseId"
          :items="defenseItems"
          class="w-full"
        />
      </UFormField>
      <KnNumberField
        v-if="onSurvivor"
        v-model="bonus"
        label="Bonus ou malus à la défense"
        :min="-99"
        :max="99"
      />
      <div
        v-if="onSurvivor"
        class="self-end text-sm text-muted"
      >
        Défenses déjà faites ce round : {{ combat?.reactions ?? 0 }}
        (malus de {{ knReactionPenalty(combat?.reactions ?? 0) }} à la prochaine)
        <template v-if="defense.free">
          · {{ combat?.freeParryUsed ? 'Parade gratuite déjà prise ce round' : 'Parade gratuite disponible : sans malus et hors du compte' }}
        </template>
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
        v-if="isTest(drawn.action) && (drawn.action.tag === 'magical' || drawn.action.checks?.length)"
        label="Test que l'action demande (Résistance magique par défaut, sauf si son texte en nomme un autre)"
      >
        <USelect
          v-model="magicCheck"
          :items="magicItems"
          class="w-full"
        />
      </UFormField>
      <UButton
        v-if="drawn.action.tag || isTest(drawn.action)"
        size="sm"
        @click="resolveNow"
      >
        {{ resolveLabel(drawn.action) }}
      </UButton>
      <p
        v-else
        class="text-xs text-muted"
      >
        Action sans étiquette : suivez son texte, avec les tests qu'il demande.
      </p>
    </div>

    <div
      v-if="result?.defense || result?.check || result?.damage"
      class="space-y-1 rounded-md bg-elevated p-3"
    >
      <KnCheckLine
        v-if="result.check"
        label="Attaque de la créature"
        :check="result.check"
      />
      <KnCheckLine
        v-if="result.defense"
        :label="`${isTest(result.action) ? 'Test' : 'Défense'} ${onSurvivor ? 'du survivant' : `de ${victimName}`}`"
        :check="result.defense"
      />
      <p
        v-if="result.exchange"
        class="font-medium"
      >
        {{ exchangeText }}
      </p>
      <p
        v-if="isTest(result.action) && result.defense"
        class="font-medium"
      >
        {{ testText }}
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
        <span v-if="result.direct"> directement à la Santé</span>
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
          {{ result.applied ? 'Appliqué' : onSurvivor ? 'Appliquer au survivant' : 'Appliquer au sbire' }}
        </UButton>
      </div>
    </div>

    <div
      v-if="selfEffects.length"
      class="space-y-1"
    >
      <p class="text-xs font-medium text-muted">
        Effets sur la créature
      </p>
      <ul class="space-y-1 text-sm">
        <li
          v-for="(effect, index) in selfEffects"
          :key="index"
          class="flex flex-wrap items-center gap-2"
        >
          <UButton
            size="xs"
            variant="soft"
            :disabled="selfTaken.includes(index) || !selfReady(effect)"
            @click="takeSelf(index)"
          >
            {{ selfTaken.includes(index) ? 'Appliqué' : 'Appliquer' }}
          </UButton>
          <span>{{ creatureName }} {{ selfEffectText(effect, refName) }}</span>
          <span
            v-if="!selfReady(effect) && !selfTaken.includes(index)"
            class="text-xs text-muted"
          >Après avoir appliqué des dégâts au survivant.</span>
        </li>
      </ul>
    </div>

    <div
      v-if="rider && drawn"
      class="space-y-1"
    >
      <p class="text-xs font-medium text-muted">
        Effets de l'action « {{ drawn.action.name }} »
      </p>
      <KnOutcomePanel
        :entry="rider"
        :taken
        :result="riderResult"
        active
        @take="takeRider"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knActionIsTest } from '~~/shared/ker-nethalas/combat'
import { knDefenseOptions } from '~~/shared/ker-nethalas/equipment'
import { knReactionPenalty } from '~~/shared/ker-nethalas/combatState'
import type { KnCreature, KnCreatureAction, KnCreatureSelfEffect } from '~~/shared/ker-nethalas/creatures'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knOutcomeAvailable, type KnRollTableEntry } from '~~/shared/ker-nethalas/tables'
import type { KnResistanceKey, KnSkillKey } from '~~/shared/ker-nethalas/skills'
import type { KnTurnResult } from '~/composables/useKnCombat'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const { combat, minions, creatureOf, drawAction, takeTurn, applyToSurvivor, applyToMinion, applySelfEffect, moveText, survivorArmor, log } = useKnCombat(character, () => props.resolved, () => props.bestiary)
const { applyEffects } = useKnApplyEffects(character, () => props.resolved)
const { selfEffectText } = useKnEffectText()

const isTest = knActionIsTest

const who = ref(0)
const defenseId = ref('dodge')
const magicCheck = ref<KnSkillKey | KnResistanceKey>('spellward')
const bonus = ref(0)
const manualAmount = ref(0)
const victim = ref<'survivor' | number>('survivor')

const victimItems = computed<SelectItem[]>(() => [
  { label: 'Le survivant', value: 'survivor' },
  ...minions.value.map((minion, index) => ({ label: `Sbire : ${minion.name} (${minion.health}/${minion.maxHealth})`, value: index })),
])
const onSurvivor = computed(() => victim.value === 'survivor' || !minions.value[victim.value])
const victimName = computed(() => victim.value === 'survivor' ? 'le survivant' : minions.value[victim.value]?.name ?? 'le sbire')
const refName = (ref: string) => props.bestiary?.find(creature => creature.key === ref)?.name ?? ref
const drawn = ref<{ d6: number, action: KnCreatureAction } | undefined>()
const taken = ref<number[]>([])
const selfTaken = ref<number[]>([])
const result = ref<KnTurnResult | undefined>()

const whoItems = computed<SelectItem[]>(() =>
  (combat.value?.creatures ?? []).flatMap((creature, index) => creature.health > 0
    ? [{ label: `${creature.name} (${creature.health}/${creature.maxHealth}${creature.temporary ? ` +${creature.temporary}` : ''})`, value: index }]
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
const defenseOptions = computed(() => knDefenseOptions(character.value.inventory, combat.value?.dual).filter(option => option.kind === 'dodge' || !savage.value))
const defenseItems = computed<SelectItem[]>(() => defenseOptions.value.map((option) => {
  const detail = option.kind === 'dodge'
    ? t('ker_nethalas.skills.dodge')
    : `Parade${option.free ? ' gratuite' : ''} : ${option.weapon}${option.shield ? ` et ${option.shield}` : ''} (${t(`ker_nethalas.skills.${option.skill}`)}${option.bonus ? `, +${option.bonus}` : ''})`
  return { label: detail, value: option.id }
}))
const defense = computed(() => defenseOptions.value.find(option => option.id === defenseId.value) ?? defenseOptions.value[0]!)

watch([who, savage, victim], () => {
  drawn.value = undefined
  result.value = undefined
  if (savage.value) defenseId.value = 'dodge'
})

const canAct = computed(() => whoItems.value.some(item => item.value === who.value) && !!creatureOf(who.value) && !combat.value?.creatures[who.value]?.spent)

function drawNow() {
  result.value = undefined
  taken.value = []
  selfTaken.value = []
  drawn.value = drawAction(who.value)
  magicCheck.value = drawn.value?.action.checks?.[0]?.skill ?? 'spellward'
}

function resolveNow() {
  if (!drawn.value) return
  result.value = takeTurn({ index: who.value, d6: drawn.value.d6, action: drawn.value.action, defense: defense.value.skill, defenseBonus: defense.value.bonus, gear: defense.value.used, freeParry: defense.value.free, magicCheck: magicCheck.value, bonus: bonus.value, ...(onSurvivor.value ? {} : { minion: victim.value as number }) })
  manualAmount.value = result.value?.amount ?? 0
}

// Ce que l'action fait en plus des dégâts : sans étiquette ni dégâts, tout de suite ; Physique, une fois touché ; sur un test
// du survivant, une fois ce test fait, la branche qui lui correspond étant mise en avant. Ce test est déjà celui d'au-dessus,
// le panneau ne le redemande pas.
const rider = computed<KnRollTableEntry | undefined>(() => {
  const action = drawn.value?.action
  if (!action?.outcomes?.length) return undefined
  const entry = (withChecks: boolean): KnRollTableEntry => ({ min: 1, max: 1, text: action.name, checks: withChecks ? action.checks : undefined, outcomes: action.outcomes })
  if (!onSurvivor.value) return undefined
  if (isTest(action)) return result.value ? entry(false) : undefined
  if (!action.tag) return entry(true)
  return result.value?.exchange?.outcome === 'hit' ? entry(true) : undefined
})

const riderResult = computed(() => result.value?.defense?.success)

const resolveLabel = (action: KnCreatureAction) => {
  if (!isTest(action)) return onSurvivor.value ? 'Se défendre' : 'Faire défendre le sbire'
  return action.tag === 'magical' || action.checks?.length ? `Faire le test ${onSurvivor.value ? 'du survivant' : 'du sbire'}` : 'Calculer les dégâts'
}

const testText = computed(() => {
  const r = result.value
  if (!r?.defense) return ''
  if (r.action.damage?.always) return r.defense.success ? 'Test réussi : les dégâts restent dus, pas les autres effets.' : 'Test raté : les dégâts et les autres effets s\'appliquent.'
  return r.defense.success ? 'Résisté : aucun effet de dégâts.' : 'Raté : les effets de l\'action s\'appliquent.'
})

const selfEffects = computed(() => drawn.value?.action.self ?? [])
const creatureName = computed(() => combat.value?.creatures[who.value]?.name ?? '')

// Une part « des dégâts infligés » n'a de sens qu'une fois ces dégâts retirés au survivant.
const selfReady = (effect: KnCreatureSelfEffect) => {
  if (effect.kind === 'buff' || effect.kind === 'summon') return true
  return !(effect.ifDamage || ('of' in effect.amount && effect.amount.of === 'damage')) || (result.value?.dealt ?? 0) > 0
}

function takeSelf(index: number) {
  const effect = selfEffects.value[index]
  if (!effect || selfTaken.value.includes(index) || !selfReady(effect)) return
  applySelfEffect(who.value, effect, result.value?.dealt ?? 0)
  selfTaken.value = [...selfTaken.value, index]
}

function takeRider(index: number) {
  const action = drawn.value?.action
  const outcome = action?.outcomes?.[index]
  if (!action || !outcome || !knOutcomeAvailable(action.outcomes ?? [], taken.value, index)) return
  applyEffects(outcome.effects, action.name, { creature: true })
  taken.value = [...taken.value, index]
  log(`${action.name} : effets appliqués au survivant`)
}

const canApply = computed(() => {
  const r = result.value
  if (!r) return false
  if (r.minion !== undefined) return true
  if (isTest(r.action)) return r.amount !== undefined
  return r.exchange?.outcome === 'hit' || r.exchange?.outcome === 'bothFail'
})

function apply() {
  if (!result.value) return
  if (result.value.minion === undefined) applyToSurvivor(result.value, manualAmount.value)
  else applyToMinion(result.value, manualAmount.value)
}

const exchangeText = computed(() => {
  const exchange = result.value?.exchange
  if (!exchange) return ''
  if (exchange.outcome === 'hit') return exchange.criticalStrike ? 'La créature touche : Coup critique.' : 'La créature touche.'
  if (exchange.outcome === 'defended') return onSurvivor.value ? 'Le survivant pare ou esquive.' : `${victimName.value} pare ou esquive.`
  if (exchange.outcome === 'bothFail') return `Les deux ratent : ${victimName.value} subit 1 dégât inévitable.`
  return 'Égalité parfaite : relancez.'
})
</script>
