import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Formula } from '~~/shared/utils/formula'
import type { FeatureTag } from '~~/shared/rules/featureTags'
import type { FeatCategory } from '~~/shared/rules/featCategories'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { Source } from '~~/shared/rules/source'
import type { AbilityScoreKey } from './effects'
import classes from './classes'
import subclasses from './subclasses'
import speciesLineages from './species_lineages'
import featureEffects from './feature_effects'
import speciesFeatures from './species_features'
import characterFeatures from './character_features'

// `proficiency_grant` : porteur des maîtrises de base d'une classe — jamais matérialisé ni affiché, la
// fiche dérive ses effets de l'origine.
// `choice_carrier` : porteur d'un point de choix dont le résultat est déjà rendu ailleurs (choix de
// sous-classe) — lu par le catalogue, jamais matérialisé.
// `fighting_style` : feature-OPTION d'un style ; seule l'option CHOISIE est copiée sur la fiche.
export type FeatureType = 'species_trait' | 'class_feature' | 'subclass_feature' | 'lineage_feature' | 'eldritch_invocation' | 'feat' | 'background_feature' | 'proficiency_grant' | 'choice_carrier' | 'fighting_style'
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'free'
export const RECHARGE_TYPES = ['short_rest', 'long_rest', 'dawn'] as const
export type RechargeType = typeof RECHARGE_TYPES[number]

export interface FeatureMeta {
  slotLevelFormula?: Formula
  /** `maxUsesFormula` purement informatif : n'affiche pas de compteur d'utilisations sur la fiche. */
  hideCounter?: boolean
}

export interface FeaturePrerequisite {
  requiredPactBoon?: 'chain' | 'blade' | 'tome'
  requiredSpellName?: string
  requiredInvocationName?: string
  // Au moins une des caractéristiques listées doit atteindre `score`.
  minAbilityScore?: { abilities: AbilityScoreKey[], score: number }
  requiredArmorProficiency?: 'light' | 'medium' | 'heavy'
  requiresSpellcasting?: boolean
}

const features = sqliteTable(
  'features',
  {
    id: integer().primaryKey().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
    source: text('source').$type<Source>().notNull().default('core'),
    featureType: text('feature_type').$type<FeatureType>().notNull(),
    // class/subclass features only
    classId: integer('class_id').references(() => classes.id, { onDelete: 'set null' }),
    subclassId: integer('subclass_id').references(() => subclasses.id, { onDelete: 'set null' }),
    // Lignée propriétaire, symétrique de `subclass_id` (D17).
    lineageId: integer('lineage_id').references(() => speciesLineages.id, { onDelete: 'set null' }),
    levelRequired: integer('level_required'),
    // Groupe d'options auquel la feature appartient. Indexé : résout `optionSource:{feature_group}`.
    tag: text('tag').$type<FeatureTag>(),
    // Seuls les dons 2024 en portent une ; NULL ⇒ proposé par tout `optionSource:{feats}` sans catégorie.
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
