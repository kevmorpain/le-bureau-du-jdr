import type { WeaponProperties } from '~~/server/db/schema/items'
import { SpellComponent } from '~~/server/db/schema/spells'
import type { ActionCost } from '~~/shared/rules/actionCost'
import { resolveDamageDie, resolveHealDie, type CastLevels } from '~~/shared/rules/spellScaling'
import { weaponCategoryLabels, weaponPropertyLabels } from '~~/shared/utils/item'
import type { PlayCard } from '~/utils/playCards'
import type { CharacterSpellWithSpell, SlotType } from './useCharacterSpells'
import type { SlotsByType } from './useCharacterSpellcasting'
import type { PlayCardSource } from './usePlayCards'
import type { useSpellCasting } from './useSpellCasting'

type CharacterSheetApi = ReturnType<typeof useCharacterSheet>
type PlayCardDetailsDeps = Pick<CharacterSheetApi, 'statsForSpell' | 'characterLevel'> & {
  spellSlots: Ref<SlotsByType>
  spellCasting: Pick<ReturnType<typeof useSpellCasting>, 'isAttackSpell' | 'isArcanumSpell' | 'canRitual' | 'getCastLevel'>
}

type TaggedCost = Exclude<ActionCost, 'other'>

export type PlayFactIcon = 'range' | 'attack' | 'save' | 'damage' | 'concentration' | 'ritual' | 'recharge'

export interface PlayFact {
  icon: PlayFactIcon
  text: string
  damageType?: string
}

export interface PlayTile {
  label: string
  value: string
  cost?: TaggedCost
  suffix?: string
  damageType?: string
}

export interface PlaySlotOption {
  key: string
  slotType: SlotType
  level: number
  label: string
  max: number
  current: number
  effect: string
}

export type PlayActionKey = 'cast-slot' | 'cast-cantrip' | 'cast-arcanum' | 'cast-ritual' | 'spell-damage' | 'attack' | 'damage' | 'offhand-damage' | 'use'

export interface PlayAction {
  key: PlayActionKey
  label: string
  detail?: string
  variant: 'primary' | 'secondary'
  isDisabled: boolean
}

export interface PlayDetail {
  typeLabel: string
  badges: string[]
  subtitle: string
  tiles: PlayTile[]
  components: { verbal: boolean, somatic: boolean, material: boolean, materialText: string | null } | null
  properties: string[]
  description: string | null
  usesLabel: string | null
  slotOptions: PlaySlotOption[]
}

export const usePlayCardDetails = ({ statsForSpell, characterLevel, spellSlots, spellCasting }: PlayCardDetailsDeps) => {
  const { t } = useI18n()
  const { previewAt } = useSpellEffectPreview()

  const getCostTag = (card: PlayCard): TaggedCost | undefined =>
    card.cost === 'other' ? undefined : card.cost

  const getSpellRange = (spell: CharacterSpellWithSpell['spell']): string =>
    spell.areaOfEffect ? areaLabel(spell.areaOfEffect) : formatRange(spell.range)

  const getSpellEffects = (spell: CharacterSpellWithSpell['spell'], levels: CastLevels): PlayFact[] => {
    const facts: PlayFact[] = []
    for (const damage of spell.damages ?? []) {
      const die = resolveDamageDie(damage, levels)
      if (die) facts.push({ icon: 'damage', text: `${die} ${t(`damage_types.${damage.damage_type}`, 1)}`, damageType: damage.damage_type })
    }
    const healDie = spell.heal ? resolveHealDie(spell.heal, levels) : undefined
    if (spell.heal && healDie) facts.push({ icon: 'damage', text: `${healDie} ${t(`heal_types.${spell.heal.heal_type}`, 2)}`, damageType: 'heal' })
    return facts
  }

  const getSpellCheck = (characterSpell: CharacterSpellWithSpell): PlayFact | null => {
    const stats = statsForSpell(characterSpell)
    const { spell } = characterSpell
    if (spell.attackType && stats) return { icon: 'attack', text: formatModifier(stats.attackBonus) }
    if (spell.dc) {
      const ability = t(`sheet.rail.abilities.${spell.dc.ability}`)
      return { icon: 'save', text: stats ? t('sheet.play.save_dc', { ability, dc: stats.dc }) : ability }
    }
    return null
  }

  const getWeaponDamage = (weapon: Extract<PlayCardSource, { kind: 'weapon' }>['weapon']): string => {
    const bonus = weapon.damageBonus ? ` ${formatModifier(weapon.damageBonus).replace(/^([+-])/, '$1 ')}` : ''
    return `${weapon.damageDice}${bonus} ${t(`damage_types.${weapon.damageType}`, 1)}`
  }

  const getRechargeLabel = (card: PlayCard): string | null =>
    card.rechargeType ? t(`sheet.play.recharge.${card.rechargeType}`) : null

  const getCardFacts = (card: PlayCard, source: PlayCardSource): PlayFact[] => {
    switch (source.kind) {
      case 'spell': {
        const { spell } = source.characterSpell
        const levels = { characterLevel: characterLevel.value, slotLevel: spellCasting.getCastLevel(source.characterSpell) }
        const check = getSpellCheck(source.characterSpell)
        return [
          { icon: 'range', text: getSpellRange(spell) },
          ...(check ? [check] : []),
          ...(spell.concentration ? [{ icon: 'concentration' as const, text: t('sheet.play.concentration') }] : []),
          ...getSpellEffects(spell, levels),
        ]
      }
      case 'weapon':
        return [
          ...(source.weapon.rangeText ? [{ icon: 'range' as const, text: source.weapon.rangeText }] : []),
          { icon: 'attack', text: formatModifier(source.weapon.attackBonus) },
          { icon: 'damage', text: getWeaponDamage(source.weapon), damageType: source.weapon.damageType },
        ]
      default: {
        const recharge = getRechargeLabel(card)
        return recharge ? [{ icon: 'recharge', text: recharge }] : []
      }
    }
  }

  const getSlotLabel = (slotType: SlotType, level: number): string =>
    t(slotType === 'pact_magic' ? 'sheet.play.slot.pact' : 'sheet.play.slot.level', { level })

  const getSlotOptions = (characterSpell: CharacterSpellWithSpell): PlaySlotOption[] => {
    const { spell } = characterSpell
    if (spell.level === 0 || spellCasting.isArcanumSpell(characterSpell)) return []
    return (['pact_magic', 'spellcasting'] as const).flatMap(slotType =>
      Object.entries(spellSlots.value[slotType])
        .map(([level, slot]) => ({ level: Number(level), slot }))
        .filter(({ level, slot }) => level >= spell.level && slot.max > 0)
        .map(({ level, slot }) => ({
          key: `${slotType}-${level}`,
          slotType,
          level,
          label: getSlotLabel(slotType, level),
          max: slot.max,
          current: slot.current,
          effect: previewAt(spell, level),
        })))
  }

  const getUsesLabel = (card: PlayCard): string | null => {
    if (!card.uses) return null
    const count = t('ds.count_of', { value: card.uses.remaining, max: card.uses.max })
    const recharge = getRechargeLabel(card)
    return recharge ? t('sheet.play.uses_with_recharge', { count, recharge }) : count
  }

  const getSpellDetail = (card: PlayCard, characterSpell: CharacterSpellWithSpell): PlayDetail => {
    const { spell } = characterSpell
    const levels = { characterLevel: characterLevel.value, slotLevel: spellCasting.getCastLevel(characterSpell) }
    const check = getSpellCheck(characterSpell)
    const school = (spell as { school?: { name: string } | null }).school?.name
    return {
      typeLabel: t('sheet.play.kinds.spell'),
      badges: [spell.level === 0 ? t('sheet.play.cantrip') : t('sheet.play.spell_level', { level: spell.level })],
      subtitle: school ? t(`schools.${school}`) : '',
      tiles: [
        { label: t('sheet.play.tiles.casting_time'), value: spell.castingTime, cost: getCostTag(card) },
        { label: spell.areaOfEffect ? t('sheet.play.tiles.area') : t('sheet.play.tiles.range'), value: getSpellRange(spell) },
        { label: t('sheet.play.tiles.duration'), value: spell.duration },
        ...(spell.concentration ? [{ label: t('sheet.play.concentration'), value: t('sheet.play.yes') }] : []),
        ...(check?.icon === 'attack' ? [{ label: t('sheet.play.tiles.attack'), value: check.text }] : []),
        ...(check?.icon === 'save' ? [{ label: t('sheet.play.tiles.save'), value: check.text }] : []),
        ...getSpellEffects(spell, levels).map(effect => ({
          label: effect.damageType === 'heal' ? t('sheet.play.tiles.healing') : t('sheet.play.tiles.damage'),
          value: effect.text,
          damageType: effect.damageType,
        })),
      ],
      components: {
        verbal: spell.components.includes(SpellComponent.Vocal),
        somatic: spell.components.includes(SpellComponent.Somatic),
        material: spell.components.includes(SpellComponent.Material),
        materialText: spell.material ?? null,
      },
      properties: [],
      description: spell.description ?? null,
      usesLabel: getUsesLabel(card),
      slotOptions: getSlotOptions(characterSpell),
    }
  }

  const getDetail = (card: PlayCard, source: PlayCardSource): PlayDetail => {
    const base = { badges: [], components: null, properties: [], usesLabel: getUsesLabel(card), slotOptions: [] }
    switch (source.kind) {
      case 'spell':
        return getSpellDetail(card, source.characterSpell)
      case 'weapon': {
        const properties = source.entry?.item?.properties as WeaponProperties | undefined
        return {
          ...base,
          typeLabel: t('sheet.play.kinds.weapon'),
          subtitle: properties ? weaponCategoryLabels[properties.weapon_category] ?? '' : '',
          tiles: [
            { label: t('sheet.play.tiles.attack'), value: formatModifier(source.weapon.attackBonus), cost: 'action' },
            { label: t('sheet.play.tiles.damage'), value: getWeaponDamage(source.weapon), damageType: source.weapon.damageType },
            ...(source.weapon.rangeText ? [{ label: t('sheet.play.tiles.range'), value: source.weapon.rangeText }] : []),
          ],
          properties: source.weapon.properties.map(property => weaponPropertyLabels[property] ?? property),
          description: source.entry?.item?.description ?? null,
        }
      }
      case 'feature':
        return {
          ...base,
          typeLabel: t('sheet.play.kinds.feature'),
          subtitle: source.feature.origin.label,
          tiles: [
            { label: t('sheet.play.tiles.cost'), value: card.cost === 'other' ? t('sheet.play.no_cost') : t(`sheet.play.costs.${card.cost}`), cost: getCostTag(card) },
            ...(card.rechargeType ? [{ label: t('sheet.play.tiles.recharge'), value: getRechargeLabel(card)! }] : []),
          ],
          description: source.feature.description ?? null,
        }
      case 'item':
        return {
          ...base,
          typeLabel: t('sheet.play.kinds.item'),
          subtitle: '',
          tiles: card.rechargeType ? [{ label: t('sheet.play.tiles.recharge'), value: getRechargeLabel(card)! }] : [],
          description: source.entry.item?.description ?? null,
        }
    }
  }

  const getActions = (card: PlayCard, source: PlayCardSource, slot: PlaySlotOption | null): PlayAction[] => {
    switch (source.kind) {
      case 'spell': {
        const characterSpell = source.characterSpell
        const actions: PlayAction[] = []
        if (card.spellLevel === 0) {
          actions.push({ key: 'cast-cantrip', label: t('sheet.play.actions.cast'), detail: t('sheet.play.actions.no_slot'), variant: 'primary', isDisabled: false })
        } else if (card.resource === 'arcanum') {
          actions.push({ key: 'cast-arcanum', label: t('sheet.play.actions.cast'), detail: t('sheet.play.actions.arcanum'), variant: 'primary', isDisabled: !card.isAvailable })
        } else {
          actions.push({
            key: 'cast-slot',
            label: t('sheet.play.actions.cast'),
            detail: slot?.label,
            variant: 'primary',
            isDisabled: !slot || slot.current === 0,
          })
        }
        if (spellCasting.canRitual(characterSpell)) {
          actions.push({ key: 'cast-ritual', label: t('sheet.play.actions.cast_ritual'), detail: t('sheet.play.actions.no_slot'), variant: 'secondary', isDisabled: false })
        }
        if (spellCasting.isAttackSpell(characterSpell) && characterSpell.spell.damages?.length) {
          actions.push({ key: 'spell-damage', label: t('sheet.play.actions.damage'), variant: 'secondary', isDisabled: false })
        }
        return actions
      }
      case 'weapon':
        return [
          { key: 'attack', label: t('sheet.play.actions.attack'), detail: formatModifier(source.weapon.attackBonus), variant: 'primary', isDisabled: !card.isAvailable },
          { key: 'damage', label: t('sheet.play.actions.damage'), variant: 'secondary', isDisabled: false },
          ...(source.weapon.isLight ? [{ key: 'offhand-damage' as const, label: t('sheet.play.actions.offhand_damage'), variant: 'secondary' as const, isDisabled: false }] : []),
        ]
      default:
        return card.uses
          ? [{ key: 'use', label: t('sheet.play.actions.use'), detail: t(`sheet.play.actions.spend.${card.resource}`), variant: 'primary', isDisabled: !card.isAvailable }]
          : []
    }
  }

  return { getCardFacts, getDetail, getActions }
}
