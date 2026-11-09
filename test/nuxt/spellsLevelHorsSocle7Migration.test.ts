import { spellsLevelHorsSocle7, spellClassMappingsLevelHorsSocle7 } from '../../server/db/seeds/data/spells_hors_socle_niveau_7'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0178_spells_level_7_non_core.sql', level: 7, count: 5, spells: spellsLevelHorsSocle7, mappings: spellClassMappingsLevelHorsSocle7 })
