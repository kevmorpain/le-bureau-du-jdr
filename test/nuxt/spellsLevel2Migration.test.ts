import { spellsLevel2, spellClassMappingsLevel2 } from '../../server/db/seeds/data/spells_niveau_2'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0168_spells_level_2.sql', level: 2, count: 36, spells: spellsLevel2, mappings: spellClassMappingsLevel2 })
