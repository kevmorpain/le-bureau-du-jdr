import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  // Autorisation (session + appartenance de la fiche) assurée en amont par le
  // middleware `character-sheets-authz` pour toutes les routes `/[id]/**` :
  // la fiche existe et appartient au demandeur si on arrive ici.
  const { id } = getRouterParams(event)

  // Les tables enfants (classes, sorts, compétences, inventaire, choix, features…)
  // référencent character_sheets.id en `onDelete: 'cascade'` → un seul DELETE
  // nettoie toute la fiche.
  await db
    .delete(schema.characterSheets)
    .where(eq(schema.characterSheets.id, Number(id)))

  return { success: true }
})
