import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Formula } from '~~/shared/utils/formula'
import type { FeatureTag } from '~~/shared/rules/featureTags'
import type { FeatCategory } from '~~/shared/rules/featCategories'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { AbilityScoreKey } from './effects'
import classes from './classes'
import subclasses from './subclasses'
import speciesLineages from './species_lineages'
import featureEffects from './feature_effects'
import speciesFeatures from './species_features'
import characterFeatures from './character_features'

// `proficiency_grant` : feature PORTEUSE des maîtrises de base d'une classe (armes/armures),
// jamais matérialisée ni affichée — elle sert de support à des effets `weapon_proficiency`/
// `proficiency` que la fiche DÉRIVE de l'origine (volet B, cf. shared/rules/classProficiencies.ts).
// Exclue par construction des sweeps de matérialisation (qui filtrent `class_feature`/
// `subclass_feature`) et du catalogue (elle ne porte aucune `progression`).
export type FeatureType = 'species_trait' | 'class_feature' | 'subclass_feature' | 'lineage_feature' | 'eldritch_invocation' | 'feat' | 'background_feature' | 'proficiency_grant'
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'free'
export const RECHARGE_TYPES = ['short_rest', 'long_rest', 'dawn'] as const
export type RechargeType = typeof RECHARGE_TYPES[number]

export interface FeatureMeta {
  slotLevelFormula?: Formula
  /**
   * Marque une feature dont `maxUsesFormula` est purement informatif
   * (ex. nombre d'invocations connues) et ne doit pas afficher de compteur
   * d'utilisations sur la fiche de personnage.
   */
  hideCounter?: boolean
}

export interface FeaturePrerequisite {
  requiredPactBoon?: 'chain' | 'blade' | 'tome'
  requiredSpellName?: string
  requiredInvocationName?: string
  // ─── Dons (PHB 2014) — prérequis de sélection ────────────────────────────
  // Au moins une des caractéristiques listées doit atteindre `score`
  // (ex. Lutteur → For 13 ; Magie rituelle → Int ou Sag 13).
  minAbilityScore?: { abilities: AbilityScoreKey[], score: number }
  // Maîtrise d'armure requise (ex. Protection lourde exige la maîtrise des
  // armures intermédiaires ; Maître des armures lourdes exige les lourdes).
  requiredArmorProficiency?: 'light' | 'medium' | 'heavy'
  // Capacité à lancer au moins un sort (Adepte élémentaire, Mage offensif…).
  requiresSpellcasting?: boolean
}

const features = sqliteTable(
  'features',
  {
    id: integer().primaryKey().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    // Édition de règles (cf. shared/rules/ruleset.ts, decisions.md D2). Les features
    // 5.5 (traits d'espèce, capacités de classe remaniées) cohabitent avec les 2014.
    ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
    featureType: text('feature_type').$type<FeatureType>().notNull(),
    // class/subclass features only
    classId: integer('class_id').references(() => classes.id, { onDelete: 'set null' }),
    subclassId: integer('subclass_id').references(() => subclasses.id, { onDelete: 'set null' }),
    // Lignée (sous-race 2014 / lignée 2024) propriétaire — symétrique de `subclass_id`
    // (cf. decisions.md D17). Nullable : la plupart des features n'appartiennent pas à une
    // lignée. Une feature de lignée a `feature_type='lineage_feature'` et n'est accordée
    // qu'à un perso ayant choisi cette lignée (gating par `level_required`).
    lineageId: integer('lineage_id').references(() => speciesLineages.id, { onDelete: 'set null' }),
    levelRequired: integer('level_required'),
    // Groupe de features-options auquel cette feature appartient en tant qu'OPTION
    // (cf. shared/rules/featureTags.ts). Nullable : la plupart des features n'en sont
    // pas une. Indexé pour résoudre `optionSource:{feature_group}` (progression, 4c)
    // par `WHERE tag = <group>`. Backfillé pour les invocations par la migration 0081.
    tag: text('tag').$type<FeatureTag>(),
    // Catégorie de don 2024 (cf. shared/rules/featCategories.ts, « identité → colonne »).
    // Nullable : seuls les dons (`feature_type='feat'`) 2024 en portent une ; les dons 2014
    // restent NULL → un `optionSource:{feats}` sans `category` les propose tous (iso-2014).
    featCategory: text('feat_category').$type<FeatCategory>(),
    actionType: text('action_type').$type<ActionType>(),
    maxUsesFormula: text('max_uses_formula', { mode: 'json' }).$type<Formula>(),
    rechargeType: text('recharge_type').$type<RechargeType>(),
    meta: text('meta', { mode: 'json' }).$type<FeatureMeta>(),
    prerequisites: text('prerequisites', { mode: 'json' }).$type<FeaturePrerequisite>(),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  table => [
    index('features_class_id_idx').on(table.classId),
    index('features_subclass_id_idx').on(table.subclassId),
    index('features_lineage_id_idx').on(table.lineageId),
    index('features_tag_idx').on(table.tag),
  ],
)

export const featuresRelations = relations(features, ({ one, many }) => ({
  class: one(classes, {
    fields: [features.classId],
    references: [classes.id],
  }),
  subclass: one(subclasses, {
    fields: [features.subclassId],
    references: [subclasses.id],
  }),
  featureEffects: many(featureEffects),
  speciesFeatures: many(speciesFeatures),
  characterFeatures: many(characterFeatures),
}))

export default features
