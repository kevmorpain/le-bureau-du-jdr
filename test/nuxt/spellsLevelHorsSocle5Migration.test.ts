import { spellsLevelHorsSocle5, spellClassMappingsLevelHorsSocle5 } from '../../server/db/seeds/data/spells_hors_socle_niveau_5'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0176_spells_level_5_non_core.sql', level: 5, count: 16, spells: spellsLevelHorsSocle5, mappings: spellClassMappingsLevelHorsSocle5 })
