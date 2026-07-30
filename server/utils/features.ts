import { isNull } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'

/**
 * Prédicat de MATÉRIALISATION : ne sont attribués d'office à un personnage que les
 * GRANTS PASSIFS — les features qu'il possède sans choix (résistances, conteneurs de
 * classe, aptitudes toujours actives…).
 *
 * Une feature qui est une **option d'un groupe de choix** se reconnaît à son `tag`
 * non nul (cf. [shared/rules/featureTags.ts], lot 4b : « un tag marque une feature qui
 * est une OPTION au sein d'un groupe »). Elle n'est JAMAIS accordée automatiquement :
 * le personnage ne l'obtient que s'il la choisit (`progression` + `character_choices`,
 * lot 4c) et elle est ensuite dérivée live ([D8](../../docs/decisions.md#d8)).
 *
 * On matérialise donc les grants passifs, on exclut les options : c'est le rôle exact
 * du `tag`. Ce prédicat est un **no-op sur les données actuelles** — aucune
 * `class_feature`/`subclass_feature` n'est taguée aujourd'hui (les invocations le sont
 * mais portent `feature_type = 'eldritch_invocation'`, donc déjà hors des sweeps de
 * classe). Il devient actif dès qu'un groupe d'options est matérialisé en features
 * taguées (à commencer par le pacte de l'Occultiste, lot 4c).
 *
 * ⚠️ Jalon provisoire : quand la classe cessera d'être matérialisée au profit d'une
 * dérivation live (comme l'espèce ; roadmap dnd-5.5.md §3 point 6), ce filtre — et les
 * sweeps qu'il garde — disparaîtront.
 */
export const isPassiveGrant = () => isNull(schema.features.tag)
