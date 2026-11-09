import { spellsLevel6, spellClassMappingsLevel6 } from '../../server/db/seeds/data/spells_niveau_6'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0163_spells_level_6.sql', level: 6, count: 26, spells: spellsLevel6, mappings: spellClassMappingsLevel6 })
