# Preview de PR et staging

Historiquement, le projet n'avait que deux états : « ça tourne sur ma machine » et
« c'est en prod ». Le CI ne jouait que Vitest, et Workers Builds ne déploie que la
branche par défaut — donc tout ce qui casse *après* `nuxt build` (migration, binding,
runtime Workers) ne se découvrait qu'une fois mergé. C'est exactement ce qui s'est
passé avec l'OOM du build Cloudflare (#65).

Deux couches ont été ajoutées. Elles sont indépendantes : la première suffit au
quotidien, la seconde sert quand on veut *cliquer* dans l'app avant de merger.

| Couche | Coût | Ce qu'elle attrape |
|---|---|---|
| **Garde-fou CI** (`.github/workflows/build.yml`) | aucune ressource Cloudflare, aucun credential | build, migrations, bindings, bundle, runtime Workers |
| **Staging partagé** (`.github/workflows/deploy-staging.yml`) | une D1 + un KV + un bucket R2 dédiés | tout le reste : l'app, pour de vrai, dans un navigateur |

---

## Couche 1 — le garde-fou CI

Joué sur chaque PR, **sans aucun credential Cloudflare** : `--local` (D1/KV/R2 émulés
par Miniflare) et `--dry-run` n'appellent pas l'API Cloudflare. Il tourne donc aussi
sur les PR venant d'un fork.

Quatre étapes (~5 à 10 min sur un runner), toutes rejouables en local
(cf. CLAUDE.md § « Instancier Cloudflare en local ») :

```bash
npm run build                                # ce que Workers Builds joue en prod
npx wrangler d1 migrations apply DB --local  # rejoue les migrations sur une D1 vierge
npx wrangler --cwd .output deploy --dry-run  # bundle Worker + bindings + taille
.github/scripts/smoke-worker.sh              # boote le Worker sur workerd et l'exerce
```

Le smoke test ([.github/scripts/smoke-worker.sh](../.github/scripts/smoke-worker.sh))
est la pièce qui manquait : il boote le vrai runtime Workers, seede un sous-ensemble,
relit les données, rejoue le seed pour vérifier son idempotence, et contrôle que
`/api/admin/seed` répond bien 401 sans secret. Un handler qui plante sous workerd —
et pas sous Node/Vitest — échoue ici.

## Couche 2 — le staging partagé

Un **seul** Worker `le-bureau-du-jdr-staging`, avec sa propre D1 / KV / R2, redéployé
à chaque push de PR. Le workflow commente l'URL sur la PR (commentaire collant :
réédité, pas empilé).

L'URL est stable, ce qui est le point important : les redirect URIs OAuth
(Discord + Google) se déclarent **une fois**, et le catalogue se seede **une fois**.

Contrepartie assumée : la dernière PR poussée occupe l'environnement.

### Comment l'environnement est sélectionné (à lire avant de toucher au workflow)

Contrairement à ce qu'on attend d'un projet Wrangler, **l'environnement se choisit au
build, pas au déploiement**. `@nuxthub/core` lit `CLOUDFLARE_ENV` à la fermeture du build
et *aplatit* `env.<valeur>` de [wrangler.jsonc](../wrangler.jsonc) dans le
`.output/server/wrangler.json` généré — en retirant au passage la clé `env` et les
bindings non hérités du niveau racine (mêmes règles d'héritage que Wrangler).

Conséquences pratiques :

```bash
CLOUDFLARE_ENV=staging npm run build   # ← l'aplatissement se joue ici
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy                    # ← surtout PAS de --env : il n'y en a plus dans le config
```

Passer `--env staging` (ou laisser `CLOUDFLARE_ENV` visible par wrangler) après le build
ferait chercher un environnement qui n'existe plus dans le fichier généré.

Deux garde-fous en découlent :

- `env.staging` déclare explicitement `"name": "le-bureau-du-jdr-staging"`. **Sans ce
  `name`, le nom de production serait hérité et le staging écraserait la prod.**
- Le workflow vérifie le `name` du config généré avant de déployer, et s'arrête si ce
  n'est pas celui du staging.

Sans `CLOUDFLARE_ENV`, le bloc `env` est simplement retiré du config généré : **le chemin
de production (Workers Builds) est inchangé**, ce qui a été vérifié en comparant le
`.output/server/wrangler.json` produit avant et après l'ajout du bloc.

### Provisionnement (une seule fois)

Ces étapes demandent un accès au compte Cloudflare — elles ne sont pas automatisées.

1. **Créer les ressources** :

   ```bash
   npx wrangler d1 create le-bureau-du-jdr-staging
   npx wrangler kv namespace create le-bureau-du-jdr-staging-kv
   npx wrangler r2 bucket create le-bureau-du-jdr-media-staging
   ```

2. **Reporter les identifiants** dans le bloc `env.staging` de
   [wrangler.jsonc](../wrangler.jsonc), à la place des `REMPLACER_PAR_…`.
   Ce ne sont pas des secrets : les identifiants de prod y sont déjà en clair.

3. **Poser les secrets du Worker de staging.** Le `-c wrangler.jsonc` est nécessaire :
   sans lui, wrangler suit la redirection `.wrangler/deploy/config.json` vers le config
   généré, qui ne contient plus d'environnements.

   ```bash
   for s in NUXT_SESSION_PASSWORD SEED_SECRET \
            NUXT_OAUTH_DISCORD_CLIENT_ID NUXT_OAUTH_DISCORD_CLIENT_SECRET \
            NUXT_OAUTH_GOOGLE_CLIENT_ID NUXT_OAUTH_GOOGLE_CLIENT_SECRET; do
     npx wrangler secret put "$s" --env staging -c wrangler.jsonc
   done
   ```

   `NUXT_SESSION_PASSWORD` : ≥ 32 caractères, **différent de celui de la prod**.

4. **Déclarer les redirect URIs** de staging côté Discord et Google, sur
   `https://le-bureau-du-jdr-staging.<sous-domaine>.workers.dev`.

5. **Poser les secrets GitHub** (Settings → Secrets and variables → Actions) :

   | Secret | Rôle |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | jeton avec `Workers Scripts:Edit`, `D1:Edit`, `Workers R2 Storage:Edit` |
   | `CLOUDFLARE_ACCOUNT_ID` | identifiant du compte |
   | `STAGING_SEED_SECRET` | même valeur que le `SEED_SECRET` posé à l'étape 3 |

6. **Seeder le catalogue**, une fois le premier déploiement passé : lancer le workflow
   `Deploy staging` en `workflow_dispatch` avec l'entrée `seed`, par tranches — le seed
   complet dépasse la limite de requêtes D1 par invocation (cf.
   [server/db/seeds/run.ts](../server/db/seeds/run.ts)).

### Au quotidien

Rien à faire : chaque push sur une PR redéploie le staging et met l'URL à jour dans le
commentaire. Le catalogue vit dans la D1 de staging et survit aux déploiements — c'est
pourquoi le seed n'est **pas** rejoué à chaque push. Après une migration qui ajoute du
contenu de catalogue, relancer le workflow à la main avec l'entrée `seed`.

---

## Ce qui a été écarté, et pourquoi

**Les Preview URLs natives de Workers Builds.** Ce sont des *versions* du même Worker :
elles réutilisent les bindings de production. Une preview de PR taperait donc la **D1 de
prod**. Et `wrangler versions upload` n'applique pas les migrations — inutilisable pour
tester un changement de schéma, qui est précisément le cas où une preview servirait.

**Une preview éphémère par PR.** Deux blocages propres à ce projet :

- le catalogue doit être seedé par base, et il l'est déjà par tranches parce que le seed
  complet dépasse la limite de requêtes D1 par invocation — multiplier ça par PR coûte cher ;
- l'OAuth exige de déclarer chaque redirect URI à l'avance chez Discord et Google, ce qui
  est impossible avec un domaine par PR. La connexion serait cassée sur chaque preview,
  c'est-à-dire sur la majorité de l'app.

À un contributeur, un staging partagé donne le même service sans ces deux problèmes.
