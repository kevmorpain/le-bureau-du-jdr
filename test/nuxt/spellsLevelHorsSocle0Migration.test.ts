import { spellsLevelHorsSocle0, spellClassMappingsLevelHorsSocle0 } from '../../server/db/seeds/data/spells_hors_socle_niveau_0'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0171_spells_level_0_non_core.sql', level: 0, count: 12, spells: spellsLevelHorsSocle0, mappings: spellClassMappingsLevelHorsSocle0 })
