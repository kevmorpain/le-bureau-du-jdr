import { spellsLevelHorsSocle4, spellClassMappingsLevelHorsSocle4 } from '../../server/db/seeds/data/spells_hors_socle_niveau_4'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0175_spells_level_4_non_core.sql', level: 4, count: 12, spells: spellsLevelHorsSocle4, mappings: spellClassMappingsLevelHorsSocle4 })
