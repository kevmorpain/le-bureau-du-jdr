import { spellsLevel5, spellClassMappingsLevel5 } from '../../server/db/seeds/data/spells_niveau_5'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0162_spells_level_5.sql', level: 5, count: 39, spells: spellsLevel5, mappings: spellClassMappingsLevel5 })
