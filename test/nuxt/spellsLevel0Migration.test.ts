import { spellsLevel0, spellClassMappingsLevel0 } from '../../server/db/seeds/data/spells_niveau_0'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0170_spells_level_0.sql', level: 0, count: 16, spells: spellsLevel0, mappings: spellClassMappingsLevel0 })
