import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'
import type { Ruleset } from '~~/shared/rules/ruleset'

/**
 * Loaders des LISTES de référence du catalogue (lot 6a) — la tranche plate, statique et
 * cachable que consomment le builder et la fiche : classes (+ sous-classes), espèces, dons,
 * invocations, historiques. Ils encapsulent en un seul endroit les requêtes aujourd'hui
 * éparpillées dans les endpoints `server/api/{classes,character_species,feats,invocations,
 * backgrounds}` (rules-engine.md §7 #3 : « encapsuler l'accès données hub:db dans un module »).
 *
 * Le `db` est INJECTÉ : en prod le `db` de `hub:db` (⚠️ PAS `useDrizzle()`, qui casse à l'appel —
 * cf. server/utils/drizzle.ts), en test une instance drizzle-sur-libsql — exactement comme
 * {@link buildCatalog} (`server/utils/catalog.ts`). Cela les rend testables sans HTTP ni auth
 * (patron du point 5) ; les endpoints `/api/catalog/*` ET legacy délèguent ici : source unique,
 * shape garantie identique.
 *
 * Lecture via `srcSchema` (schéma source, frais) plutôt que le cache `hub:db` — voir CLAUDE.md.
 *
 * Chaque loader d'entité globale filtre par `ruleset` (défaut `'5'`, cf. shared/rules/ruleset.ts) :
 * le builder 2014 (qui appelle sans argument) ne voit QUE le contenu 2014, même une fois du 5.5 seedé
 * (Phase 2). No-op tant que tout est `'5'` en base. Un futur appelant 5.5 passera `'5.5'`.
 */

// Instance drizzle SQLite, quel que soit le driver (D1 en prod, libsql en test) — mêmes
// génériques `any` que dans catalog.ts : seul le query-builder `.select().from()` est utilisé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

type ClassRow = typeof srcSchema.classes.$inferSelect
type SubclassRow = typeof srcSchema.subclasses.$inferSelect

/** Classe du catalogue = ligne `classes` + ses sous-classes imbriquées. */
export type CatalogClass = ClassRow & { subclasses: SubclassRow[] }

/**
 * Toutes les classes, chacune avec ses sous-classes imbriquées, triées par id de classe puis
 * nom de sous-classe (≡ endpoint legacy `/api/classes`).
 */
export async function loadClasses(db: Db, ruleset: Ruleset = '5'): Promise<CatalogClass[]> {
  const rows = await db
    .select()
    .from(srcSchema.classes)
    .leftJoin(srcSchema.subclasses, eq(srcSchema.subclasses.classId, srcSchema.classes.id))
    .where(eq(srcSchema.classes.ruleset, ruleset))
    .orderBy(asc(srcSchema.classes.id), asc(srcSchema.subclasses.name))

  const byId = new Map<number, CatalogClass>()
  for (const r of rows) {
    const cls = r.classes
    if (!byId.has(cls.id)) byId.set(cls.id, { ...cls, subclasses: [] })
    if (r.subclasses) byId.get(cls.id)!.subclasses.push(r.subclasses)
  }
  return [...byId.values()]
}

/**
 * Liste plate des espèces `{id, name}`, triées par nom (≡ endpoint legacy
 * `/api/character_species`). Le builder n'a besoin que de la résolution name → id.
 */
export async function loadSpecies(db: Db, ruleset: Ruleset = '5'): Promise<{ id: number, name: string }[]> {
  return await db
    .select({ id: srcSchema.characterSpecies.id, name: srcSchema.characterSpecies.name })
    .from(srcSchema.characterSpecies)
    .where(eq(srcSchema.characterSpecies.ruleset, ruleset))
    .orderBy(asc(srcSchema.characterSpecies.name))
}

/**
 * Sous-classes d'une classe désignée par son NOM en base (≡ endpoint legacy
 * `/api/classes/[name]/subclasses`). Classe inconnue → `[]`.
 */
export async function loadSubclasses(db: Db, className: string): Promise<{ id: number, name: string, description: string | null }[]> {
  const [cls] = await db
    .select({ id: srcSchema.classes.id })
    .from(srcSchema.classes)
    .where(eq(srcSchema.classes.name, className))
    .limit(1)
  if (!cls) return []

  return await db
    .select({
      id: srcSchema.subclasses.id,
      name: srcSchema.subclasses.name,
      description: srcSchema.subclasses.description,
    })
    .from(srcSchema.subclasses)
    .where(eq(srcSchema.subclasses.classId, cls.id))
}

/**
 * Tous les dons (`features` de `feature_type='feat'`) avec leurs effets bakés, triés par nom
 * (locale fr) (≡ endpoint legacy `/api/feats`).
 */
export async function loadFeats(db: Db, ruleset: Ruleset = '5') {
  const feats = await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
      prerequisites: srcSchema.features.prerequisites,
    })
    .from(srcSchema.features)
    .where(and(eq(srcSchema.features.featureType, 'feat'), eq(srcSchema.features.ruleset, ruleset)))

  if (feats.length === 0) return []

  const featIds = feats.map(f => f.id)
  const links = await db
    .select({ featureId: srcSchema.featureEffects.featureId, effect: srcSchema.effects })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(inArray(srcSchema.featureEffects.featureId, featIds))

  const effectsByFeat = new Map<number, (typeof srcSchema.effects.$inferSelect)[]>()
  for (const link of links) {
    if (!effectsByFeat.has(link.featureId)) effectsByFeat.set(link.featureId, [])
    effectsByFeat.get(link.featureId)!.push(link.effect)
  }

  return feats
    .map(f => ({ ...f, effects: effectsByFeat.get(f.id) ?? [] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

/**
 * Toutes les invocations occultes (`features` de `feature_type='eldritch_invocation'`) avec
 * `levelRequired` (défaut 1), `prerequisites` et effets `{type, value}` (≡ endpoint legacy
 * `/api/invocations`).
 */
export async function loadInvocations(db: Db) {
  const features = await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
      levelRequired: srcSchema.features.levelRequired,
      prerequisites: srcSchema.features.prerequisites,
    })
    .from(srcSchema.features)
    .where(eq(srcSchema.features.featureType, 'eldritch_invocation'))

  if (features.length === 0) return []

  const featureIds = features.map(f => f.id)
  const effectRows = await db
    .select({
      featureId: srcSchema.featureEffects.featureId,
      type: srcSchema.effects.type,
      value: srcSchema.effects.value,
    })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(inArray(srcSchema.featureEffects.featureId, featureIds))

  const effectsByFeature = new Map<number, Effect[]>()
  for (const row of effectRows) {
    const list = effectsByFeature.get(row.featureId) ?? []
    list.push({ type: row.type, value: row.value } as Effect)
    effectsByFeature.set(row.featureId, list)
  }

  return features.map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    levelRequired: f.levelRequired ?? 1,
    prerequisites: f.prerequisites as FeaturePrerequisite | null,
    effects: effectsByFeature.get(f.id) ?? [],
  }))
}

/**
 * Historiques, triés par nom. Sans `characterSheetId` → uniquement les historiques GLOBAUX
 * (`character_sheet_id IS NULL`), la tranche statique cachable du catalogue. Avec un
 * `characterSheetId`, ajoute les historiques homebrew de cette fiche (≡ endpoint legacy
 * `/api/backgrounds`, dont la variante per-fiche n'est PAS cachable).
 */
export async function loadBackgrounds(db: Db, characterSheetId?: number, ruleset: Ruleset = '5') {
  return await db
    .select()
    .from(srcSchema.backgrounds)
    .where(
      and(
        eq(srcSchema.backgrounds.ruleset, ruleset),
        characterSheetId
          ? or(isNull(srcSchema.backgrounds.characterSheetId), eq(srcSchema.backgrounds.characterSheetId, characterSheetId))
          : isNull(srcSchema.backgrounds.characterSheetId),
      ),
    )
    .orderBy(srcSchema.backgrounds.name)
}
