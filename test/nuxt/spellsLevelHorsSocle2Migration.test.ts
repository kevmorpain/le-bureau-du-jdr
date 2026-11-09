import { spellsLevelHorsSocle2, spellClassMappingsLevelHorsSocle2 } from '../../server/db/seeds/data/spells_hors_socle_niveau_2'
import { describeSpellLevelMigration } from '../fixtures/spellLevelMigration'

describeSpellLevelMigration({ migration: '0173_spells_level_2_non_core.sql', level: 2, count: 14, spells: spellsLevelHorsSocle2, mappings: spellClassMappingsLevelHorsSocle2 })
