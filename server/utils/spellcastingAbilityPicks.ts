import { and, eq, isNotNull } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

type SpeciesFeatureLink = { feature?: { id: number, featureEffects?: Array<{ effect: { type: string, value: unknown } }> } | null }

// La caractéristique d'incantation choisie (`spellcasting_ability`, ex. Magie des fées de la Fadette) remplace celle
// que déclarent les effets `spell_grant` du trait qui porte le choix : la fiche lit ensuite les effets comme d'habitude.
export async function applySpellcastingAbilityPicks<T extends SpeciesFeatureLink>(
  db: Db,
  characterSheetId: number,
  speciesFeatures: T[],
): Promise<T[]> {
  const picks = await db
    .select({ featureId: schema.progression.featureId, ability: schema.characterChoices.selectedValue })
    .from(schema.characterChoices)
    .innerJoin(schema.progression, eq(schema.progression.id, schema.characterChoices.progressionId))
    .where(and(
      eq(schema.characterChoices.characterSheetId, characterSheetId),
      eq(schema.progression.kind, 'spellcasting_ability'),
      isNotNull(schema.characterChoices.selectedValue),
    ))
  if (!picks.length) return speciesFeatures
  const abilityByFeature = new Map(picks.map(p => [p.featureId, p.ability!]))

  return speciesFeatures.map((sf) => {
    const ability = sf.feature ? abilityByFeature.get(sf.feature.id) : undefined
    if (!ability || !sf.feature) return sf
    return {
      ...sf,
      feature: {
        ...sf.feature,
        featureEffects: sf.feature.featureEffects?.map(fe => fe.effect.type === 'spell_grant'
          ? { ...fe, effect: { ...fe.effect, value: { ...(fe.effect.value as object), spellcastingAbility: ability } } }
          : fe),
      },
    }
  })
}
