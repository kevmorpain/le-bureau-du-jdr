import { spellsLevel4, spellClassMappingsLevel4 } from '../../server/db/seeds/data/spells_niveau_4'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0161_spells_level_4.sql', level: 4, count: 29, spells: spellsLevel4, mappings: spellClassMappingsLevel4 })
