import type { Effect } from '~~/server/db/schema/effects'
import type { CatalogClassFeature } from '~~/server/utils/catalogSources'
import { featureEffectsOf } from '~~/shared/rules/characterEffects'

// Effets des capacités de classe et de sous-classe que la fiche créée portera au niveau choisi, lus dans le
// catalogue : `featureEffectsOf` applique la même garde de niveau que la fiche.
export function useClassFeatureEffects() {
  const { data: features } = useFetch<CatalogClassFeature[]>('/api/catalog/class-features', { default: () => [] })

  function effectsAt(classId: number | null | undefined, subclassId: number | null | undefined, level: number): Effect[] {
    if (classId == null) return []
    return featureEffectsOf({
      features: (features.value ?? []).map(f => ({
        feature: {
          featureType: f.featureType,
          levelRequired: f.levelRequired,
          classId: f.classId,
          subclassId: f.subclassId,
          featureEffects: f.effects.map(effect => ({ effect })),
        },
      })),
      classes: [{ classId, level, subclass: subclassId != null ? { id: subclassId } : null }],
    })
  }

  return { effectsAt }
}
