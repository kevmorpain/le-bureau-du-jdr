#!/bin/bash
# Hook SessionStart — prépare un environnement cloud (Claude Code on the web) utilisable.
#
# Sans lui, le conteneur démarre avec `node_modules/` vide : rien ne tourne, et on en
# conclut à tort que le build n'est pas testable en cloud. Il l'est (cf. la section
# « Build et tests depuis un environnement cloud » de CLAUDE.md) — il manquait juste
# l'installation des dépendances.
#
# Ne fait rien en local : la machine de dev a déjà ses dépendances et son `.env`.

set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `npm install` plutôt que `npm ci` : idempotent et incrémental, il réutilise le
# `node_modules/` déjà présent quand l'état du conteneur a été mis en cache, là où
# `npm ci` le supprime et réinstalle tout à chaque fois.
# Le postinstall `nuxt prepare` régénère `.nuxt/`, requis par le projet Vitest `nuxt`.
npm install --no-audit --no-fund

# nuxt-auth-utils exige un mot de passe de session (≥ 32 caractères) au boot, sinon les
# tests et le build échouent. Valeur factice, alignée sur .github/workflows/tests.yml :
# aucun secret réel, rien ici ne touche la production.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export NUXT_SESSION_PASSWORD=ci_only_dummy_session_password_do_not_use' >> "$CLAUDE_ENV_FILE"
fi
