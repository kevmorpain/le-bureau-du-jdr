import { spellsLevel3, spellClassMappingsLevel3 } from '../../server/db/seeds/data/spells_niveau_3'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0167_spells_level_3.sql', level: 3, count: 26, spells: spellsLevel3, mappings: spellClassMappingsLevel3 })
