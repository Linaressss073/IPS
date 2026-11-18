#!/usr/bin/env bash
# Uso: deploy/pi/smoke-test.sh [API_URL] [WEB_URL]
# Pruebas de humo y de seguridad de solo lectura contra producción (sin token, sin datos reales).
# Se ejecutan despues de cada despliegue; el codigo de salida es 1 si algo falla.
# Genera tambien algo de trafico (12 peticiones a /health, una por segundo) para ver datos en Grafana.
API="${1:-https://ips-api.devrojas.xyz}"
WEB="${2:-https://ips.devrojas.xyz}"
V1="$API/api/v1"
pass=0; fail=0

ok() { if [ "$2" = 0 ]; then echo "PASS  $1"; pass=$((pass + 1)); else echo "FAIL  $1"; fail=$((fail + 1)); fi; }
headers() { curl -s -D - -o /dev/null -m 20 "$@" | tr -d '\r'; }
status() { curl -s -o /dev/null -m 20 -w '%{http_code}' "$@"; }
has() { grep -qi "$1"; }  # lee stdin

echo "== API: $V1"
[ "$(curl -s -m 20 "$V1/health")" = '{"status":"ok","database":"up"}' ]; ok "salud: 200 con base de datos arriba" $?

H=$(headers "$V1/health")
echo "$H" | has '^strict-transport-security:'; ok "HSTS" $?
echo "$H" | has '^x-content-type-options: nosniff'; ok "X-Content-Type-Options: nosniff" $?
echo "$H" | has '^referrer-policy:'; ok "Referrer-Policy" $?
echo "$H" | has '^x-powered-by:'; [ $? -ne 0 ]; ok "sin X-Powered-By" $?

echo "-- formato de errores y acceso sin sesion"
B=$(curl -s -m 20 "$V1/teams/org_x/patients")
[ "$(status "$V1/teams/org_x/patients")" = 401 ] && echo "$B" | has '"code":"UNAUTHORIZED"'; ok "sin token: 401 UNAUTHORIZED" $?
B=$(curl -s -m 20 -H 'Authorization: Bearer invalido' "$V1/teams/org_x/patients")
echo "$B" | has '"code":"INVALID_ACCESS_TOKEN"'; ok "token invalido: INVALID_ACCESS_TOKEN" $?
B=$(curl -s -m 20 "$V1/no-existe")
[ "$(status "$V1/no-existe")" = 404 ] && echo "$B" | has '"code":"ROUTE_NOT_FOUND"'; ok "ruta inexistente: 404 ROUTE_NOT_FOUND" $?
B=$(curl -s -m 20 -X POST -H 'Content-Type: application/json' -d '{"roto":' "$V1/teams/org_x/patients")
echo "$B" | has '"code":"BAD_REQUEST"'; ok "JSON mal formado: 400 BAD_REQUEST" $?
echo "$B" | has 'stack\|node_modules\|    at '; [ $? -ne 0 ]; ok "los errores no filtran trazas" $?
for path in "/teams/org_x/patients" "/teams/org_x/consultations?patientId=x" "/teams/org_x/clinical-access?patientId=x" "/teams/org_x/staff/me"; do
  [ "$(status "$V1$path")" = 401 ]; ok "sin token: 401 en $path" $?
done
headers "$V1/teams/org_x/patients" | has '^ratelimit'; ok "limite de peticiones anunciado (RateLimit)" $?
[ "$(status -X POST -H 'Content-Type: application/json' -d '{}' "$V1/webhooks/clerk")" = 400 ]; ok "webhook de Clerk sin firma valida: 400" $?

echo "-- CORS, HTTPS y TLS"
headers -X OPTIONS -H "Origin: $WEB" -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: authorization' "$V1/teams/org_x/patients" \
  | has "^access-control-allow-origin: $WEB"; ok "CORS permite el origen de la web" $?
headers -X OPTIONS -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: GET' "$V1/teams/org_x/patients" \
  | has '^access-control-allow-origin: https://evil.example'; [ $? -ne 0 ]; ok "CORS rechaza un origen ajeno" $?
case "$(status "${API/https:/http:}/api/v1/health")" in 301|302|307|308) r=0 ;; *) r=1 ;; esac; ok "HTTP sin cifrar redirige a HTTPS" $r
echo | openssl s_client -connect "${API#https://}:443" -servername "${API#https://}" 2>/dev/null | grep -E 'Protocol *: TLSv1\.[23]' | has 'TLSv'; ok "conexion TLS 1.2 o 1.3" $?

echo "== Web: $WEB"
[ "$(status "$WEB/sign-in")" = 200 ]; ok "pantalla de inicio de sesion: 200" $?
W=$(headers "$WEB/sign-in")
echo "$W" | has '^content-security-policy:'; ok "Content-Security-Policy" $?
echo "$W" | has '^x-frame-options: \(DENY\|SAMEORIGIN\)'; ok "X-Frame-Options" $?
echo "$W" | has '^x-content-type-options: nosniff'; ok "X-Content-Type-Options: nosniff" $?
echo "$W" | has '^x-powered-by:'; [ $? -ne 0 ]; ok "sin X-Powered-By" $?
[ "$(status "$WEB/dashboard")" != 200 ]; ok "el tablero no se abre sin sesion" $?

echo "== Trafico para Grafana (12 peticiones a /health, 1 por segundo)"
all=0; total=0; max=0
for i in $(seq 1 12); do
  t=$(curl -s -o /dev/null -m 20 -w '%{http_code} %{time_total}' "$V1/health")
  [ "${t%% *}" = 200 ] || all=1
  ms=$(awk -v s="${t##* }" 'BEGIN { printf "%d", s * 1000 }')
  total=$((total + ms)); [ "$ms" -gt "$max" ] && max=$ms
  sleep 1
done
echo "latencia: media $((total / 12)) ms, maxima $max ms"
[ "$all" = 0 ]; ok "12 de 12 respuestas 200" $?

echo
echo "Resultado: $pass superadas, $fail fallidas"
[ "$fail" = 0 ]
