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

### 2026-09-15 — Répondu à côté : bugs de code au lieu d'erreurs de raisonnement

- **Affirmé / fait** : interrogé sur d'autres erreurs de raisonnement du même type que les
  affirmations non vérifiées, j'ai livré une analyse de bugs applicatifs (B3/B4/B6 de
  `audit-completude.md`, PR #70) et proposé d'en tirer des règles de convention.
- **Vrai** : ce sont des défauts du produit, pas des défauts de mon raisonnement. Les traces
  pertinentes étaient ailleurs — les « à tort » des messages de commit et l'en-tête de
  `.claude/hooks/session-start.sh`, qui documentent des croyances fausses qu'il a fallu défaire.
- **Manque** : n'avoir jamais vérifié que la classe de preuve cherchée répondait à la question
  posée. J'ai cherché « les erreurs de ce dépôt » là où on demandait « mes erreurs de jugement ».
- **Règle** : aucune. `CLAUDE.md` encadre la véracité des affirmations, pas l'adéquation de la
  réponse à la question posée.
- Relevé par l'utilisateur.

### 2026-09-15 — Routine livrée comme fonctionnelle sans l'avoir exécutée une fois

- **Affirmé / fait** : après avoir créé la routine hebdomadaire de relecture
  (`trig_01XzJrTxRVbC4nWsjmG3TQ8t`), je l'ai décrite à l'indicatif — « elle ouvre une session
  neuve, lit la file, et ne fait rien si elle est sous 10 entrées » — puis j'ai signalé un doute
  sur son accès au dépôt en **proposant** de la tester.
- **Vrai** : seule la création était vérifiée (sortie de `create_trigger`). Le comportement décrit
  n'était que la reformulation du prompt que je venais d'écrire, sans aucune exécution derrière.
  `fire_trigger` était disponible : le test coûtait une exécution et levait le doute sur-le-champ.
- **Manque** : ne pas avoir déclenché la routine une fois avant de la décrire. Proposer une
  vérification à l'utilisateur au lieu de la faire, quand l'outil est à portée de main, revient à
  livrer non vérifié en s'en donnant l'air averti.
- **Règle** : **présente, non appliquée** — « Vérifier avant de dire "fait" » (Definition of Done)
  et « Une affirmation = une source » couvrent toutes deux le cas. Aucune règle ne manquait.
- Relevé par l'utilisateur.

### 2026-09-15 — Annoncé l'annulation d'un rappel sans l'annuler

- **Affirmé / fait** : « J'annule mon rappel de relance, il n'a plus d'objet. »
- **Vrai** : aucun `delete_trigger` n'a été appelé. Le rappel
  (`trig_01DHAmwHw4U3gsS6qYBYXRbU`) a sonné cinq minutes plus tard et s'est désactivé de lui-même
  (`ended_reason: run_once_fired`). Sans conséquence — un one-shot ne resonne pas — mais l'annonce
  était fausse au moment où elle a été faite.
- **Manque** : ne pas avoir appelé l'outil dans le tour où l'annonce était écrite. Une action
  annoncée en fin de message et renvoyée à plus tard n'est jamais exécutée : il n'y a pas de
  « plus tard » entre deux tours.
- **Règle** : **présente, non appliquée** — « Vérifier avant de dire "fait" ». Deux des trois
  entrées de cette file relèvent d'un énoncé à l'indicatif pour une action non exécutée.
- Révélé par le déclenchement du rappel lui-même ; consigné à la demande de l'utilisateur, qui a
  écarté le filtre « erreur relevée par l'utilisateur » pour ce cas.

### 2026-09-15 — SHA de commit fabriqué de toutes pièces

- **Affirmé / fait** : passé `expectedHeadSha: 45dd1edb3eea6e3de0e0d1a25b7c4ba8bdb4d7d1` à
  `merge_pull_request`.
- **Vrai** : le SHA réel était `45dd1ed82057d78cfb18fbfcf25898a10c6af43e`. Seuls les 7 premiers
  caractères — ceux qu'affiche `git log --oneline` — étaient sourcés ; les 33 suivants n'avaient
  jamais figuré dans la session. GitHub a rejeté l'appel (`409 Head branch was modified`).
- **Manque** : ne pas avoir lu la valeur à sa source. `git rev-parse` était à un appel. Un
  identifiant ne s'écrit pas à la main : il se lit, ou il se passe par substitution de commande.
- **Règle** : couverte en esprit (« ne jamais combler un trou par ce qui *devrait* logiquement s'y
  trouver ») mais **aucune règle ne vise les identifiants**, qui sont précisément le cas où le trou
  est invisible : un SHA bien formé a toutes les apparences d'un SHA. Classe distincte des autres
  entrées de la file.
- Relevé par l'utilisateur.

### 2026-09-15 — Citations `fichier:ligne` reprises d'un doc sans vérifier qu'elles pointent encore

- **Affirmé / fait** : présenté « `MagicSection.vue:721` reconstruit le mod de CHA » et
  « `StepAsi.vue` `baseScore` (l.214) » comme des localisations de code, dans un tableau de constats.
- **Vrai** : ces numéros viennent de `docs/audit-completude.md` (l.54 et l.66) et y sont rapportés
  fidèlement — mais le code a bougé depuis le 2026-08-02 : `charismaModifier` est aujourd'hui en
  `MagicSection.vue:811`, `baseScore` en `StepAsi.vue:264`. Les lignes citées ne contiennent plus
  rien de tel.
- **Manque** : ne pas avoir fait résoudre la citation avant de la reprendre. Citer une source n'est
  pas vérifier : la source aussi se périme, et un `fichier:ligne` est ce qui se périme le plus vite.
- **Règle** : **présente, mal cadrée** — « Une vérification a une date de péremption » ne vise que
  mes propres lectures, pas les références reprises d'un document du dépôt.
- Relevé en vérifiant, à la demande de l'utilisateur, si d'autres identifiants avaient été fabriqués.
