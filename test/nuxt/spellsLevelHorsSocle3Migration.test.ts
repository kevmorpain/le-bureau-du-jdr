import { spellsLevelHorsSocle3, spellClassMappingsLevelHorsSocle3 } from '../../server/db/seeds/data/spells_hors_socle_niveau_3'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0174_spells_level_3_non_core.sql', level: 3, count: 15, spells: spellsLevelHorsSocle3, mappings: spellClassMappingsLevelHorsSocle3 })
