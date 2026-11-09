import { spellsLevel8, spellClassMappingsLevel8 } from '../../server/db/seeds/data/spells_niveau_8'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0165_spells_level_8.sql', level: 8, count: 18, spells: spellsLevel8, mappings: spellClassMappingsLevel8 })
