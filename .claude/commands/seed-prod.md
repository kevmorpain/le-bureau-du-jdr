Seede la base de données de **production** (D1 Cloudflare) via l'endpoint `/api/admin/seed`.

## Prérequis

- `SEED_SECRET` doit être défini dans les variables d'environnement Cloudflare (Workers → Settings → Variables)
- Le code doit être déployé en prod (CI doit avoir tourné)

## Étapes

1. Lis la valeur de `SEED_SECRET` dans le fichier `.env` local.
2. Envoie la requête suivante et affiche la réponse :
   ```
   curl -s -X POST https://le-bureau-du-jdr.krave.workers.dev/api/admin/seed \
     -H "x-seed-secret: <SEED_SECRET>"
   ```
3. Affiche le résultat (result, duration, summary, errors éventuelles).

## Notes

- Si la réponse est 401, vérifier que `SEED_SECRET` correspond bien à la variable configurée sur Cloudflare.
- Si `result` est `partial`, afficher clairement les seeds en erreur.
- Ne jamais afficher la valeur du secret dans le résumé final.
