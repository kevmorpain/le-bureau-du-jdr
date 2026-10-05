# Torts — registre des erreurs relevées

File d'attente, pas archive. On y consigne une erreur **au moment où elle est relevée**, et on
l'en **retire** quand elle a produit une règle — ou qu'on a constaté qu'elle n'en méritait pas.
Un fichier court est lu à chaque session ; un fichier de deux cents entrées ne l'est plus.

- **Ce qu'on consigne** : une erreur que l'utilisateur a dû relever. C'est l'événement qui compte,
  et le seul qui soit observable de façon fiable. Les bourdes rattrapées seules n'ont rien coûté
  et ne sont pas le sujet.
- **Quand on relit** : à ~10 entrées, ou sur demande. Pas à date fixe sans déclencheur réel — ce
  dépôt a déjà un « Protocole d'audit proposé (~30 min) » en bas de
  [`audit-completude.md`](./audit-completude.md), ajouté le 2026-08-02 (`63e39e8`) et jamais
  exécuté depuis.
- **Ce qu'on en fait** : ajouter, reformuler, déplacer ou **supprimer** une règle de `CLAUDE.md`,
  d'un bloc — jamais PR par PR. Le succès se mesure en règles modifiées, pas en entrées
  accumulées. Si deux relectures d'affilée ne changent rien, supprimer ce fichier.

## Format

Quatre champs, tous **factuels**. Aucun ne demande d'introspection : « pourquoi » je me suis
trompé n'est pas observable, et une explication reconstruite après coup est au mieux plausible —
précisément ce que `CLAUDE.md` interdit de prendre pour un diagnostic. Le champ **Manque** la
remplace par ce qui est vérifiable dans l'échange : le geste qui aurait attrapé l'erreur et qui
n'a pas été fait.

- **Affirmé / fait** — ce qui a été soutenu ou produit.
- **Vrai** — ce qu'il en était, établi par une vérification réelle.
- **Manque** — le geste de vérification absent : ouvrir tel fichier, lancer telle commande,
  chercher une alternative, relire la question posée.
- **Règle** — celle de `CLAUDE.md` qui aurait dû l'attraper, et si elle existait déjà.

Ce dernier champ porte l'essentiel du registre : il sépare **règle absente** (→ en écrire une) de
**règle présente mais non appliquée** (→ en ajouter une de plus n'y changera rien ; il faut la
reformuler, la remonter dans le fichier, ou la sortir de la prose vers un mécanisme — hook, test,
commande).

## File

_File vide — dernière relecture le 2026-10-05._
