import { spellsLevelHorsSocle1, spellClassMappingsLevelHorsSocle1 } from '../../server/db/seeds/data/spells_hors_socle_niveau_1'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0172_spells_level_1_non_core.sql', level: 1, count: 10, spells: spellsLevelHorsSocle1, mappings: spellClassMappingsLevelHorsSocle1 })
