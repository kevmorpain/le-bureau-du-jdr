# Torts — registre des erreurs relevées

File d'attente, pas archive. On y consigne une erreur **au moment où elle est relevée**, et on
l'en **retire** quand elle a produit une règle — ou qu'on a constaté qu'elle n'en méritait pas.
Un fichier court est lu à chaque session ; un fichier de deux cents entrées ne l'est plus.

- **Ce qu'on consigne** : une erreur que l'utilisateur a dû relever. C'est l'événement qui compte,
  et le seul qui soit observable de façon fiable. Les bourdes rattrapées seules n'ont rien coûté
  et ne sont pas le sujet.
- **Quand on relit** : à ~10 entrées, ou sur demande. Pas à date fixe sans déclencheur réel — ce
  dépôt a déjà un « Protocole d'audit (~30 min) » dans
  [`rules-engine.md`](./rules-engine.md#protocole-audit-parcours), ajouté le 2026-08-02 (`63e39e8`) et jamais
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

### 2026-11-09 — Sorts du PHB : descriptions paraphrasées au lieu du texte exact d'AideDD

- **Affirmé / fait** — Pour les 29 sorts de niveau 4 du PHB (PR #310), j'ai demandé aux trois sous-agents une « PARAPHRASE […] dans tes mots : ne recopie aucune phrase de la page », puis j'ai généré le seed et la migration 0161 depuis ces paraphrases et écrit dans D35 qu'elles étaient « réécrites […] sans reprendre la prose ». La PR a été ouverte ainsi.
- **Vrai** — Le dépôt se contredit. `docs/seeds.md:132-133` : « Le texte vient d'AideDD », et `:140-142` : corriger les fautes, pas reformuler. `docs/decisions.md:140` (D24) : « la prose AideDD n'est pas reprise », mais `:142` dit que les 116 sorts d'alors ne sont pas non plus au texte d'AideDD (similarité médiane 0,31). Aucune des deux ne dit « réécrire seulement le hors-PHB » : `grep -rniE 'reformul|paraphras|verbatim|mot pour mot' docs/` ne ramène, avant cette date, que des lignes sur Ker Nethalas (autre module) et `seeds.md:142` : pas cette règle. Elle est du PM (2026-11-09) : texte exact d'AideDD pour le PHB et le SRD, réécriture pour le hors-PHB (Xanathar, Tasha). Elle est écrite depuis dans D35 et `docs/seeds.md`.
- **Manque** — Ouvrir `docs/seeds.md`, section « Rédaction du contenu seedé », avant de rédiger la consigne aux sous-agents ; constater que D24 et `seeds.md` se contredisent ; ne pas trancher seul un choix qui vaut pour toutes les tranches suivantes (une centaine de sorts), mais le poser au PM, avec les deux sources, avant de lancer la lecture des fiches.
- **Règle** — **Présente, non appliquée.** `CLAUDE.md:91` (Definition of Done, Complétude) : « contenu seedé affiché au joueur : chercher comment le dépôt écrit déjà ce qu'on s'apprête à réécrire avant de le retoucher ». `CLAUDE.md:73` (« Ce que le dépôt fait déjà ») demande la même recherche réelle avant d'annoncer l'approche. En ajouter une troisième n'y changerait rien : la question est de savoir comment la faire déclencher, par exemple par un point de contrôle explicite sur toute consigne qui produit du texte affiché au joueur.

### 2026-11-11 — Registres en index : recoupés avec les issues dans un seul sens

- **Affirmé / fait** — En réduisant `audit-completude.md`, `fonctionnalites-manquantes.md` et `consolidation-2014.md` à des index code → issue (PR #316), j'ai écrit dans la PR : « statuts recoupés avec les issues ouvertes (seul écart : D1, #176 fermée) ». Le contrôle fait partait de chaque ligne de registre et vérifiait l'état de l'issue citée. La PR a été fusionnée ainsi.
- **Vrai** — Le sens inverse n'était pas couvert. Un script qui part des issues ouvertes (`gh api …/issues?state=all`, recoupé avec les liens `issues/N` des trois registres) trouve, absents des index fusionnés (`0a0c0c3`) : E12 bis #214 (code déjà porté par #227, fermée), U11 #216, X8 #221 dans `fonctionnalites-manquantes.md` ; F21 #210 (fermée), F22 #213, F23 #215 dans `consolidation-2014.md`. Ces lignes manquaient déjà dans la version d'avant (`git show 4cc089c:docs/…` n'en contient aucune) : le nettoyage les a recopiées absentes. Les mêmes issues, plus #222 et #245, ne sont pas non plus dans le projet GitHub.
- **Manque** — Lancer le recoupement dans les deux sens : partir de la liste des issues (ouvertes et fermées, par préfixe de code) et chercher chacune dans les registres, pas seulement l'inverse ; puis l'annoncer avec sa portée exacte au lieu de « statuts recoupés ».
- **Règle** — **Présente, non appliquée.** `CLAUDE.md:18` : « Les négations coûtent plus cher que les affirmations » — un index présenté comme recoupé affirme qu'il ne manque aucune entrée, ce qui exige la recherche exhaustive qui l'établit. `CLAUDE.md:91` (Complétude) demande de même de parcourir ce qu'on a pu oublier. En ajouter une n'y changerait rien ; un mécanisme le ferait : un script ou test qui compare les issues `manquant`/`dette`/`bug` du dépôt aux lignes des registres.

### 2026-11-22 — Badges à bord seul : trait en box-shadow inset rogné par la découpe biseautée

- **Affirmé / fait** — Dans U17 (PR #337, commit `5617766`), `DsBadge` traçait le bord des variantes `badge`, `bag` et `new` (« Rare », « Sac », « Nouveau ») par `shadow-[inset_0_0_0_1px_…]` sur un élément découpé par `ds-cut-corner` (`clip-path`). Après une capture de la page d'aperçu, j'ai écrit au PM que la page s'affichait « avec les vraies polices et les biseaux en deux couches ».
- **Vrai** — La découpe rogne le trait intérieur sur les deux coins biseautés : le bord y manque. C'est ce que le PM a vu sur l'aperçu, et ce que confirme la page agrandie quatre fois. La règle était écrite deux fois dans l'énoncé de la tâche : « cadre biseauté à deux couches […] jamais box-shadow inset + clip-path », et dans la planche, « Un bord biseauté se fait en deux couches […] jamais par un trait intérieur que la découpe rognerait ». Le CSS des badges de la planche elle-même (`.badge`, `.state.sac`, `.newtag`) fait l'erreur : je l'avais recopié. Le premier correctif avait un second défaut, attrapé à l'agrandissement : la couche intérieure de « Nouveau », de hauteur fixe, laissait un bandeau quand une rangée en flex étirait la couche extérieure (corrigé dans `b163a5b`).
- **Manque** — Confronter chaque composant découpé à la règle avant de livrer : `grep -n 'shadow-\[inset' app/components/ds/` recoupé avec `ds-cut-` ne ramenait que `DsBadge`. Regarder les biseaux à la bonne échelle : la capture à 800 px de large ne montre pas un trait de 1 px sur un coin de 4 px. Je n'ai fait les deux qu'après le signalement.
- **Règle** — **Présente, non appliquée.** La règle de forme était dans l'énoncé, pas dans `CLAUDE.md`. Côté méthode, `CLAUDE.md:90` (« Vérifier avant de dire « fait » ») couvre l'affirmation sur les biseaux faite sur une capture qui ne permettait pas d'en juger, et `CLAUDE.md:55` (« Relire […] la règle avant de l'opposer ») invite à relire la consigne au moment de produire. Un mécanisme l'attraperait mieux qu'une règle de plus : un test qui refuse dans `app/components/ds/` tout élément portant à la fois `ds-cut-` et `shadow-[inset`.
