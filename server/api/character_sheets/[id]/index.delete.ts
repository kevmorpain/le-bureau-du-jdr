import { db, schema } from 'hub:db'
import { blob } from 'hub:blob'
import { portraitPrefix } from '~~/server/utils/portraits'

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

  // Le bucket, lui, n'a pas de cascade : sans cette purge, chaque fiche supprimée
  // laisserait ses portraits dans R2 pour toujours. On liste par préfixe (une fiche
  // n'a qu'un portrait courant, mais un échec de purge antérieur peut en laisser).
  // Après le DELETE : une purge qui échoue ne doit pas empêcher la suppression.
  try {
    const { blobs } = await blob.list({ prefix: portraitPrefix(Number(id)) })
    if (blobs.length) {
      await blob.del(blobs.map(b => b.pathname))
    }
  } catch (e) {
    console.error('[character_sheet delete] purge des portraits impossible:', id, e)
  }

  return { success: true }
})
