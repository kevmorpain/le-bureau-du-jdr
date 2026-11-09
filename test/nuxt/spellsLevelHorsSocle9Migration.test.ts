import { spellsLevelHorsSocle9, spellClassMappingsLevelHorsSocle9 } from '../../server/db/seeds/data/spells_hors_socle_niveau_9'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0180_spells_level_9_non_core.sql', level: 9, count: 4, spells: spellsLevelHorsSocle9, mappings: spellClassMappingsLevelHorsSocle9 })
