import { spellsLevel1, spellClassMappingsLevel1 } from '../../server/db/seeds/data/spells_niveau_1'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0169_spells_level_1.sql', level: 1, count: 34, spells: spellsLevel1, mappings: spellClassMappingsLevel1 })
