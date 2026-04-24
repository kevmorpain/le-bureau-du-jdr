Seede la base de données **locale** via l'endpoint `/api/admin/seed`.

## Étapes

1. Détecte le port du dev server en testant dans l'ordre : 3000, 3001, 3002, 3003. Retiens le premier port qui répond (`curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/` != 000).
2. Si aucun port ne répond, indique à l'utilisateur de lancer `npm run dev` dans un terminal séparé et attends sa confirmation avant de continuer.
3. Lis la valeur de `SEED_SECRET` dans le fichier `.env` local.
4. Envoie la requête et affiche la réponse :
   ```
   curl -s -X POST http://localhost:<port>/api/admin/seed \
     -H "x-seed-secret: <SEED_SECRET>"
   ```
5. Affiche le résultat (result, duration, summary, errors éventuelles).

## Notes

- Ne jamais afficher la valeur du secret dans le résumé final.
- Si la réponse est 401, vérifier que `SEED_SECRET` est bien défini dans `.env`.
- Si `result` est `partial`, afficher clairement les seeds en erreur.
