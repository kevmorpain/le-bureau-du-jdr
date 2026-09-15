#!/usr/bin/env bash
#
# Smoke test du Worker sur workerd — le vrai runtime Cloudflare — avec D1/KV/R2 émulés
# par Miniflare. Aucun compte ni credential Cloudflare n'est requis : tout tourne hors ligne.
#
# Couvre ce que ni Vitest (qui tourne sous Node) ni `nuxt build` ne voient : un handler qui
# plante sous workerd, un seed non idempotent, un binding qui ne répond pas au runtime.
#
# Prérequis (cf. CLAUDE.md § « Instancier Cloudflare en local ») :
#   npm run build
#   npx wrangler d1 migrations apply DB --local
#
# Utilisable tel quel en local : .github/scripts/smoke-worker.sh
#
set -euo pipefail

PORT="${PORT:-8787}"
BASE="http://127.0.0.1:${PORT}"
# Valeurs factices : rien ici ne touche la prod (bindings émulés, état dans .wrangler/state).
SEED_SECRET="${SEED_SECRET:-smoke_only_dummy_seed_secret}"
NUXT_SESSION_PASSWORD="${NUXT_SESSION_PASSWORD:-smoke_only_dummy_session_password_32c}"

LOG="$(mktemp -t wrangler-dev-XXXXXX.log)"

fail() {
  echo "::error::smoke test : $1"
  echo "----- sortie de wrangler dev -----"
  cat "$LOG"
  exit 1
}

# Lancé depuis la racine (surtout pas `--cwd .output`) : le `migrations_dir` du wrangler.json
# généré est relatif à la racine. Wrangler suit .wrangler/deploy/config.json tout seul.
npx wrangler dev --port "$PORT" --ip 127.0.0.1 \
  --var "SEED_SECRET:${SEED_SECRET}" \
  --var "NUXT_SESSION_PASSWORD:${NUXT_SESSION_PASSWORD}" \
  > "$LOG" 2>&1 &
WRANGLER_PID=$!

cleanup() {
  kill "$WRANGLER_PID" 2>/dev/null || true
  wait "$WRANGLER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# ── Boot ───────────────────────────────────────────────────────────────────────
# ~15-25 s à froid. On sort dès que le Worker répond, et on échoue vite s'il meurt.
echo "→ démarrage de wrangler dev (workerd)…"
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "${BASE}/api/magic_schools"; then break; fi
  kill -0 "$WRANGLER_PID" 2>/dev/null || fail "wrangler dev s'est arrêté avant d'écouter"
  sleep 2
done
curl -sf -o /dev/null "${BASE}/api/magic_schools" || fail "le Worker n'écoute toujours pas après 180 s"
echo "✔ Worker en écoute sur ${BASE}"

# ── Écriture : le seed traverse le Worker jusqu'à la D1 ────────────────────────
# Sous-ensemble volontairement petit (`?only=`) : on valide le chemin, pas le catalogue.
seed_response="$(curl -sf -X POST -H "x-seed-secret: ${SEED_SECRET}" \
  "${BASE}/api/admin/seed?only=abilityScores,skills,magicSchools")" \
  || fail "POST /api/admin/seed a renvoyé un statut non-2xx"

grep -q '"result":"success"' <<<"$seed_response" \
  || fail "seed non « success » → ${seed_response}"
echo "✔ seed appliqué : ${seed_response}"

# ── Idempotence : rejouer le seed ne doit rien casser ─────────────────────────
replay_response="$(curl -sf -X POST -H "x-seed-secret: ${SEED_SECRET}" \
  "${BASE}/api/admin/seed?only=magicSchools")" \
  || fail "le rejeu du seed a renvoyé un statut non-2xx"

grep -q '"result":"success"' <<<"$replay_response" \
  || fail "seed non idempotent → ${replay_response}"
echo "✔ seed idempotent : ${replay_response}"

# ── Lecture : le Worker resert ce qu'il vient d'écrire ─────────────────────────
schools="$(curl -sf "${BASE}/api/magic_schools")" || fail "GET /api/magic_schools a échoué"
grep -q 'Abjuration' <<<"$schools" \
  || fail "GET /api/magic_schools ne relit pas les données seedées → ${schools}"
echo "✔ lecture D1 OK"

# ── Authz : le endpoint d'admin reste fermé sans le secret ────────────────────
status="$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/admin/seed?only=magicSchools")"
[ "$status" = "401" ] || fail "POST /api/admin/seed sans secret devrait répondre 401, pas ${status}"
echo "✔ /api/admin/seed protégé (401 sans secret)"

echo "✅ smoke test OK"
