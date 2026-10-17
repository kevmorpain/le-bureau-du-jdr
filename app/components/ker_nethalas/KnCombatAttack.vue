<template>
  <div class="space-y-3 rounded-md border border-default p-3">
    <h3 class="font-medium">
      Attaque du survivant
    </h3>

    <div
      v-if="dualPair"
      class="space-y-1"
    >
      <div class="flex flex-wrap items-center gap-3">
        <UCheckbox
          :model-value="!!dualActive"
          label="Combat à deux armes"
          @update:model-value="toggleDual"
        />
        <USelect
          v-if="dualActive"
          :model-value="combat?.dual"
          :items="dualItems"
          class="w-56"
          aria-label="Arme dominante"
          @update:model-value="chooseDominant"
        />
      </div>
      <p class="text-xs text-muted">
        À choisir au début du combat : toutes les attaques à {{ KN_DUAL_WIELD.attack }}, +{{ KN_DUAL_WIELD.damage }} dégât et une Parade gratuite par
        round ; seuls les Traits et les effets de l'arme dominante comptent.
      </p>
    </div>

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

    <div
      v-if="sustainedAbilities.length || attackAbilities.length || markAbilities.length"
      class="space-y-2 rounded-md bg-elevated p-3 text-sm"
    >
      <p class="font-medium">
        Aptitudes
      </p>
      <p
        v-for="entry in sustainedAbilities"
        :key="entry.id"
        class="text-success"
      >
        {{ entry.ability.name }} (Maintenue) : {{ attackText(entry.attack) }}
      </p>
      <div
        v-for="entry in attackAbilities"
        :key="entry.id"
        class="space-y-0.5"
      >
        <UCheckbox
          :model-value="picked.includes(entry.id)"
          :label="`${entry.ability.name} (${entry.masteryName})`"
          :disabled="!picked.includes(entry.id) && abilityBlockers(entry).length > 0"
          @update:model-value="pick(entry.id, $event)"
        />
        <p class="pl-6 text-xs text-muted">
          {{ attackText(entry.attack) }}{{ knCostSummary(entry.ability) ? ` · ${knCostSummary(entry.ability)}` : '' }}{{ entry.ability.limit ? ` · ${knUseLimitLabel[entry.ability.limit]}` : '' }}
          <span
            v-if="abilityBlockers(entry).length"
            class="text-error"
          > · {{ abilityBlockers(entry)[0] }}</span>
        </p>
      </div>
      <div
        v-for="entry in markAbilities"
        :key="entry.id"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="flex-1">{{ entry.ability.name }} ({{ entry.masteryName }}) : {{ attackText(entry.attack) }}, une fois par adversaire</span>
        <UButton
          size="xs"
          variant="soft"
          :disabled="!canMark(entry)"
          @click="markNow(entry)"
        >
          {{ markedTarget ? 'Déjà marquée' : 'Marquer la cible' }}
        </UButton>
      </div>
    </div>

    <UButton
      icon="i-heroicons:cube"
      :disabled="!canAttack"
      @click="attackNow"
    >
      Attaquer
    </UButton>

    <div
      v-for="(shot, shotIndex) in shots"
      :key="shotIndex"
      class="space-y-1 rounded-md bg-elevated p-3"
    >
      <p class="font-medium">
        {{ shot.followUp ? 'Seconde attaque gratuite · ' : '' }}{{ shot.name }} : {{ outcomeText(shot) }}
      </p>
      <KnCheckLine
        label="Attaque"
        :check="shot.attack"
      />
      <p
        v-if="shot.undefended"
        class="text-sm"
      >
        <span class="text-muted">Défense :</span> la cible ne peut pas se défendre.
      </p>
      <KnCheckLine
        v-else
        label="Défense"
        :check="shot.defense"
      />
      <p
        v-if="shot.monsterMove"
        class="text-sm"
      >
        <span class="font-medium">Mouvement défensif de la créature (D10 : {{ shot.monsterMove }})</span> :
        {{ moveText('monsterDefensiveMoves', shot.monsterMove) }}
      </p>
      <div
        v-if="shot.lampSpilled"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <span><span class="font-medium">Maladresse</span> : la lampe posée se renverse, l'huile se répand et vous êtes Aveuglé.</span>
        <UButton
          size="xs"
          variant="soft"
          :disabled="shot.lampSpillApplied"
          @click="spillLamp(shot)"
        >
          {{ shot.lampSpillApplied ? 'Appliqué' : 'Appliquer : plus de lumière' }}
        </UButton>
      </div>
      <p
        v-if="shot.fumble"
        class="text-sm"
      >
        <span class="font-medium">Maladresse (D10 : {{ shot.fumble }})</span> : {{ $t(`ker_nethalas.fumbles.f${shot.fumble}`) }}
      </p>
      <template v-if="shot.damage && shot.location">
        <p class="text-sm">
          <span class="text-muted">Localisation :</span> {{ $t(`ker_nethalas.hitLocations.${shot.location}`) }}
          <span v-if="shot.weakSpot"> (point faible : dégâts doublés)</span>
        </p>
        <p class="text-sm">
          <span class="text-muted">Dégâts :</span>
          {{ shot.damageRoll?.dice.map(die => `D${die.sides}${die.type ? ` ${damageName(die.type)}` : ""} → ${die.roll}`).join(', ') }}{{ shot.damageRoll?.bonus ? `, bonus ${shot.damageRoll.bonus}` : '' }}
          → <span class="font-semibold">{{ shot.damage.damage }}</span>
          <span v-if="shot.damageRoll?.pickedType">{{ ` ${damageName(shot.damageRoll.pickedType)}` }}</span>
          <span v-if="shot.damage.armorAbsorbed"> (Armure : −{{ shot.damage.armorAbsorbed }})</span>
          <span v-if="shot.damage.heal"> (la créature récupère {{ shot.damage.heal }})</span>
        </p>
        <UButton
          v-if="shot.reroll"
          size="xs"
          variant="outline"
          icon="i-heroicons:arrow-path"
          :disabled="shot.reroll.used || shot.applied"
          @click="rerollDamage(shot)"
        >
          {{ shot.reroll.used ? 'Dégâts relancés' : 'Relancer les dégâts (Atout)' }}
        </UButton>
        <p
          v-if="shot.damage.notes.length"
          class="text-xs text-muted"
        >
          {{ shot.damage.notes.join(' ; ') }}
        </p>
      </template>
      <UButton
        v-if="shot.exchange.outcome !== 'reroll' && (shot.damage || shot.unavoidable)"
        size="sm"
        variant="soft"
        :disabled="shot.applied"
        @click="apply(shot)"
      >
        {{ shot.applied ? 'Appliqué' : 'Appliquer à la créature' }}
      </UButton>
      <div
        v-for="(entry, index) in shot.reflect"
        :key="entry.label"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <UButton
          size="xs"
          variant="soft"
          color="warning"
          :disabled="entry.applied"
          @click="applyReflect(shot, index)"
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
import {
  knAttackAbilities,
  knAttackAbilityBlockers,
  knAttackPlan,
  knMarkAbilities,
  knSpendAttackAbilities,
  knSustainedAttackAbilities,
  type KnAttackAbility,
} from '~~/shared/ker-nethalas/abilityAttack'
import { knMasteryEntries } from '~~/shared/ker-nethalas/amulets'
import { KN_DAMAGE_TYPES, type KnDamageType } from '~~/shared/ker-nethalas/catalog/damageTypes'
import type { KnCreature } from '~~/shared/ker-nethalas/creatures'
import { knDiceLabel, knParseDicePool } from '~~/shared/ker-nethalas/dice'
import { KN_DUAL_WIELD, knAttackOptions, knDualPair } from '~~/shared/ker-nethalas/equipment'
import type { KnAbilityAttack, KnMastery } from '~~/shared/ker-nethalas/masteries'
import { knCostSummary, knUseLimitLabel } from '~~/shared/ker-nethalas/masteryEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { KN_WEAPON_SKILL_KEYS, type KnSkillKey } from '~~/shared/ker-nethalas/skills'
import type { KnAttackResult } from '~/composables/useKnCombat'

const props = defineProps<{
  resolved: KnResolvedSheet
  bestiary: KnCreature[] | null
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const { combat, creatureOf, attackWithAbilities, markCreature, rerollDamage, setDual, spillLamp, applyAttack, applyReflect, moveText } = useKnCombat(character, () => props.resolved, () => props.bestiary)

const KN_SURPRISE_BONUS = 20

const target = ref(0)
const bonus = ref(0)
const attackOptions = computed(() => knAttackOptions(character.value.inventory, character.value.levelBenefits, character.value.goalEffects, combat.value?.dual))
const dualPair = computed(() => knDualPair(character.value.inventory))
const dualActive = computed(() => dualPair.value?.some(item => item.id === combat.value?.dual))
const dualItems = computed<SelectItem[]>(() => (dualPair.value ?? []).map(item => ({ label: item.name, value: item.id })))

function toggleDual(on: boolean | 'indeterminate') {
  setDual(on === true && dualPair.value ? dualPair.value[0].id : null)
}

function chooseDominant(id: unknown) {
  if (typeof id === 'string') setDual(id)
}
const weaponId = ref(attackOptions.value[0]!.id)
const weaponBonus = ref(0)
const skill = ref<KnSkillKey>(attackOptions.value[0]!.skill)
const speed = ref(attackOptions.value[0]!.speed)
const poolText = ref(attackOptions.value[0]!.pool)
const damageType = ref<KnDamageType>(attackOptions.value[0]!.damageType)
const weaponItems = computed<SelectItem[]>(() => attackOptions.value.map(option => ({ label: option.weapon ?? 'Mains nues', value: option.id })))
const aim = ref(false)
const magical = ref(false)
const shots = ref<KnAttackResult[]>([])

const masteryEntries = computed(() => knMasteryEntries(character.value.masteryPicks, character.value.amulets))
const attackAbilities = computed(() => props.masteries ? knAttackAbilities(props.masteries, masteryEntries.value) : [])
const markAbilities = computed(() => props.masteries ? knMarkAbilities(props.masteries, masteryEntries.value) : [])
const sustainedAbilities = computed(() => props.masteries
  ? knSustainedAttackAbilities(props.masteries, masteryEntries.value, character.value.status.sustained ?? [])
  : [])
const picked = ref<string[]>([])

const purse = computed(() => ({
  aetherCurrent: character.value.aetherCurrent,
  healthCurrent: character.value.healthCurrent,
  exhaustion: character.value.exhaustion,
}))
const abilityBlockers = (entry: KnAttackAbility) => knAttackAbilityBlockers(entry, purse.value, character.value.status)

function pick(id: string, on: boolean | 'indeterminate') {
  picked.value = on === true ? [...picked.value, id] : picked.value.filter(other => other !== id)
}

const damageName = (type: string) => t(`ker_nethalas.damageTypes.${type}`).toLowerCase()
const signed = (value: number) => value > 0 ? `+${value}` : String(value)

function attackText(attack: KnAbilityAttack) {
  const dice = (list: NonNullable<KnAbilityAttack['dice']>) =>
    list.map(entry => `${entry.dice.count === 0 ? signed(entry.dice.bonus) : knDiceLabel(entry.dice)}${entry.type ? ` ${damageName(entry.type)}` : ''}`).join(' + ')
  return [
    attack.bonus ? `${signed(attack.bonus)} à l'attaque` : '',
    attack.pool ? `réserve de dégâts : ${dice(attack.pool)}` : '',
    attack.dice ? `${dice(attack.dice)} à la réserve de dégâts` : '',
    attack.critical ? 'une touche est un Coup critique' : '',
    attack.undefendable ? 'la cible ne se défend pas' : '',
    attack.allTargets ? 'une attaque contre chaque adversaire' : '',
    attack.followUp ? `seconde attaque gratuite si elle touche${attack.followUp.dice ? ` (${dice(attack.followUp.dice)})` : ''}` : '',
    attack.afterDefense ? `prochain test défensif ${signed(attack.afterDefense)}` : '',
    attack.noDefense ? 'plus de défense jusqu\'à votre prochaine attaque' : '',
  ].filter(Boolean).join(', ')
}

const markedTarget = computed(() => !!combat.value?.creatures[target.value]?.mark)
const canMark = (entry: KnAttackAbility) => !markedTarget.value && abilityBlockers(entry).length === 0 && !!creatureOf(target.value)

function spend(entries: readonly KnAttackAbility[]) {
  if (!entries.length) return
  const spent = knSpendAttackAbilities(entries, purse.value, character.value.status)
  character.value.aetherCurrent = spent.purse.aetherCurrent
  character.value.healthCurrent = spent.purse.healthCurrent
  character.value.exhaustion = spent.purse.exhaustion
  character.value.status = spent.status
}

function markNow(entry: KnAttackAbility) {
  if (canMark(entry) && markCreature(target.value, entry.attack)) spend([entry])
}

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

// Les aptitudes cochées se paient à l'attaque lancée, réussie ou non ; celles qui sont Maintenues ont déjà été payées.
function attackNow() {
  if (!pool.value) return
  const chosen = attackAbilities.value.filter(entry => picked.value.includes(entry.id))
  const plan = knAttackPlan([...sustainedAbilities.value, ...chosen])
  spend(chosen)
  picked.value = []
  shots.value = attackWithAbilities({
    index: target.value,
    skill: skill.value,
    bonus: bonus.value + weaponBonus.value + (surprise.value ? KN_SURPRISE_BONUS : 0),
    speed: speed.value,
    pool: pool.value,
    damageType: damageType.value,
    aim: aim.value && hasWeakSpot.value,
    magical: magical.value,
  }, plan)
}

function apply(shot: KnAttackResult) {
  applyAttack(shot)
}

function outcomeText(shot: KnAttackResult) {
  const outcome = shot.exchange
  if (outcome.outcome === 'hit') return outcome.criticalStrike ? 'touché, Coup critique' : 'touché'
  if (outcome.outcome === 'defended') return 'paré'
  if (outcome.outcome === 'bothFail') return 'les deux ratent : 1 dégât inévitable'
  return 'égalité parfaite, à relancer'
}
</script>
