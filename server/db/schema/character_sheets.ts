import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSpecies from './character_species'
import characterClasses from './character_classes'
import characterAbilityScores from './character_ability_scores'
import characterAbilityScoreImprovements from './character_ability_score_improvements'
import characterSpells from './character_spells'
import characterSpellSlots from './character_spell_slots'
import characterSkills from './character_skills'
import characterFeatures from './character_features'
import characterInventory from './character_inventory'
import characterProficiencyOverrides from './character_proficiency_overrides'
import backgrounds from './backgrounds'
import spells from './spells'
import users from './users'

export enum Alignment {
  LawfulGood = 'LG',
  NeutralGood = 'NG',
  ChaoticGood = 'CG',
  LawfulNeutral = 'LN',
  TrueNeutral = 'TN',
  ChaoticNeutral = 'CN',
  LawfulEvil = 'LE',
  NeutralEvil = 'NE',
  ChaoticEvil = 'CE',
}

type HitDie = '4' | '6' | '8' | '10' | '12'

interface CurrentHitDie {
  die: HitDie
  count: number
}

const characterSheets = sqliteTable('character_sheets', {
  id: integer().primaryKey().notNull(),
  // Propriétaire de la fiche. Nullable pour permettre la migration des fiches
  // existantes (backfill manuel) ; toute nouvelle fiche pose toujours l'owner.
  ownerId: integer('owner_id').references(() => users.id),
  name: text('name').notNull(),
  speciesId: integer('species_id').references(() => characterSpecies.id).notNull(),
  alignment: text().$type<Alignment>().default(Alignment.TrueNeutral).notNull(),
  maxHp: integer('max_hp').default(0).notNull(),
  currentHp: integer('current_hp').default(0).notNull(),
  temporaryHp: integer('temporary_hp').default(0).notNull(),
  backgroundId: integer('background_id').references(() => backgrounds.id),
  personalityTraits: text('personality_traits').default('').notNull(),
  ideals: text().default('').notNull(),
  bonds: text().default('').notNull(),
  flaws: text().default('').notNull(),
  currentHitDie: text('current_hit_die', { mode: 'json' }).$type<CurrentHitDie[]>(),
  inspiration: integer({ mode: 'boolean' }).default(false).notNull(),
  exhaustionLevel: integer('exhaustion_level').default(0).notNull(),
  dragonbornAncestry: text('dragonborn_ancestry'),
  pp: integer('pp').default(0).notNull(),
  po: integer('po').default(0).notNull(),
  pe: integer('pe').default(0).notNull(),
  pa: integer('pa').default(0).notNull(),
  pc: integer('pc').default(0).notNull(),
  concentratingSpellId: integer('concentrating_spell_id').references(() => spells.id, { onDelete: 'set null' }),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
}, table => [
  index('idx_character_sheets_species').on(table.speciesId),
  index('idx_character_sheets_owner').on(table.ownerId),
])

export const characterSheetRelations = relations(characterSheets, ({ many, one }) => ({
  owner: one(users, {
    fields: [characterSheets.ownerId],
    references: [users.id],
  }),
  species: one(characterSpecies, {
    fields: [characterSheets.speciesId],
    references: [characterSpecies.id],
  }),
  background: one(backgrounds, {
    fields: [characterSheets.backgroundId],
    references: [backgrounds.id],
  }),
  classes: many(characterClasses),
  baseAbilityScores: many(characterAbilityScores),
  abilityScoreImprovements: many(characterAbilityScoreImprovements),
  spells: many(characterSpells),
  spellSlots: many(characterSpellSlots),
  skills: many(characterSkills),
  features: many(characterFeatures),
  inventory: many(characterInventory),
  proficiencyOverrides: many(characterProficiencyOverrides),
}))

export default characterSheets
