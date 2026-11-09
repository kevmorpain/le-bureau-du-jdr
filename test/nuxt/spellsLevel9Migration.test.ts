import { spellsLevel9, spellClassMappingsLevel9 } from '../../server/db/seeds/data/spells_niveau_9'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0166_spells_level_9.sql', level: 9, count: 16, spells: spellsLevel9, mappings: spellClassMappingsLevel9 })
