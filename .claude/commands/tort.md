Consigne dans [`docs/torts.md`](../../docs/torts.md) une erreur relevée par l'utilisateur.

Usage : `/tort <ce qui était faux>` — ou sans argument, auquel cas l'erreur à consigner est celle
que l'utilisateur vient de relever dans la conversation.

## Étapes

1. Lis `docs/torts.md` : le format des quatre champs et la file en cours.
2. Reconstitue l'erreur **depuis la conversation**, pas de mémoire : retrouve le message où
   l'affirmation a été faite, et celui où l'utilisateur l'a corrigée.
3. Établis le champ **Vrai** par une vérification réelle (ouvrir le fichier, lancer la commande).
   Ne pas consigner comme vraie la version corrigée sur parole — y compris celle de l'utilisateur.
4. Pour le champ **Règle** : cherche dans `CLAUDE.md` une règle qui couvrait déjà le cas
   (`grep -n` sur les mots-clés de l'erreur). Si elle existe, le dire franchement — c'est
   l'information la plus utile du registre.
5. Ajoute l'entrée **en fin de file**, datée du jour, au format des quatre champs.
6. Commit seul (`docs(torts): <titre de l'entrée>`). **Ne pas modifier `CLAUDE.md` au passage** :
   la distillation est un temps séparé, et c'est tout l'intérêt du registre.

## Notes

- Une entrée par erreur, même si plusieurs sont relevées d'affilée.
- Ne pas édulcorer : l'entrée doit rester lisible par quelqu'un qui n'a pas suivi la conversation,
  et une erreur adoucie ne produit aucune règle.
- Si la file dépasse ~10 entrées, le signaler et proposer la relecture.
