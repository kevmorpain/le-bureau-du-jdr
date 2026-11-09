import { spellsLevel7, spellClassMappingsLevel7 } from '../../server/db/seeds/data/spells_niveau_7'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0164_spells_level_7.sql', level: 7, count: 16, spells: spellsLevel7, mappings: spellClassMappingsLevel7 })
