<template>
  <div class="space-y-3 rounded-md border border-default p-3">
    <h3 class="font-medium">
      Attaque du survivant
    </h3>

    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Cible">
        <USelect
          v-model="target"
          :items="targetItems"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Arme">
        <USelect
          v-model="weaponId"
          :items="weaponItems"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Compétence d'arme">
        <USelect
          v-model="skill"
          :items="skillItems"
          class="w-full"
        />
      </UFormField>
      <KnNumberField
        v-model="bonus"
        label="Bonus ou malus à l'attaque"
        :min="-99"
        :max="99"
      />
      <KnNumberField
        v-model="speed"
        label="Vitesse de l'arme (retirée à la défense)"
        :min="0"
        :max="99"
      />
      <UFormField
        label="Réserve de dégâts"
        description="Format : D6, 2D8+1 ou D6+D4+2"
        :error="poolError"
      >
        <UInput
          v-model="poolText"
          placeholder="D6"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Type de dégâts">
        <USelect
          v-model="damageType"
          :items="damageItems"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-center gap-4 text-sm">
      <UCheckbox
        v-if="hasWeakSpot"
        v-model="aim"
        label="Viser le point faible (Désavantage)"
      />
      <UCheckbox
        v-model="magical"
        label="Attaque magique"
      />
      <span
        v-if="surprise"
        class="text-success"
      >Surprise : +{{ KN_SURPRISE_BONUS }} à cette attaque</span>
    </div>

    <UButton
      icon="i-heroicons:cube"
      :disabled="!canAttack"
      @click="attackNow"
    >
      Attaquer
    </UButton>

    <div
      v-if="result"
      class="space-y-1 rounded-md bg-elevated p-3"
    >
      <p class="font-medium">
        {{ result.name }} : {{ outcomeText }}
      </p>
      <KnCheckLine
        label="Attaque"
        :check="result.attack"
      />
      <KnCheckLine
        label="Défense"
        :check="result.defense"
      />
      <p
        v-if="result.monsterMove"
        class="text-sm"
      >
        <span class="font-medium">Mouvement défensif de la créature (D10 : {{ result.monsterMove }})</span> :
        {{ moveText('monsterDefensiveMoves', result.monsterMove) }}
      </p>
      <p
        v-if="result.fumble"
        class="text-sm"
      >
        <span class="font-medium">Maladresse (D10 : {{ result.fumble }})</span> : {{ $t(`ker_nethalas.fumbles.f${result.fumble}`) }}
      </p>
      <template v-if="result.damage && result.location">
        <p class="text-sm">
          <span class="text-muted">Localisation :</span> {{ $t(`ker_nethalas.hitLocations.${result.location}`) }}
          <span v-if="result.weakSpot"> (point faible : dégâts doublés)</span>
        </p>
        <p class="text-sm">
          <span class="text-muted">Dégâts :</span>
          {{ result.damageRoll?.dice.map(die => `D${die.sides} → ${die.roll}`).join(', ') }}{{ result.damageRoll?.bonus ? `, bonus ${result.damageRoll.bonus}` : '' }}
          → <span class="font-semibold">{{ result.damage.damage }}</span>
          <span v-if="result.damage.armorAbsorbed"> (Armure : −{{ result.damage.armorAbsorbed }})</span>
          <span v-if="result.damage.heal"> (la créature récupère {{ result.damage.heal }})</span>
        </p>
        <UButton
          v-if="result.reroll"
          size="xs"
          variant="outline"
          icon="i-heroicons:arrow-path"
          :disabled="result.reroll.used || result.applied"
          @click="rerollDamage(result)"
        >
          {{ result.reroll.used ? 'Dégâts relancés' : 'Relancer les dégâts (Atout)' }}
        </UButton>
        <p
          v-if="result.damage.notes.length"
          class="text-xs text-muted"
        >
          {{ result.damage.notes.join(' ; ') }}
        </p>
      </template>
      <UButton
        v-if="result.exchange.outcome !== 'reroll' && (result.damage || result.unavoidable)"
        size="sm"
        variant="soft"
        :disabled="result.applied"
        @click="apply"
      >
        {{ result.applied ? 'Appliqué' : 'Appliquer à la créature' }}
      </UButton>
      <div
        v-for="(entry, index) in result.reflect"
        :key="entry.label"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <UButton
          size="xs"
          variant="soft"
          color="warning"
          :disabled="entry.applied"
          @click="applyReflect(result, index)"
        >
          {{ entry.applied ? 'Subi' : 'Subir la riposte' }}
        </UButton>
        <span>{{ entry.label }} : {{ entry.amount }} dégâts {{ $t(`ker_nethalas.damageTypes.${entry.type}`).toLowerCase() }} à qui attaque la créature.</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_DAMAGE_TYPES, type KnDamageType } from '~~/shared/ker-nethalas/catalog/damageTypes'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import { knParseDicePool } from '~~/shared/ker-nethalas/dice'
import { knAttackOptions } from '~~/shared/ker-nethalas/equipment'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_WEAPON_SKILL_KEYS, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
import type { KnAttackResult } from '~/composables/useKnCombat'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const { combat, creatureOf, attack, rerollDamage, applyAttack, applyReflect, moveText } = useKnCombat(character, () => props.resolved, () => props.bestiary)

const KN_SURPRISE_BONUS = 20

const target = ref(0)
const bonus = ref(0)
const attackOptions = computed(() => knAttackOptions(character.value.inventory, character.value.levelBenefits))
const weaponId = ref(attackOptions.value[0]!.id)
const weaponBonus = ref(0)
const skill = ref<KnSkillKey>(attackOptions.value[0]!.skill)
const speed = ref(attackOptions.value[0]!.speed)
const poolText = ref(attackOptions.value[0]!.pool)
const damageType = ref<KnDamageType>(attackOptions.value[0]!.damageType)
const weaponItems = computed<SelectItem[]>(() => attackOptions.value.map(option => ({ label: option.weapon ?? 'Mains nues', value: option.id })))
const aim = ref(false)
const magical = ref(false)
const result = ref<KnAttackResult | undefined>()

// Choisir une arme règle la compétence, la Vitesse, la réserve de dégâts et le type ; ces champs restent modifiables.
function applyWeapon(id: string) {
  const option = attackOptions.value.find(entry => entry.id === id) ?? attackOptions.value[0]!
  weaponId.value = option.id
  skill.value = option.skill
  speed.value = option.speed
  poolText.value = option.pool
  damageType.value = option.damageType
  weaponBonus.value = option.bonus
}

watch(weaponId, applyWeapon)
watch(() => JSON.stringify(attackOptions.value), () => applyWeapon(weaponId.value), { immediate: true })

const pool = computed(() => knParseDicePool(poolText.value))
const surprise = computed(() => !!combat.value?.surprise)
const poolError = computed(() => poolText.value.trim() && !pool.value ? 'Réserve illisible : écrivez par exemple D6, 2D8+1 ou D6+D4.' : undefined)

const targetItems = computed<SelectItem[]>(() =>
  (combat.value?.creatures ?? []).flatMap((creature, index) => creature.health > 0
    ? [{ label: `${creature.name} (${creature.health}/${creature.maxHealth}${creature.temporary ? ` +${creature.temporary}` : ''})`, value: index }]
    : []),
)
const skillItems = KN_WEAPON_SKILL_KEYS.map(key => ({ label: t(`ker_nethalas.skills.${key}`), value: key }))
const damageItems = KN_DAMAGE_TYPES.map(key => ({ label: t(`ker_nethalas.damageTypes.${key}`), value: key }))

// Une cible qui n'est plus en vie se remplace par la première qui l'est.
watch(targetItems, (items) => {
  if (!items.some(item => item.value === target.value) && items[0]) target.value = items[0].value as number
}, { immediate: true })

const hasWeakSpot = computed(() => !!creatureOf(target.value)?.hitLocation?.weakSpot)
const canAttack = computed(() => !!pool.value && targetItems.value.some(item => item.value === target.value) && !!creatureOf(target.value))

function attackNow() {
  if (!pool.value) return
  result.value = attack({
    index: target.value,
    skill: skill.value,
    bonus: bonus.value + weaponBonus.value + (surprise.value ? KN_SURPRISE_BONUS : 0),
    speed: speed.value,
    pool: pool.value,
    damageType: damageType.value,
    aim: aim.value && hasWeakSpot.value,
    magical: magical.value,
  })
}

function apply() {
  if (result.value) applyAttack(result.value)
}

const outcomeText = computed(() => {
  const outcome = result.value?.exchange
  if (!outcome) return ''
  if (outcome.outcome === 'hit') return outcome.criticalStrike ? 'touché, Coup critique' : 'touché'
  if (outcome.outcome === 'defended') return 'paré'
  if (outcome.outcome === 'bothFail') return 'les deux ratent : 1 dégât inévitable'
  return 'égalité parfaite, à relancer'
})
</script>
