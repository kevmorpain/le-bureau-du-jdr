<template>
  <div
    v-if="minions.length"
    class="space-y-3 rounded-md border border-default p-3"
  >
    <h3 class="font-medium">
      Sbires
    </h3>
    <p class="text-xs text-muted">
      Les adversaires visent d'abord le survivant, puis les sbires s'il y a plus d'adversaires que de combattants ; chaque sbire
      agit pendant votre tour, dans l'ordre que vous voulez, et récupère toute sa Santé quand la pièce est nettoyée.
    </p>

    <ul class="space-y-2">
      <li
        v-for="(minion, index) in minions"
        :key="`${minion.ref}-${index}`"
        class="flex flex-wrap items-end gap-3"
      >
        <div class="min-w-32 flex-1">
          <p class="font-medium">
            {{ minion.name }}
            <UBadge
              v-if="minionSheetAt(index) === undefined"
              label="Fiche non chargée"
              color="warning"
              variant="subtle"
              size="md"
            />
          </p>
        </div>
        <KnNumberField
          v-model="minion.health"
          :label="`Santé (max ${minion.maxHealth})`"
          :min="0"
          :max="minion.maxHealth"
          class="w-32"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          :aria-label="`Retirer ${minion.name}`"
          @click="remove(index)"
        >
          Retirer
        </UButton>
      </li>
    </ul>

    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Sbire">
        <USelect
          v-model="who"
          :items="minionItems"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Créature visée">
        <USelect
          v-model="target"
          :items="targetItems"
          class="w-full"
        />
      </UFormField>
      <KnNumberField
        v-model="bonus"
        label="Bonus ou malus à l'attaque"
        :min="-99"
        :max="99"
      />
      <UFormField
        label="Dés de dégâts en plus"
        description="Un bonus de Maîtrise, par exemple D6 ; laissez vide sinon"
        :error="extraError"
      >
        <UInput
          v-model="extraText"
          placeholder="D6"
          class="w-full"
        />
      </UFormField>
    </div>

    <UButton
      variant="soft"
      icon="i-heroicons:cube"
      :disabled="!canAct"
      @click="drawNow"
    >
      Tirer l'action du sbire (D6)
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
      <UButton
        v-if="drawn.action.damage"
        size="sm"
        :disabled="!canAct || !!extraError"
        @click="resolveNow"
      >
        {{ drawn.action.tag === 'magical' ? 'Lancer le sort (test de la créature)' : 'Attaquer' }}
      </UButton>
      <p
        v-else
        class="text-xs text-muted"
      >
        Action sans dégâts : suivez son texte.
      </p>
    </div>

    <div
      v-if="attackResult"
      class="space-y-1 rounded-md bg-elevated p-3"
    >
      <p class="font-medium">
        {{ attackResult.name }} : {{ exchangeText }}
      </p>
      <KnCheckLine
        label="Attaque du sbire"
        :check="attackResult.attack"
      />
      <KnCheckLine
        label="Défense de la créature"
        :check="attackResult.defense"
      />
      <template v-if="attackResult.damage && attackResult.location">
        <p class="text-sm">
          <span class="text-muted">Localisation :</span> {{ $t(`ker_nethalas.hitLocations.${attackResult.location}`) }}
        </p>
        <p class="text-sm">
          <span class="text-muted">Dégâts :</span>
          {{ attackResult.damageRoll?.dice.map(die => `D${die.sides} → ${die.roll}`).join(', ') }}{{ attackResult.damageRoll?.bonus ? `, bonus ${attackResult.damageRoll.bonus}` : '' }}
          → <span class="font-semibold">{{ attackResult.damage.damage }}</span>
          <span v-if="attackResult.damage.armorAbsorbed"> (Armure : −{{ attackResult.damage.armorAbsorbed }})</span>
        </p>
        <p
          v-if="attackResult.damage.notes.length"
          class="text-xs text-muted"
        >
          {{ attackResult.damage.notes.join(' ; ') }}
        </p>
      </template>
      <UButton
        v-if="attackResult.exchange.outcome !== 'reroll' && (attackResult.damage || attackResult.unavoidable)"
        size="sm"
        variant="soft"
        :disabled="attackResult.applied"
        @click="applyAttackNow"
      >
        {{ attackResult.applied ? 'Appliqué' : 'Appliquer à la créature' }}
      </UButton>
      <div
        v-for="(entry, index) in attackResult.reflect"
        :key="entry.label"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <UButton
          size="xs"
          variant="soft"
          color="warning"
          :disabled="entry.applied"
          @click="reflectNow(index)"
        >
          {{ entry.applied ? 'Subi' : 'Subir la riposte' }}
        </UButton>
        <span>{{ entry.label }} : {{ entry.amount }} dégâts {{ $t(`ker_nethalas.damageTypes.${entry.type}`).toLowerCase() }} à qui attaque la créature.</span>
      </div>
    </div>

    <div
      v-if="spellResult"
      class="space-y-1 rounded-md bg-elevated p-3"
    >
      <KnCheckLine
        :label="`Résistance magique de ${spellResult.name}`"
        :check="spellResult.test"
      />
      <p class="font-medium">
        {{ spellResult.damage ? 'Raté : le sort touche.' : 'Résisté : aucun effet de dégâts.' }}
      </p>
      <template v-if="spellResult.damage">
        <p class="text-sm">
          <span class="text-muted">Dégâts :</span>
          {{ spellResult.damageRoll?.dice.map(die => `D${die.sides} → ${die.roll}`).join(', ') }}{{ spellResult.damageRoll?.bonus ? `, bonus ${spellResult.damageRoll.bonus}` : '' }}
          → <span class="font-semibold">{{ spellResult.damage.damage }}</span>
        </p>
        <UButton
          size="sm"
          variant="soft"
          :disabled="spellResult.applied"
          @click="applySpellNow"
        >
          {{ spellResult.applied ? 'Appliqué' : 'Appliquer à la créature' }}
        </UButton>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knRemoveMinion } from '~~/shared/ker-nethalas/run'
import type { KnCreature, KnCreatureAction } from '~~/shared/ker-nethalas/creatures'
import { knParseDicePool } from '~~/shared/ker-nethalas/dice'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import type { KnAttackResult, KnSpellResult } from '~/composables/useKnCombat'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { combat, minions, minionSheetAt, drawMinionAction, minionAttack, minionSpell, applyAttack, applySpell, applyReflect } = useKnCombat(character, () => props.resolved, () => props.bestiary)

const who = ref(0)
const target = ref(0)
const bonus = ref(0)
const extraText = ref('')
const drawn = ref<{ d6: number, action: KnCreatureAction } | undefined>()
const attackResult = ref<KnAttackResult | undefined>()
const spellResult = ref<KnSpellResult | undefined>()

const extra = computed(() => extraText.value.trim() ? knParseDicePool(extraText.value) : [])
const extraError = computed(() => extra.value ? undefined : 'Dés illisibles : écrivez par exemple D6 ou D6+D4.')

const minionItems = computed<SelectItem[]>(() => minions.value.map((minion, index) => ({ label: `${minion.name} (${minion.health}/${minion.maxHealth})`, value: index })))
const targetItems = computed<SelectItem[]>(() =>
  (combat.value?.creatures ?? []).flatMap((creature, index) => creature.health > 0
    ? [{ label: `${creature.name} (${creature.health}/${creature.maxHealth}${creature.temporary ? ` +${creature.temporary}` : ''})`, value: index }]
    : []),
)

watch(minionItems, (items) => {
  if (!items.some(item => item.value === who.value) && items[0]) who.value = items[0].value as number
}, { immediate: true })
watch(targetItems, (items) => {
  if (!items.some(item => item.value === target.value) && items[0]) target.value = items[0].value as number
}, { immediate: true })
watch([who, target], () => {
  drawn.value = undefined
  attackResult.value = undefined
  spellResult.value = undefined
})

const canAct = computed(() => !!minionSheetAt(who.value) && targetItems.value.some(item => item.value === target.value))

function drawNow() {
  attackResult.value = undefined
  spellResult.value = undefined
  drawn.value = drawMinionAction(who.value)
}

function resolveNow() {
  const action = drawn.value?.action
  if (!action || !extra.value) return
  if (action.tag === 'magical') {
    spellResult.value = minionSpell({ minion: who.value, target: target.value, action, extra: extra.value })
    attackResult.value = undefined
  } else {
    attackResult.value = minionAttack({ minion: who.value, target: target.value, action, bonus: bonus.value, extra: extra.value })
    spellResult.value = undefined
  }
}

function applyAttackNow() {
  if (attackResult.value) applyAttack(attackResult.value)
}

function applySpellNow() {
  if (spellResult.value) applySpell(spellResult.value)
}

function reflectNow(index: number) {
  if (attackResult.value) applyReflect(attackResult.value, index)
}

function remove(index: number) {
  character.value.run = knRemoveMinion(character.value.run, index)
}

const exchangeText = computed(() => {
  const outcome = attackResult.value?.exchange
  if (!outcome) return ''
  if (outcome.outcome === 'hit') return outcome.criticalStrike ? 'touché, Coup critique' : 'touché'
  if (outcome.outcome === 'defended') return 'paré'
  if (outcome.outcome === 'bothFail') return 'les deux ratent : 1 dégât inévitable'
  return 'égalité parfaite, à relancer'
})
</script>
