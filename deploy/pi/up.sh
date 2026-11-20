#!/usr/bin/env bash
# Arranque de b2b: trae los secretos de OpenBao (projects/b2b/prod), regenera .env y levanta los contenedores.
# Si el vault esta sellado o falla, NO toca el .env actual.
# Uso: ./up.sh            -> genera .env y hace `docker compose up -d`
#      ./up.sh --env-only -> solo genera .env
set -euo pipefail
cd "$(dirname "$0")"
VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
SECRET_PATH="projects/data/b2b/prod"
umask 077
tmp=$(mktemp .env.XXXXXX)
trap 'rm -f "$tmp"' EXIT
VAULT_ADDR="$VAULT_ADDR" SECRET_PATH="$SECRET_PATH" python3 -I - "$tmp" <<'PY'
import json, os, sys, urllib.request, urllib.error, re
tok = open('.vault-token').read().strip()
req = urllib.request.Request(os.environ['VAULT_ADDR'] + '/v1/' + os.environ['SECRET_PATH'],
                             headers={'X-Vault-Token': tok})
try:
    data = json.load(urllib.request.urlopen(req, timeout=10))['data']['data']
except urllib.error.HTTPError as e:
    sys.exit(f"vault respondio {e.code} (sellado? ejecuta ../vault/unseal.sh)")
except Exception as e:
    sys.exit(f"no se pudo contactar al vault: {e}")
if not data:
    sys.exit("el secreto esta vacio; no se escribe .env")
def q(v):
    if re.fullmatch(r"[A-Za-z0-9_@%+=:,./-]*", v): return v
    if "'" not in v: return "'" + v + "'"
    return '"' + v.replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$') + '"'
with open(sys.argv[1], 'w') as f:
    f.write("# GENERADO por up.sh desde OpenBao (projects/b2b/prod). No editar: editar en el vault.\n")
    for k in sorted(data): f.write(f"{k}={q(str(data[k]))}\n")
PY
mv -f "$tmp" .env; trap - EXIT
echo ".env regenerado desde el vault ($(grep -c '=' .env) variables)"
[ "${1:-}" = "--env-only" ] || docker compose up -d
