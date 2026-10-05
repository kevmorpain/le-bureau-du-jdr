import type { Effect } from '~~/server/db/schema/effects'
import type { FeatureMeta, RechargeType } from '~~/server/db/schema/features'
import { evaluate } from '~~/shared/utils/formula'
import type { Formula, FormulaContext } from '~~/shared/utils/formula'
import { REST_RECHARGE_MAP } from '~~/shared/utils/rest'
import type { RestType } from '~~/shared/utils/rest'

export const RESOURCE_KEYS = ['rage', 'ki', 'sorcery_points', 'bardic_inspiration', 'channel_divinity', 'wild_shape', 'lay_on_hands'] as const
export type ResourceKey = typeof RESOURCE_KEYS[number]

export interface ResourceFeature {
  id: number
  name: string
  featureType: string
  classId?: number | null
  subclassId?: number | null
  levelRequired?: number | null
  maxUsesFormula?: Formula | null
  rechargeType?: RechargeType | null
  meta?: FeatureMeta | null
  currentUses: number
  active?: boolean
  effects: Effect[]
}

export interface OwnerClass {
  classId: number
  level: number
  subclass?: { id: number } | null
}

// La ligne `character_features` telle que la servent le GET et le chargeur serveur (feature + ses effets).
interface CharacterFeatureRow {
  featureId: number
  currentUses: number
  active?: boolean | null
  feature?: {
    name: string
    featureType: string
    classId?: number | null
    subclassId?: number | null
    levelRequired?: number | null
    maxUsesFormula?: Formula | null
    rechargeType?: RechargeType | null
    meta?: FeatureMeta | null
    featureEffects?: { effect?: object | null }[]
  } | null
}

export const resourceFeaturesOf = (rows: readonly CharacterFeatureRow[]): ResourceFeature[] =>
  rows.flatMap(({ featureId, currentUses, active, feature }) => feature
    ? [{
        id: featureId,
        name: feature.name,
        featureType: feature.featureType,
        classId: feature.classId,
        subclassId: feature.subclassId,
        levelRequired: feature.levelRequired,
        maxUsesFormula: feature.maxUsesFormula,
        rechargeType: feature.rechargeType,
        meta: feature.meta,
        currentUses,
        active: active ?? false,
        effects: (feature.featureEffects ?? []).flatMap(fe => (fe.effect ? [fe.effect as Effect] : [])),
      }]
    : [])

export const ownerClassOf = (feature: Pick<ResourceFeature, 'featureType' | 'classId' | 'subclassId'>, classes: readonly OwnerClass[]): OwnerClass | undefined => {
  if (feature.featureType === 'class_feature') return classes.find(c => c.classId === feature.classId)
  if (feature.featureType === 'subclass_feature') return classes.find(c => c.subclass?.id === feature.subclassId)
  return undefined
}

// Les formules d'une feature de classe lisent le niveau de SA classe : un Barbare 3 / Moine 5 compte ses
// rages sur 3, pas sur la classe principale.
export const featureFormulaContext = (base: FormulaContext, feature: Pick<ResourceFeature, 'featureType' | 'classId' | 'subclassId'>, classes: readonly OwnerClass[]): FormulaContext => {
  const owner = ownerClassOf(feature, classes)
  return owner ? { ...base, class_level: owner.level } : base
}

// Même garde que `featureEffectsOf` : une feature au-dessus du niveau de sa classe ne produit rien.
export const isFeatureUnlocked = (feature: Pick<ResourceFeature, 'featureType' | 'classId' | 'subclassId' | 'levelRequired'>, classes: readonly OwnerClass[]): boolean => {
  const owner = ownerClassOf(feature, classes)
  return !owner || owner.level >= (feature.levelRequired ?? 1)
}

export interface FeatureUses {
  maxUses: number | null
  unlimited: boolean
}

export const featureUses = (feature: ResourceFeature, base: FormulaContext, classes: readonly OwnerClass[]): FeatureUses => {
  const owner = ownerClassOf(feature, classes)
  const unlimitedFrom = feature.meta?.unlimitedFromClassLevel
  if (unlimitedFrom != null && owner && owner.level >= unlimitedFrom) return { maxUses: null, unlimited: true }
  return {
    maxUses: feature.maxUsesFormula ? evaluate(feature.maxUsesFormula, featureFormulaContext(base, feature, classes)) : null,
    unlimited: false,
  }
}

type EffectOf<T extends Effect['type']> = Extract<Effect, { type: T }>['value']

const unlockedEffects = (features: readonly ResourceFeature[], classes: readonly OwnerClass[]) =>
  features.filter(f => isFeatureUnlocked(f, classes))

// Effets de `meta.whileActive`, seulement tant que la feature est active et non suspendue.
const activeEffectsOf = (feature: ResourceFeature, heavyArmor: boolean): Effect[] =>
  feature.active && !(feature.meta?.suspendedByHeavyArmor && heavyArmor) ? feature.meta?.whileActive ?? [] : []

export interface WeaponDamageDice {
  name: string
  count: number
  sides: number
  damageType?: EffectOf<'weapon_damage_dice'>['damageType']
  weapons: EffectOf<'weapon_damage_dice'>['weapons']
  limit: EffectOf<'weapon_damage_dice'>['limit']
  condition?: string
  needsAdvantage?: boolean
}

export interface SlotDamage {
  name: string
  sides: number
  damageType: EffectOf<'slot_damage_dice'>['damageType']
  baseDice: number
  maxDice: number
  bonus?: EffectOf<'slot_damage_dice'>['bonus']
}

export interface BeastShape {
  maxChallenge: number
  flying: boolean
  swimming: boolean
  hours: number
}

export interface ClassTraits {
  attacksPerAction: number
  weaponDamageDice: WeaponDamageDice[]
  meleeStrengthDamageBonus: number
  criticalExtraDice: number
  slotDamage: SlotDamage[]
  beastShape: BeastShape | null
  resourceDie: Partial<Record<ResourceKey, number>>
}

export const deriveClassTraits = (
  features: readonly ResourceFeature[],
  base: FormulaContext,
  classes: readonly OwnerClass[],
  options: { heavyArmor?: boolean } = {},
): ClassTraits => {
  const traits: ClassTraits = {
    attacksPerAction: 1,
    weaponDamageDice: [],
    meleeStrengthDamageBonus: 0,
    criticalExtraDice: 0,
    slotDamage: [],
    beastShape: null,
    resourceDie: {},
  }
  let shape: BeastShape | null = null
  let challengeOverride: number | null = null

  for (const feature of unlockedEffects(features, classes)) {
    const ctx = featureFormulaContext(base, feature, classes)
    const owner = ownerClassOf(feature, classes)
    const ownerLevel = owner?.level ?? ctx.class_level
    const effects = [...feature.effects, ...activeEffectsOf(feature, options.heavyArmor ?? false)]

    for (const effect of effects) {
      switch (effect.type) {
        case 'extra_attack':
          // Multiclassage : Attaque supplémentaire ne se cumule pas entre classes.
          traits.attacksPerAction = Math.max(traits.attacksPerAction, evaluate(effect.value.attacks, ctx))
          break
        case 'weapon_damage_dice':
          traits.weaponDamageDice.push({ ...effect.value, count: evaluate(effect.value.dice, ctx) })
          break
        case 'melee_strength_damage_bonus':
          traits.meleeStrengthDamageBonus += evaluate(effect.value.amount, ctx)
          break
        case 'critical_extra_dice':
          traits.criticalExtraDice = Math.max(traits.criticalExtraDice, evaluate(effect.value.dice, ctx))
          break
        case 'slot_damage_dice':
          traits.slotDamage.push(effect.value)
          break
        case 'resource_die': {
          const key = feature.meta?.resource
          if (key) traits.resourceDie[key] = evaluate(effect.value.sides, ctx)
          break
        }
        case 'beast_shape': {
          const tier = effect.value.tiers
            .filter(t => t.fromClassLevel <= ownerLevel)
            .sort((a, b) => b.fromClassLevel - a.fromClassLevel)[0]
          if (tier) {
            shape = {
              maxChallenge: tier.maxChallenge,
              flying: tier.flying,
              swimming: tier.swimming,
              hours: Math.floor(ownerLevel / effect.value.hoursDivisor),
            }
          }
          break
        }
        case 'beast_shape_challenge':
          challengeOverride = evaluate(effect.value.maxChallenge, ctx)
          break
        default:
          break
      }
    }
  }

  if (shape) traits.beastShape = { ...shape, maxChallenge: challengeOverride ?? shape.maxChallenge }
  return traits
}

export const damageDiceAppliesToWeapon = (weapons: WeaponDamageDice['weapons'], weapon: { isRanged: boolean, isFinesse: boolean }): boolean =>
  weapons === 'melee' ? !weapon.isRanged : weapon.isRanged || weapon.isFinesse

// Châtiment divin : 2d8 au niveau 1, +1d8 par niveau au-delà ; le dé contre une cible donnée porte le plafond de 5d8 à 6d8.
export const slotDamageDiceCount = (damage: SlotDamage, slotLevel: number, bonusApplies: boolean): number => {
  const base = Math.min(damage.baseDice + (slotLevel - 1), damage.maxDice)
  if (!bonusApplies || !damage.bonus) return base
  return Math.min(base + damage.bonus.dice, damage.bonus.maxDice)
}

export interface ResourceGroup {
  key: ResourceKey
  name: string
  featureIds: number[]
  primaryId: number
  max: number | null
  spent: number
  unlimited: boolean
  pool: boolean
  rechargeType: RechargeType | null
  saveDcAbility: FeatureMeta['saveDcAbility']
  spends: NonNullable<FeatureMeta['spends']>
  // Capacités d'AUTRES features payées par cette réserve (options de Métamagie).
  costs: { featureId: number, name: string, amount: number | 'spell_level' }[]
}

const rechargeUpgrades = (features: readonly ResourceFeature[], classes: readonly OwnerClass[]) =>
  unlockedEffects(features, classes).flatMap(f => f.effects.flatMap(e => (e.type === 'resource_regain' ? [e.value] : [])))

// Un groupe par clé de réserve. `spent` se lit au plus haut des membres et s'écrit sur tous : le Conduit divin
// du Clerc et celui du Paladin forment une seule réserve, de maximum le plus haut des deux.
export const resourceGroups = (features: readonly ResourceFeature[], base: FormulaContext, classes: readonly OwnerClass[]): ResourceGroup[] => {
  const unlocked = unlockedEffects(features, classes)
  const regains = rechargeUpgrades(features, classes)
  const keys = [...new Set(unlocked.flatMap(f => (f.meta?.resource ? [f.meta.resource] : [])))]

  return keys.map((key) => {
    const members = unlocked
      .filter(f => f.meta?.resource === key)
      .map(feature => ({ feature, uses: featureUses(feature, base, classes) }))
      .sort((a, b) => (b.uses.maxUses ?? -1) - (a.uses.maxUses ?? -1) || a.feature.id - b.feature.id)
    const primary = members[0]!.feature
    const maxes = members.flatMap(m => (m.uses.maxUses == null ? [] : [m.uses.maxUses]))
    const refillsOnShortRest = regains.some(r => r.resource === key && r.amount === 'all' && r.on === 'short_rest')

    return {
      key,
      name: primary.name,
      featureIds: members.map(m => m.feature.id),
      primaryId: primary.id,
      max: maxes.length ? Math.max(...maxes) : null,
      spent: Math.max(...members.map(m => m.feature.currentUses)),
      unlimited: members.some(m => m.uses.unlimited),
      pool: members.some(m => m.feature.meta?.pool),
      rechargeType: refillsOnShortRest ? 'short_rest' : primary.rechargeType ?? null,
      saveDcAbility: members.find(m => m.feature.meta?.saveDcAbility)?.feature.meta?.saveDcAbility,
      spends: members.flatMap(m => (m.feature.meta?.spends ?? [])
        .filter(s => (ownerClassOf(m.feature, classes)?.level ?? 0) >= (s.minClassLevel ?? 0))),
      costs: unlocked.flatMap(f => (f.meta?.cost?.resource === key ? [{ featureId: f.id, name: f.name, amount: f.meta.cost.amount }] : [])),
    }
  })
}

export interface RestRecovery {
  reset: number[]
  regain: { featureId: number, amount: number }[]
}

// Ce qu'un repos rend, partagé par le serveur (autorité) et le client (affichage immédiat) :
// la remise à zéro habituelle (`rechargeType`) plus les rendus que les effets `resource_regain` déclarent.
export const restRecovery = (features: readonly ResourceFeature[], classes: readonly OwnerClass[], rest: RestType): RestRecovery => {
  const recharging = REST_RECHARGE_MAP[rest]
  const reset = new Set(features.filter(f => f.rechargeType && recharging.includes(f.rechargeType)).map(f => f.id))
  const regain: RestRecovery['regain'] = []

  for (const source of unlockedEffects(features, classes)) {
    for (const effect of source.effects) {
      if (effect.type !== 'resource_regain' || !recharging.includes(effect.value.on)) continue
      for (const target of features.filter(f => f.meta?.resource === effect.value.resource)) {
        if (effect.value.amount === 'all') reset.add(target.id)
        else regain.push({ featureId: target.id, amount: effect.value.amount })
      }
    }
  }
  return { reset: [...reset], regain: regain.filter(r => !reset.has(r.featureId)) }
}
