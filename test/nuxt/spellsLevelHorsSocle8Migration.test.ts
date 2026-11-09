import { spellsLevelHorsSocle8, spellClassMappingsLevelHorsSocle8 } from '../../server/db/seeds/data/spells_hors_socle_niveau_8'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0179_spells_level_8_non_core.sql', level: 8, count: 4, spells: spellsLevelHorsSocle8, mappings: spellClassMappingsLevelHorsSocle8 })
