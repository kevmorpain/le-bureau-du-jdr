import { spellsLevelHorsSocle6, spellClassMappingsLevelHorsSocle6 } from '../../server/db/seeds/data/spells_hors_socle_niveau_6'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0177_spells_level_6_non_core.sql', level: 6, count: 13, spells: spellsLevelHorsSocle6, mappings: spellClassMappingsLevelHorsSocle6 })
