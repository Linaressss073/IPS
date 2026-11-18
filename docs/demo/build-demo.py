#!/usr/bin/env python3
"""Genera docs/demo/IPS-proyecto.html: una sola página, sin dependencias externas, con las capturas de docs/demo/img incrustadas.

Uso (desde la raiz del repo):  python docs/demo/build-demo.py
Los numeros de pruebas y cobertura se actualizan a mano en CIFRAS (salen de `pnpm test`, `pnpm test:e2e`, `pnpm test` del frontend y SonarCloud);
los commits por semana se calculan de git.
"""
import base64, colorsys, datetime, os, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(os.path.dirname(__file__), 'IPS-proyecto.html')
IMG = os.path.join(os.path.dirname(__file__), 'img')

# --- cifras verificadas (18-nov-2026)
TESTS = {'unit': 112, 'e2e': 65, 'web': 34}
COVERAGE = '88,1'
SMOKE = 28


def hsl(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))


COL = {
    'INK': hsl(211, 45, 12), 'INK2': hsl(211, 40, 17), 'GREEN': hsl(158, 72, 29), 'GREENL': hsl(158, 62, 52),
    'BLUE': hsl(207, 82, 40), 'BLUEL': hsl(207, 85, 66), 'PAPER': hsl(210, 30, 97), 'LINE': hsl(210, 26, 88),
    'RED': hsl(0, 74, 42), 'AMBER': hsl(40, 90, 52), 'MUTED': hsl(211, 20, 36), 'MUTEDL': hsl(210, 22, 78),
}


def img(name):
    with open(os.path.join(IMG, name + '.jpg'), 'rb') as f:
        return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()


def commits_by_week():
    out = subprocess.run(['git', 'log', '--format=%ad', '--date=format:%G-%V'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    counts = {}
    for w in out:
        counts[w] = counts.get(w, 0) + 1
    first = sorted(counts)[0]
    last = sorted(counts)[-1]
    year = int(first[:4])
    weeks = list(range(int(first[5:]), int(last[5:]) + 1))
    return [(w, counts.get(f'{year}-{w:02d}', 0)) for w in weeks], len(out), year


MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']


def semana_html():
    weeks, total, year = commits_by_week()
    mx = max(c for _, c in weeks)
    cols = []
    for w, c in weeks:
        d = datetime.date.fromisocalendar(year, w, 1)
        pct = 0 if c == 0 else max(4, round(c / mx * 100))
        cols.append(
            f'<div class="col"><span class="v">{c}</span><div class="bar" style="height:{pct}%" aria-hidden="true"></div>'
            f'<span class="l">Sem {w}<small>{d.day} {MESES[d.month - 1]}</small></span></div>')
    last = weeks[-1][1]
    resumen = ', '.join(f'semana {w}: {c}' for w, c in weeks)
    chart = (f'<div class="semanas" role="img" aria-label="Commits por semana ISO. {resumen}">' + ''.join(cols) + '</div>')
    return chart, total, round(last / total * 100)


CHART, TOTAL_COMMITS, PCT_LAST = semana_html()

TEMPLATE = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IPS Consulta Externa, el proyecto</title>
<style>
:root {
  --ink: @@INK@@; --ink2: @@INK2@@; --green: @@GREEN@@; --greenl: @@GREENL@@; --blue: @@BLUE@@; --bluel: @@BLUEL@@;
  --paper: @@PAPER@@; --white: #fff; --line: @@LINE@@; --red: @@RED@@; --amber: @@AMBER@@; --muted: @@MUTED@@; --mutedl: @@MUTEDL@@;
  --font: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color-scheme: light;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 64px; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.6 var(--font); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { line-height: 1.15; letter-spacing: -.02em; text-wrap: balance; margin: 0 0 .5em; }
h1 { font-size: clamp(32px, 5vw, 54px); font-weight: 800; }
h2 { font-size: clamp(25px, 3vw, 34px); font-weight: 800; }
h3 { font-size: 18px; font-weight: 700; }
p { margin: 0 0 1em; }
a { color: var(--blue); }
:focus-visible { outline: 3px solid var(--amber); outline-offset: 2px; border-radius: 6px; }
.wrap { width: min(1120px, 100% - 40px); margin: 0 auto; }
.lead { font-size: 18px; color: var(--muted); max-width: 70ch; }
section { padding: 64px 0; }
.dark { background: var(--ink); color: #fff; }
.dark .lead, .dark p { color: var(--mutedl); }
.dark a { color: var(--bluel); }
.eti { display: inline-block; font-size: 12.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--green); margin-bottom: 10px; }
.dark .eti { color: var(--greenl); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip { position: absolute; left: 12px; top: -60px; background: #fff; color: var(--ink); padding: 10px 14px; border-radius: 8px; z-index: 50; font-weight: 700; }
.skip:focus { top: 10px; }

/* Navegacion */
.nav { position: sticky; top: 0; z-index: 20; background: rgba(17,34,51,.94); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,.1); }
.nav .wrap { display: flex; align-items: center; gap: 18px; min-height: 52px; overflow-x: auto; }
.nav b { color: #fff; white-space: nowrap; }
.nav b i { font-style: normal; color: var(--greenl); }
.nav a { color: #D5DEE8; text-decoration: none; font-size: 14.5px; font-weight: 600; white-space: nowrap; padding: 6px 4px; }
.nav a:hover { color: #fff; }

/* Portada */
header.portada { background: radial-gradient(900px 420px at 85% -10%, rgba(21,128,89,.45), transparent 60%), radial-gradient(700px 380px at 0% 120%, rgba(18,99,186,.35), transparent 60%), var(--ink); color: #fff; padding: 56px 0 60px; }
.portada h1 em { font-style: normal; color: var(--greenl); }
.portada .lead { color: #C3CFDB; }
.cifras { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-top: 34px; }
.cifra { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); border-radius: 14px; padding: 16px 18px; }
.cifra b { display: block; font-size: 30px; font-weight: 800; font-variant-numeric: tabular-nums; }
.cifra span { font-size: 13.5px; color: #B7C4D2; }
.franja { height: 6px; background: linear-gradient(90deg, var(--green), var(--blue)); }

/* Tarjetas y etiquetas */
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 18px; }
.card { background: var(--white); border: 1px solid var(--line); border-radius: 16px; padding: 22px; box-shadow: 0 1px 2px rgba(17,34,51,.05), 0 8px 24px rgba(17,34,51,.05); }
.dark .card { background: var(--ink2); border-color: rgba(255,255,255,.12); box-shadow: none; }
.card h3 { margin-bottom: 6px; }
.card ul { margin: 8px 0 0; padding-left: 20px; } .card li { margin: 4px 0; }
.chip { display: inline-block; font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 99px; margin: 0 6px 6px 0; }
.chip.ok { background: #DDF4E8; color: #0C5A38; } .chip.pend { background: #FFF1CC; color: #7A5200; }
.chip.info { background: #DDEBFA; color: #0E4A8A; } .chip.rol { background: #E8ECF1; color: var(--ink); }
.dark .chip.ok { background: rgba(60,200,140,.2); color: #8DE8BC; } .dark .chip.pend { background: rgba(240,180,40,.2); color: #FFD97A; }
.cita { border-left: 4px solid var(--amber); padding: 4px 0 4px 14px; margin: 0 0 22px; font-style: italic; color: var(--muted); max-width: 80ch; }

/* Tablas */
.tabla { overflow-x: auto; border-radius: 14px; border: 1px solid var(--line); background: var(--white); }
table { border-collapse: collapse; width: 100%; font-size: 15px; font-variant-numeric: tabular-nums; }
caption { text-align: left; padding: 12px 14px; font-weight: 700; }
th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); background: #F6F8FA; }
tr:last-child td { border-bottom: 0; }
td.n, th.n { text-align: right; }
.si { color: var(--green); font-weight: 800; } .no { color: #8A98A8; }

/* Galeria */
.filtros { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0 22px; }
.filtros button { font: inherit; font-weight: 700; font-size: 14px; padding: 7px 14px; border-radius: 99px; border: 1px solid var(--line); background: #fff; color: var(--ink); cursor: pointer; }
.filtros button[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: #fff; }
.dark .filtros button[aria-pressed="true"] { background: var(--greenl); border-color: var(--greenl); color: var(--ink); }
.gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(330px, 100%), 1fr)); gap: 18px; }
.fig { background: var(--white); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
.fig[hidden] { display: none; }
.fig button { all: unset; cursor: zoom-in; display: block; aspect-ratio: 16 / 9; overflow: hidden; border-bottom: 1px solid var(--line); }
.fig button:focus-visible { outline: 3px solid var(--amber); outline-offset: -3px; }
.fig img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.fig figcaption { padding: 14px 16px 16px; font-size: 14.5px; color: var(--muted); }
.fig figcaption b { display: block; color: var(--ink); font-size: 16px; margin-bottom: 2px; }
dialog { border: 0; padding: 0; background: transparent; max-width: min(1300px, 96vw); }
dialog::backdrop { background: rgba(8,16,26,.88); }
dialog img { max-width: 100%; max-height: 82vh; border-radius: 12px; display: block; }
dialog p { color: #fff; text-align: center; margin: 10px 0 0; font-weight: 700; }
dialog button { position: absolute; top: 8px; right: 8px; font: inherit; font-weight: 800; background: var(--green); color: #fff; border: 0; border-radius: 99px; width: 40px; height: 40px; cursor: pointer; }

/* Pasos */
.pasos { list-style: none; counter-reset: p; padding: 0; margin: 24px 0 0; display: grid; gap: 12px; }
.pasos li { counter-increment: p; background: var(--white); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px 14px 62px; position: relative; }
.pasos li::before { content: counter(p); position: absolute; left: 16px; top: 14px; width: 32px; height: 32px; border-radius: 50%; background: var(--green); color: #fff; font-weight: 800; display: grid; place-items: center; }
.pasos b { display: block; } .pasos span { color: var(--muted); font-size: 14.5px; }

/* Explorador de roles */
.roles { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0; }
.roles button { font: inherit; font-weight: 700; font-size: 14px; padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.25); background: transparent; color: #fff; cursor: pointer; }
.roles button[aria-pressed="true"] { background: var(--greenl); border-color: var(--greenl); color: var(--ink); }
.perm { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr)); gap: 8px; }
.perm div { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; background: var(--ink2); border: 1px solid rgba(255,255,255,.1); font-size: 14.5px; color: #8EA0B3; }
.perm div.on { color: #fff; border-color: var(--greenl); background: rgba(60,200,140,.12); }
.perm div i { font-style: normal; font-weight: 800; width: 18px; text-align: center; }
.perm div.on i { color: var(--greenl); }
.nota { margin-top: 14px; padding: 12px 14px; border-radius: 10px; background: rgba(233,178,58,.14); border: 1px solid rgba(233,178,58,.4); color: #F4DDA5; font-size: 14.5px; }

/* Cadena de CI */
.ci { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; align-items: stretch; margin: 18px 0; }
.ci div { background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 12px; text-align: center; font-size: 14px; }
.ci div b { display: block; font-family: var(--mono); font-size: 13px; color: var(--green); }
.barras { display: grid; gap: 10px; margin: 14px 0 0; }
.barra { display: grid; grid-template-columns: 150px 1fr 48px; gap: 12px; align-items: center; font-size: 14.5px; }
.barra div { height: 14px; border-radius: 7px; background: var(--green); }
.barra span:last-child { font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }

/* Validacion */
.val { display: grid; grid-template-columns: 1.15fr 1fr; gap: 24px; align-items: start; }
.val label { display: block; font-weight: 700; font-size: 14px; margin: 10px 0 4px; }
.val select, .val input[type=number] { font: inherit; padding: 8px 10px; border-radius: 8px; border: 1px solid #8696A8; background: #fff; color: var(--ink); width: 100%; }
.tarea { display: grid; grid-template-columns: 1fr 150px 90px; gap: 8px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); }
.tarea span { font-size: 14.5px; }
.sus { display: grid; gap: 4px; }
.sus div { display: grid; grid-template-columns: 1fr 74px; gap: 8px; align-items: center; font-size: 14px; padding: 4px 0; border-bottom: 1px solid var(--line); }
.btn { font: inherit; font-weight: 800; padding: 10px 16px; border-radius: 10px; border: 0; background: var(--green); color: #fff; cursor: pointer; }
.btn.sec { background: #fff; color: var(--ink); border: 1px solid #8696A8; }
.btn.peligro { background: var(--red); }
.acciones { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
.resumen { font-size: 15px; margin-top: 14px; padding: 12px 14px; border-radius: 10px; background: #EEF6F2; border: 1px solid #BFE0CF; }

/* Pruebas de seguridad */
.grupos { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr)); gap: 14px; }
.grupo { background: var(--ink2); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 16px 18px; }
.grupo h3 { font-size: 15px; color: var(--greenl); letter-spacing: .04em; text-transform: uppercase; }
.grupo ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; font-size: 14.5px; color: #E2E9F0; }
.grupo li::before { content: 'PASA'; display: inline-block; font-size: 10.5px; font-weight: 800; background: rgba(60,200,140,.2); color: #8DE8BC; padding: 1px 7px; border-radius: 6px; margin-right: 8px; vertical-align: 1px; }
pre { font-family: var(--mono); font-size: 13.5px; background: #0B1622; color: #E6EDF4; padding: 14px 16px; border-radius: 12px; overflow-x: auto; margin: 0; }
.cmd { display: flex; gap: 10px; align-items: stretch; margin: 14px 0; }
.cmd pre { flex: 1; }
.hall { display: grid; gap: 12px; margin-top: 8px; }
.hall > div { background: var(--white); border: 1px solid var(--line); border-left: 5px solid var(--green); border-radius: 12px; padding: 14px 16px; }
.hall > div.p { border-left-color: var(--amber); }
.hall b { display: block; margin-bottom: 2px; } .hall span { color: var(--muted); font-size: 14.5px; }

/* Ritmo */
.semanas { display: flex; align-items: flex-end; gap: 10px; height: 190px; padding: 22px 6px 0; border-bottom: 2px solid var(--line); margin: 18px 0 0; }
.col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
.col .bar { width: 100%; max-width: 54px; background: var(--blue); border-radius: 6px 6px 0 0; min-height: 0; }
.col .v { font-weight: 800; font-size: 14px; font-variant-numeric: tabular-nums; }
.col .l small { display: block; font-size: 11.5px; }
.col .l { font-size: 12.5px; color: var(--muted); text-align: center; line-height: 1.2; margin-top: 6px; transform: translateY(100%); position: absolute; }
.semanas .col { position: relative; }
.espacio { height: 40px; }

/* Arquitectura */
.arq { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.capa { border-radius: 14px; padding: 16px; background: var(--ink2); border: 1px solid rgba(255,255,255,.1); }
.capa h3 { font-size: 13.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--greenl); margin-bottom: 10px; }
.capa ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; font-size: 14.5px; color: #E2E9F0; }
.capa li::before { content: ''; display: inline-block; width: 6px; height: 6px; background: var(--blue); border-radius: 2px; margin-right: 8px; vertical-align: 2px; }

footer { background: var(--ink); color: #A9B8C8; padding: 26px 0; font-size: 14px; }
code { font-family: var(--mono); font-size: .92em; background: #E8EDF2; padding: 1px 6px; border-radius: 5px; }
.dark code { background: rgba(255,255,255,.1); }
@media (max-width: 860px) { .val { grid-template-columns: 1fr; } .tarea { grid-template-columns: 1fr 1fr; } .tarea span { grid-column: 1 / -1; } .barra { grid-template-columns: 110px 1fr 40px; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } * { transition: none !important; } }
</style>
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>
<nav class="nav" aria-label="Secciones">
  <div class="wrap">
    <b>IPS <i>Consulta Externa</i></b>
    <a href="#docente">Observaciones</a><a href="#demo">Demo</a><a href="#pruebas">Pruebas</a><a href="#validacion">Validación</a>
    <a href="#seguridad">Seguridad</a><a href="#entrega">Entrega</a><a href="#arquitectura">Arquitectura</a><a href="#estado">Estado</a>
  </div>
</nav>

<header class="portada">
  <div class="wrap">
    <span class="eti" style="color:var(--greenl)">El proyecto completo · demo</span>
    <h1>Sistema de información hospitalaria para la consulta externa: <em>un registro por paciente, todo trazado, probado y protegido</em></h1>
    <p class="lead">Agendamiento, admisión con turnos y pantalla de sala, consulta médica con firma y fórmula, y farmacia con inventario. Cada IPS ve solo lo suyo, cada persona solo lo que su rol permite, y cada cambio (y cada lectura de una historia clínica) deja rastro. En producción en <a href="https://ips.devrojas.xyz" style="color:var(--bluel)">ips.devrojas.xyz</a>.</p>
    <div class="cifras">
      <div class="cifra"><b>@@TOTAL_TESTS@@</b><span>pruebas automáticas (unitarias, e2e y web)</span></div>
      <div class="cifra"><b>@@COVERAGE@@ %</b><span>cobertura medida por SonarCloud</span></div>
      <div class="cifra"><b>@@SMOKE@@/@@SMOKE@@</b><span>pruebas de seguridad en producción</span></div>
      <div class="cifra"><b>0</b><span>bugs, vulnerabilidades y <i>code smells</i> abiertos</span></div>
      <div class="cifra"><b>8</b><span>contextos de negocio (DDD) en la API</span></div>
      <div class="cifra"><b>13</b><span>permisos asignados por rol</span></div>
    </div>
  </div>
</header>
<div class="franja" aria-hidden="true"></div>

<main id="contenido">

<section id="docente">
  <div class="wrap">
    <span class="eti">Lo primero</span>
    <h2>Las tres observaciones del docente, una por una</h2>
    <p class="cita">«Reforzar la evidencia de pruebas y validación con usuarios, profundizar en la seguridad y protección de los datos de salud, y evitar dejar la entrega para el último día.» · Calificación 4,2 / 5,0</p>
    <div class="cards">
      <article class="card">
        <span class="chip ok">Pruebas: hecho</span><span class="chip pend">Usuarios: por realizar</span>
        <h3>Evidencia de pruebas y validación con usuarios</h3>
        <ul>
          <li>@@TOTAL_TESTS@@ pruebas automáticas; la API se prueba con una base MongoDB real en contenedor.</li>
          <li>Cadena de CI que bloquea el despliegue si algo falla, y SonarCloud con el <i>quality gate</i> aprobado.</li>
          <li>Revisión de accesibilidad con 8 hallazgos corregidos.</li>
          <li>Protocolo de usabilidad por rol y una herramienta para registrar tareas y el cuestionario SUS. <b>Los resultados con personas reales aún no existen.</b></li>
        </ul>
        <p style="margin-top:12px"><a href="#pruebas">Ver pruebas</a> · <a href="#validacion">Registrar validación</a></p>
      </article>
      <article class="card">
        <span class="chip ok">Hecho</span><span class="chip pend">2 brechas declaradas</span>
        <h3>Seguridad y protección de los datos de salud</h3>
        <ul>
          <li>Aislamiento por IPS, permisos por rol y la historia clínica solo para médicos.</li>
          <li><b>Registro de quién lee cada historia</b> y autorización del titular (Ley 1581 de 2012).</li>
          <li>HTTPS forzado, cabeceras de seguridad, límite de peticiones y logs sin datos de salud.</li>
          <li>@@SMOKE@@ pruebas de seguridad en producción, y los fallos encontrados por el camino, corregidos.</li>
        </ul>
        <p style="margin-top:12px"><a href="#seguridad">Ver seguridad</a></p>
      </article>
      <article class="card">
        <span class="chip pend">Parcial</span><span class="chip ok">Medidas en marcha</span>
        <h3>No dejar la entrega para el último día</h3>
        <ul>
          <li>Sprints semanales en Jira desde el primer commit (1 de octubre).</li>
          <li>El historial real muestra ráfagas de trabajo, no un ritmo parejo: se muestra tal cual.</li>
          <li>Lo que cambió: CI obligatorio, pruebas de humo tras cada despliegue y una definición de terminado.</li>
        </ul>
        <p style="margin-top:12px"><a href="#entrega">Ver ritmo y cierre</a></p>
      </article>
    </div>
  </div>
</section>

<section class="dark" id="demo">
  <div class="wrap">
    <span class="eti">Producción, hoy</span>
    <h2>La plataforma funcionando</h2>
    <p class="lead">Capturas reales de <b>ips.devrojas.xyz</b>, de la API y de las herramientas que la vigilan. No contienen datos de pacientes.</p>
    <div class="filtros" role="group" aria-label="Filtrar capturas">
      <button type="button" data-f="todo" aria-pressed="true">Todas</button>
      <button type="button" data-f="producto" aria-pressed="false">Producto</button>
      <button type="button" data-f="calidad" aria-pressed="false">Pruebas y calidad</button>
      <button type="button" data-f="operacion" aria-pressed="false">Operación y datos</button>
    </div>
    <div class="gal" id="gal">
      @@GALERIA@@
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <span class="eti">Guion de la demo</span>
    <h2>Recorrido en 8 pasos (≈ 10 minutos)</h2>
    <p class="lead">El mismo orden de un paciente real, cambiando de rol en cada paso. Se hace con datos ficticios en una organización de demostración.</p>
    <ol class="pasos">
      <li><span class="chip rol">Agendamiento</span><b>Registrar un paciente marcando la autorización de datos</b><span>Un solo registro por documento y por IPS; queda quién autorizó y cuándo (Ley 1581 de 2012).</span></li>
      <li><span class="chip rol">Agendamiento</span><b>Agendar una cita en un cupo libre</b><span>Agendas por profesional divididas en cupos; no hay choques de horario.</span></li>
      <li><span class="chip rol">Admisión</span><b>Registrar la llegada y generar el turno</b><span>Turno por servicio (por ejemplo RTH 4) con reanuncio automático.</span></li>
      <li><span class="chip rol">Sala</span><b>Abrir la pantalla de llamado en otra ventana</b><span>Campanada y voz en español; avisa en grande si el sonido está apagado o si falta la conexión.</span></li>
      <li><span class="chip rol">Médico</span><b>Llamar, escribir la consulta y firmarla con la fórmula</b><span>Al intentar editarla firmada se rechaza: solo admite notas aclaratorias. Historia inmutable.</span></li>
      <li><span class="chip rol">Farmacia</span><b>Dispensar parcialmente y luego completar</b><span>Inventario por lotes, sin entregar más de lo pendiente ni lotes vencidos.</span></li>
      <li><span class="chip rol">Seguridad</span><b>Agendamiento intenta abrir una consulta: denegado. Administración abre el registro de accesos</b><span>Mínimo privilegio y trazabilidad de lecturas: quién abrió qué y cuándo, sin contenido clínico.</span></li>
      <li><span class="chip rol">Terminal</span><b>Ejecutar <code>bash deploy/pi/smoke-test.sh</code> (≈ 40 s)</b><span>@@SMOKE@@ pruebas de seguridad de solo lectura contra producción, en vivo.</span></li>
    </ol>
  </div>
</section>

<section class="dark" id="roles">
  <div class="wrap">
    <span class="eti">Probalo tú</span>
    <h2>Explorador de roles: cada quien hace solo lo suyo</h2>
    <p class="lead">Elige un rol y mira qué permisos tiene. Los datos son la matriz real del sistema (<code>permissions.ts</code>), que además se verifica con una prueba unitaria.</p>
    <div class="roles" id="roles-btns" role="group" aria-label="Rol"></div>
    <div class="perm" id="perm" aria-live="polite"></div>
    <p class="nota" id="rol-nota"></p>
  </div>
</section>

<section id="pruebas">
  <div class="wrap">
    <span class="eti">Observación 1 · pruebas</span>
    <h2>Verificado con pruebas, no con promesas</h2>
    <p class="lead">Las pruebas corren en cada <i>push</i>. La API se prueba de extremo a extremo con <b>MongoDB real</b> (un contenedor por ejecución, con transacciones) y solo se simula a Clerk.</p>
    <div class="barras" aria-label="Pruebas por capa">
      <div class="barra"><span>Unitarias (API)</span><div style="width:@@W_UNIT@@%"></div><span>@@T_UNIT@@</span></div>
      <div class="barra"><span>E2E de la API</span><div style="width:@@W_E2E@@%"></div><span>@@T_E2E@@</span></div>
      <div class="barra"><span>Frontend</span><div style="width:@@W_WEB@@%"></div><span>@@T_WEB@@</span></div>
    </div>
    <h3 style="margin-top:28px">La cadena de CI: nada se despliega si algo falla</h3>
    <div class="ci" aria-label="Etapas del CI">
      <div><b>lint-api</b>estilo y tipos</div><div><b>build-api</b>compila la API</div><div><b>unit-api</b>unitarias</div>
      <div><b>e2e-api</b>MongoDB real</div><div><b>sonar</b>calidad y cobertura</div><div><b>web</b>tipos, pruebas y build</div><div><b>ci-ok</b>compuerta final</div>
    </div>
    <div class="cards" style="margin-top:22px">
      <div class="card"><h3>SonarCloud</h3><p><span class="chip ok">Gate aprobado</span></p><ul><li>@@COVERAGE@@ % de cobertura (mínimo del proyecto: 80 %)</li><li>0 bugs, 0 vulnerabilidades, 0 <i>hotspots</i>, 0 <i>code smells</i></li><li>Calificación A en seguridad, fiabilidad y mantenibilidad</li></ul></div>
      <div class="card"><h3>Accesibilidad</h3><p><span class="chip ok">Corregido</span></p><ul><li>Contraste de bordes: de 1,3:1 a 3,9:1</li><li>34 mensajes de error anunciados a lectores de pantalla</li><li>21 campos con nombre accesible, tablas con título, «Saltar al contenido»</li></ul></div>
      <div class="card"><h3>Lo que aún no cubre</h3><p><span class="chip pend">Honesto</span></p><ul><li>Pruebas automáticas de la interfaz de extremo a extremo (IPS-152)</li><li>Pruebas de carga y de penetración</li></ul></div>
    </div>
  </div>
</section>

<section class="dark" id="validacion">
  <div class="wrap">
    <span class="eti">Observación 1 · usuarios</span>
    <h2>Validación con usuarios: protocolo y registro</h2>
    <p class="lead">El protocolo define 7 tareas por rol y el cuestionario SUS. <b>Aún no se han hecho las sesiones</b>: esta herramienta sirve para registrarlas en el momento, y los resultados quedan solo en este navegador (se pueden exportar a CSV). Meta: ≥ 80 % de tareas sin ayuda y SUS ≥ 68.</p>
    <div class="val card" style="color:var(--ink); background:#fff">
      <form id="val-form" novalidate>
        <h3>Sesión con un participante</h3>
        <label for="v-part">Participante</label>
        <select id="v-part"><option>P1</option><option>P2</option><option>P3</option><option>P4</option><option>P5</option></select>
        <label for="v-rol">Rol</label>
        <select id="v-rol"><option>Administración</option><option>Agendamiento / admisión</option><option>Médico</option><option>Farmacia</option><option>Uso de teclado o lector de pantalla</option></select>
        <h3 style="margin-top:18px">Tareas</h3>
        <div id="v-tareas"></div>
        <h3 style="margin-top:18px">Cuestionario SUS <small style="font-weight:400">(1 = muy en desacuerdo, 5 = muy de acuerdo)</small></h3>
        <div class="sus" id="v-sus"></div>
        <div class="acciones">
          <button class="btn" type="submit">Guardar participante</button>
          <button class="btn sec" type="button" id="v-csv">Exportar CSV</button>
          <button class="btn sec peligro" type="button" id="v-borrar">Borrar todo</button>
        </div>
        <p id="v-msg" role="status" style="margin:10px 0 0; font-size:14px; color:var(--muted)"></p>
      </form>
      <div>
        <h3>Resultados guardados</h3>
        <div class="tabla"><table><thead><tr><th>Part.</th><th>Rol</th><th class="n">Sin ayuda</th><th class="n">SUS</th></tr></thead><tbody id="v-tabla"><tr><td colspan="4" style="color:var(--muted)">Aún no hay sesiones registradas.</td></tr></tbody></table></div>
        <div class="resumen" id="v-resumen">Sin datos todavía.</div>
      </div>
    </div>
  </div>
</section>

<section id="seguridad">
  <div class="wrap">
    <span class="eti">Observación 2 · seguridad</span>
    <h2>Seguridad y protección de los datos de salud</h2>
    <p class="lead">Los datos de salud son datos personales sensibles. Cada control tiene una norma que lo respalda y una evidencia que se puede mostrar.</p>
    <p>
      <span class="chip info">Ley 1581 de 2012 · Habeas Data</span><span class="chip info">Resolución 1995 de 1999 · historia clínica</span>
      <span class="chip info">Ley 23 de 1981 · reserva</span><span class="chip info">Ley 527 de 1999 · firma electrónica</span>
    </p>
    <div class="tabla"><table>
      <caption>Controles implementados</caption>
      <thead><tr><th>Control</th><th>Cómo se hace</th><th>Evidencia</th></tr></thead>
      <tbody>
        <tr><td>Cada IPS ve solo lo suyo</td><td>Todo se consulta por IPS (<code>teamId</code>); el de la ruta debe coincidir con la membresía</td><td>Prueba e2e de aislamiento entre IPS</td></tr>
        <tr><td>Mínimo privilegio</td><td>13 permisos asignados por rol; la historia clínica solo para médicos, ni los administradores la leen</td><td>Prueba de la matriz de permisos</td></tr>
        <tr><td>Quién leyó la historia</td><td>Abrir una consulta, un historial o una fórmula guarda quién y cuándo, sin contenido clínico; si no se puede registrar, la lectura falla</td><td>e2e del registro de accesos</td></tr>
        <tr><td>Autorización del titular</td><td>Se guarda quién y cuándo se registró; editar al paciente no la modifica</td><td>Pruebas del agregado y e2e</td></tr>
        <tr><td>Historia inmutable</td><td>Una consulta firmada solo admite notas aclaratorias; los eventos de auditoría solo se agregan</td><td>e2e de consulta</td></tr>
        <tr><td>Datos mínimos del personal</td><td>Correo enmascarado, anonimización al eliminar a la persona (derecho al olvido)</td><td>Pruebas de staff</td></tr>
        <tr><td>Transporte y perímetro</td><td>HTTPS forzado, TLS 1.3, cabeceras (HSTS, CSP, nosniff), CORS solo para la web, límite de peticiones</td><td>@@SMOKE@@ pruebas en producción</td></tr>
        <tr><td>Logs sin datos de salud</td><td>Rutas como plantilla, sin cuerpos, cabeceras ni valores de consulta; los errores registran solo códigos</td><td>Pruebas del registro de logs y del correo</td></tr>
      </tbody>
    </table></div>
  </div>
</section>

<section class="dark">
  <div class="wrap">
    <span class="eti">En producción, en vivo</span>
    <h2>@@SMOKE@@ pruebas de seguridad en 40 segundos</h2>
    <p class="lead">Un script de solo lectura (sin token ni datos reales) que se ejecuta tras cada despliegue. El 18 de noviembre de 2026 dio @@SMOKE@@ de @@SMOKE@@.</p>
    <div class="cmd"><pre id="cmd">bash deploy/pi/smoke-test.sh</pre><button class="btn" type="button" id="copiar" aria-label="Copiar el comando">Copiar</button></div>
    <div class="grupos">
      <div class="grupo"><h3>Cabeceras de la API (5)</h3><ul><li>Salud 200 con la base de datos arriba</li><li>Strict-Transport-Security</li><li>X-Content-Type-Options: nosniff</li><li>Referrer-Policy</li><li>Sin X-Powered-By</li></ul></div>
      <div class="grupo"><h3>Errores y acceso sin sesión (11)</h3><ul><li>Sin token: 401 UNAUTHORIZED</li><li>Token inválido: INVALID_ACCESS_TOKEN</li><li>Ruta inexistente: 404 ROUTE_NOT_FOUND</li><li>JSON roto: 400 BAD_REQUEST</li><li>Ningún error filtra trazas</li><li>401 en pacientes, consultas, accesos clínicos y personal (4)</li><li>Límite de peticiones anunciado</li><li>Webhook de Clerk sin firma: 400</li></ul></div>
      <div class="grupo"><h3>CORS, HTTPS y TLS (4)</h3><ul><li>CORS permite el origen de la web</li><li>CORS rechaza un origen ajeno</li><li>HTTP redirige a HTTPS</li><li>TLS 1.2 o 1.3</li></ul></div>
      <div class="grupo"><h3>Web (7)</h3><ul><li>Inicio de sesión: 200</li><li>Content-Security-Policy</li><li>X-Frame-Options</li><li>nosniff y sin X-Powered-By (2)</li><li>Sin sesión, el tablero redirige a /sign-in</li><li>La web usa la clave de Clerk de producción</li></ul></div>
      <div class="grupo"><h3>Estabilidad (1)</h3><ul><li>12 de 12 respuestas 200 seguidas</li></ul></div>
    </div>
    <h3 style="margin-top:34px">Lo que encontramos por el camino y corregimos</h3>
    <div class="hall" style="color:var(--ink)">
      <div><b>HTTP sin cifrar disponible</b><span>La API y la web respondían 200 por <code>http://</code>. Se activó «Always Use HTTPS» en Cloudflare; ahora responden 301.</span></div>
      <div><b>Un despliegue rompió el inicio de sesión (y la prueba no lo vio)</b><span>La web se reconstruyó con la clave de Clerk de desarrollo contra el secreto de producción: <code>/dashboard</code> daba 500. Se restauró la imagen anterior en minutos; ahora <code>deploy.sh</code> aborta con claves de desarrollo y la prueba exige la redirección a /sign-in y <code>pk_live</code>.</span></div>
      <div><b>Latencias mal medidas en Grafana</b><span>El histograma usaba rangos pensados para milisegundos con valores en segundos: todos los percentiles salían 2,5 / 4,75 / 4,95 s. Se corrigieron los rangos (5 ms a 10 s) con una prueba. <span class="chip pend" style="margin-left:4px">pendiente de redespliegue de la API</span></span></div>
      <div><b>Los errores del correo podían exponer la dirección de un paciente</b><span>Ahora se registran solo códigos de error, con tiempos máximos de 10 s y TLS obligatorio en producción.</span></div>
      <div class="p"><b>La web pública decía «Próximamente» en módulos que ya funcionan</b><span>Admisión, consulta médica y farmacia. Corregido en el código; <span class="chip pend">pendiente de redespliegue de la web</span></span></div>
    </div>
    <h3 style="margin-top:34px">Brechas que declaramos</h3>
    <div class="cards">
      <div class="card"><span class="chip pend">Pendiente</span><h3>Copias de seguridad</h3><p>Confirmar que el clúster de Atlas las incluya y registrar la primera prueba de restauración.</p></div>
      <div class="card"><span class="chip pend">Pendiente</span><h3>Pruebas de penetración</h3><p>Un escaneo (por ejemplo OWASP ZAP) sobre la API desplegada. El 429 real se prueba en e2e, no en producción.</p></div>
      <div class="card"><span class="chip pend">Pendiente</span><h3>Texto legal de la autorización</h3><p>El sistema registra la autorización; el texto que se lee al paciente lo redacta un asesor jurídico.</p></div>
    </div>
  </div>
</section>

<section id="entrega">
  <div class="wrap">
    <span class="eti">Observación 3 · entrega</span>
    <h2>Ritmo de trabajo y cierre</h2>
    <p class="lead">Estos son los commits reales por semana del repositorio, de @@PRIMER@@ al día de hoy (@@TOTAL_COMMITS@@ en total). Se muestra completo, con las semanas sin actividad.</p>
    @@CHART@@
    <div class="espacio" aria-hidden="true"></div>
    <div class="cards">
      <div class="card">
        <span class="chip pend">Lo que muestra</span>
        <h3>Cuatro ráfagas, no un ritmo parejo</h3>
        <p>Hubo trabajo del 1 al 3 de octubre, del 20 al 22, el 4 y 5 de noviembre y de nuevo desde el 15. La última semana concentra el @@PCT@@ % de todos los commits. Es justo el patrón que señaló el docente y no lo escondemos.</p>
      </div>
      <div class="card">
        <span class="chip ok">Lo que cambió</span>
        <h3>Para que no se repita</h3>
        <ul>
          <li>Tablero de Jira con épicas, historias con criterios de aceptación y <b>sprints semanales</b>, con cada commit enlazado a su historia.</li>
          <li>CI obligatorio: nada se despliega si falla; ya no se «prueba al final».</li>
          <li>Definición de terminado: CI y Sonar en verde, QA, documentación y Jira al día.</li>
          <li>Pruebas de humo después de cada despliegue.</li>
        </ul>
      </div>
    </div>
    <div class="tabla" style="margin-top:22px"><table>
      <caption>Sprints semanales en Jira (proyecto IPS)</caption>
      <thead><tr><th>Sprint</th><th>Fechas</th><th>Objetivo</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>1 – 8 oct</td><td>—</td></tr>
        <tr><td>2</td><td>8 – 15 oct</td><td>—</td></tr>
        <tr><td>3</td><td>15 – 22 oct</td><td>Corrección de farmacia, limpieza del repositorio y backlog del proyecto</td></tr>
        <tr><td>4</td><td>22 – 29 oct</td><td>Épica 7: calidad continua y operación</td></tr>
        <tr><td>5</td><td>29 oct – 5 nov</td><td>Épica 8: comunicación con el paciente</td></tr>
        <tr><td>6</td><td>5 – 12 nov</td><td>Épica 9: indicadores de la consulta externa; calidad, accesibilidad y seguridad (épica QA)</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px; font-size:14.5px; color:var(--muted)">Pendiente en el tablero: cerrar los sprints 4 a 6 y mover lo que no se terminó.</p>
  </div>
</section>

<section class="dark" id="arquitectura">
  <div class="wrap">
    <span class="eti">Cómo está construida</span>
    <h2>Arquitectura</h2>
    <p class="lead">Una API con un contexto por área de negocio, una web que solo habla con esa API, y una infraestructura pequeña, reproducible y medida.</p>
    <div class="arq">
      <div class="capa"><h3>Clientes</h3><ul><li>Web Next.js 15 (escritorio y celular)</li><li>Pantalla de sala con voz</li><li>Swagger (OpenAPI) de la API</li></ul></div>
      <div class="capa"><h3>Plataforma</h3><ul><li>NestJS 12, DDD y CQRS</li><li>Pacientes, agendamiento, admisión, consulta, farmacia, personal, organizaciones, identidad</li><li>Permisos por rol, optimista contra conflictos</li></ul></div>
      <div class="capa"><h3>Datos</h3><ul><li>MongoDB Atlas (conjunto de réplicas, transacciones)</li><li><code>trace_events</code>: auditoría que solo se agrega</li><li><code>clinical_access</code>: quién leyó qué</li></ul></div>
      <div class="capa"><h3>Servicios</h3><ul><li>Clerk (identidad y organizaciones = IPS)</li><li>Correo SMTP (Spacemail)</li><li>Grafana Cloud: métricas y logs por OTLP</li></ul></div>
      <div class="capa"><h3>Operación</h3><ul><li>Raspberry Pi con Docker Compose</li><li>Cloudflare Tunnel (HTTPS, sin puertos abiertos)</li><li>GitHub Actions y SonarCloud</li></ul></div>
    </div>
  </div>
</section>

<section id="estado">
  <div class="wrap">
    <span class="eti">Sin adornos</span>
    <h2>Qué está listo y qué falta</h2>
    <div class="cards">
      <div class="card"><span class="chip ok">Listo</span><ul><li>Flujo completo: registrar, agendar, admitir, llamar, consultar, firmar y dispensar</li><li>Roles, aislamiento por IPS y registro de lecturas</li><li>Autorización del titular y política de conservación (Res. 1995/1999)</li><li>Producción con Clerk de producción, HTTPS y Grafana</li><li>CI, Sonar y @@SMOKE@@ pruebas de seguridad</li></ul></div>
      <div class="card"><span class="chip pend">Falta validar</span><ul><li>Sesiones de usabilidad con personas reales (herramienta lista arriba)</li><li>Pruebas automáticas de la interfaz de extremo a extremo (IPS-152)</li><li>Copias de seguridad de Atlas y primera restauración de prueba</li><li>Escaneo de penetración</li><li>Redespliegue de la web (módulos disponibles) y de la API (latencias)</li><li>Correo al paciente: el envío SMTP está listo; faltan las historias 2 y 3 de la épica 8</li></ul></div>
    </div>
  </div>
</section>

<section class="dark" id="correr">
  <div class="wrap">
    <span class="eti">Para probarlo</span>
    <h2>URLs y cómo correrlo</h2>
    <div class="tabla" style="color:var(--ink)"><table>
      <thead><tr><th>Qué</th><th>Dirección</th></tr></thead>
      <tbody>
        <tr><td>Web (producción)</td><td><a href="https://ips.devrojas.xyz">https://ips.devrojas.xyz</a></td></tr>
        <tr><td>API (producción)</td><td><a href="https://ips-api.devrojas.xyz/api/v1/health">https://ips-api.devrojas.xyz/api/v1</a> · <a href="https://ips-api.devrojas.xyz/api/v1/docs">Swagger</a></td></tr>
        <tr><td>Calidad</td><td><a href="https://sonarcloud.io/project/overview?id=Linaressss073_IPS">SonarCloud</a> · <a href="https://github.com/Linaressss073/IPS/actions">GitHub Actions</a></td></tr>
        <tr><td>Gestión</td><td><a href="https://kontiasolutions.atlassian.net/jira/software/projects/IPS/boards/34">Tablero de Jira (proyecto IPS)</a></td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:20px">En local (la organización de demostración DEV vive en la instancia de desarrollo de Clerk):</p>
    <pre>cd api &amp;&amp; pnpm db:up &amp;&amp; pnpm start:dev                    # API  http://localhost:3001/api/v1/docs
cd multi-tenant-starter-template &amp;&amp; pnpm dev             # Web  http://localhost:3000
bash deploy/pi/smoke-test.sh                                   # pruebas de seguridad en producción</pre>
  </div>
</section>

</main>
<footer><div class="wrap">IPS Consulta Externa · documentación del proyecto · noviembre de 2026. Las capturas son de la web y de herramientas públicas y no contienen datos de pacientes. Detalle completo en la carpeta <code>docs/</code> del repositorio.</div></footer>

<dialog id="visor" aria-label="Captura ampliada"><img alt="" id="visor-img"><p id="visor-t"></p><button type="button" id="visor-x" aria-label="Cerrar">×</button></dialog>

<script>
(function () {
  /* ---- Visor de capturas y filtros */
  var visor = document.getElementById('visor'), vi = document.getElementById('visor-img'), vt = document.getElementById('visor-t');
  document.querySelectorAll('.fig button').forEach(function (b) {
    b.addEventListener('click', function () {
      vi.src = b.getAttribute('data-src'); vi.alt = b.getAttribute('data-t'); vt.textContent = b.getAttribute('data-t');
      if (visor.showModal) visor.showModal(); else visor.setAttribute('open', '');
    });
  });
  document.getElementById('visor-x').addEventListener('click', function () { visor.close(); });
  visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
  var filtros = document.querySelectorAll('.filtros button');
  filtros.forEach(function (b) {
    b.addEventListener('click', function () {
      filtros.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.getAttribute('data-f');
      document.querySelectorAll('.fig').forEach(function (fig) { fig.hidden = !(f === 'todo' || fig.getAttribute('data-g') === f); });
    });
  });

  /* ---- Copiar comando */
  var copiar = document.getElementById('copiar');
  copiar.addEventListener('click', function () {
    var t = document.getElementById('cmd').textContent;
    var ok = function () { copiar.textContent = 'Copiado'; setTimeout(function () { copiar.textContent = 'Copiar'; }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ok); else ok();
  });

  /* ---- Explorador de roles (matriz real de permissions.ts) */
  var PERMS = [
    ['patients:read', 'Ver pacientes'], ['patients:write', 'Registrar y editar pacientes'], ['appointments:read', 'Ver citas'],
    ['appointments:manage', 'Gestionar agendas y citas'], ['admission:manage', 'Admisión y turnos'], ['turns:call', 'Llamar turnos'],
    ['clinical:read', 'Leer la historia clínica'], ['clinical:write', 'Escribir y firmar consultas'], ['pharmacy:dispense', 'Dispensar fórmulas'],
    ['settings:manage', 'Configurar la IPS'], ['staff:manage', 'Asignar roles al personal'], ['audit:read', 'Ver quién leyó las historias'], ['room:view', 'Abrir la pantalla de sala']
  ];
  var ROLES = [
    { id: 'admin', n: 'Administración', p: ['patients:read', 'patients:write', 'appointments:read', 'appointments:manage', 'admission:manage', 'settings:manage', 'staff:manage', 'audit:read', 'room:view'], t: 'Administra todo menos la historia clínica y llamar turnos: ni los administradores leen lo clínico.' },
    { id: 'agendamiento', n: 'Agendamiento', p: ['patients:read', 'patients:write', 'appointments:read', 'appointments:manage'], t: 'Registra pacientes y gestiona agendas y citas; no ve nada clínico.' },
    { id: 'admision', n: 'Admisión', p: ['patients:read', 'patients:write', 'appointments:read', 'admission:manage', 'turns:call'], t: 'Registra la llegada, admite y llama turnos.' },
    { id: 'medico', n: 'Médico', p: ['patients:read', 'appointments:read', 'turns:call', 'clinical:read', 'clinical:write'], t: 'Único rol que lee y escribe la historia clínica; cada lectura queda registrada.' },
    { id: 'farmacia', n: 'Farmacia', p: ['patients:read', 'pharmacy:dispense'], t: 'Llama solo turnos de dispensación y entrega las fórmulas.' },
    { id: 'soporte', n: 'Soporte', p: [], t: 'Mesa de ayuda: sin ningún acceso a datos.' },
    { id: 'tv', n: 'Pantalla de sala (TV)', p: ['room:view'], t: 'La televisión inicia sesión con su propia cuenta y solo muestra la pantalla.' }
  ];
  var rb = document.getElementById('roles-btns'), pm = document.getElementById('perm'), rn = document.getElementById('rol-nota');
  function pintar(id) {
    var r = ROLES.filter(function (x) { return x.id === id; })[0];
    rb.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-r') === id ? 'true' : 'false'); });
    pm.innerHTML = PERMS.map(function (p) { var on = r.p.indexOf(p[0]) >= 0; return '<div class="' + (on ? 'on' : '') + '"><i aria-hidden="true">' + (on ? '✓' : '–') + '</i><span>' + p[1] + (on ? '' : ' <span class="sr-only">(sin permiso)</span>') + '</span></div>'; }).join('');
    rn.textContent = r.n + ': ' + r.t + ' (' + r.p.length + ' de ' + PERMS.length + ' permisos)';
  }
  ROLES.forEach(function (r) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = r.n; b.setAttribute('data-r', r.id); b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { pintar(r.id); }); rb.appendChild(b);
  });
  pintar('medico');

  /* ---- Validación con usuarios: tareas, SUS y registro local */
  var TAREAS = [
    'T1 · Agendamiento: registrar un paciente y agendarle una cita', 'T2 · Admisión: registrar la llegada y ver el turno en la sala',
    'T3 · Médico: llamar, escribir la consulta y firmarla con fórmula', 'T4 · Farmacia: entrega parcial y luego completa',
    'T5 · Administración: dar el rol Médico y abrir su agenda', 'T6 · Todos: entender y corregir un error a propósito', 'T7 · Sala: identificar su turno en menos de 10 s'
  ];
  var SUS = ['Me gustaría usar este sistema con frecuencia.', 'Lo encontré innecesariamente complejo.', 'Fue fácil de usar.', 'Necesitaría ayuda de una persona técnica.', 'Las funciones están bien integradas.', 'Hay demasiada inconsistencia.', 'La mayoría aprendería a usarlo muy rápido.', 'Fue muy incómodo de usar.', 'Me sentí muy seguro/a usándolo.', 'Necesité aprender muchas cosas antes de usarlo.'];
  var KEY = 'ips-validacion-usuarios';
  var tareasEl = document.getElementById('v-tareas'), susEl = document.getElementById('v-sus');
  tareasEl.innerHTML = TAREAS.map(function (t, i) {
    return '<div class="tarea"><span id="tl' + i + '">' + t + '</span><select aria-labelledby="tl' + i + '" id="t' + i + '"><option value="">No se hizo</option><option value="S">Sin ayuda</option><option value="A">Con ayuda</option><option value="N">No completó</option></select><input type="number" min="0" max="3600" id="ts' + i + '" placeholder="seg" aria-label="Segundos de la tarea ' + (i + 1) + '"></div>';
  }).join('');
  susEl.innerHTML = SUS.map(function (t, i) {
    return '<div><label for="s' + i + '">' + (i + 1) + '. ' + t + '</label><select id="s' + i + '"><option value="">–</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>';
  }).join('');
  function cargar() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function guardar(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function sus(vals) {
    if (vals.some(function (v) { return v === ''; })) return null;
    var s = 0; vals.forEach(function (v, i) { v = +v; s += (i % 2 === 0) ? v - 1 : 5 - v; }); return s * 2.5;
  }
  function pintarTabla() {
    var d = cargar(), tb = document.getElementById('v-tabla'), rs = document.getElementById('v-resumen');
    if (!d.length) { tb.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Aún no hay sesiones registradas.</td></tr>'; rs.textContent = 'Sin datos todavía.'; return; }
    tb.innerHTML = d.map(function (r) { return '<tr><td>' + r.p + '</td><td>' + r.rol + '</td><td class="n">' + r.s + '/' + r.n + '</td><td class="n">' + (r.sus === null ? '–' : r.sus) + '</td></tr>'; }).join('');
    var tn = 0, ts = 0, ss = 0, sc = 0;
    d.forEach(function (r) { tn += r.n; ts += r.s; if (r.sus !== null) { ss += r.sus; sc++; } });
    var pct = tn ? Math.round(ts / tn * 100) : 0, media = sc ? (ss / sc).toFixed(1) : null;
    rs.innerHTML = '<b>' + d.length + ' de 5 participantes.</b> Tareas sin ayuda: <b>' + pct + ' %</b> (meta ≥ 80 %). SUS medio: <b>' + (media === null ? '–' : media) + '</b> (meta ≥ 68).';
  }
  document.getElementById('val-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var tareas = TAREAS.map(function (_, i) { return { e: document.getElementById('t' + i).value, s: document.getElementById('ts' + i).value }; });
    var hechas = tareas.filter(function (t) { return t.e !== ''; });
    var msg = document.getElementById('v-msg');
    if (!hechas.length) { msg.textContent = 'Marca el resultado de al menos una tarea.'; return; }
    var vals = SUS.map(function (_, i) { return document.getElementById('s' + i).value; });
    var reg = { p: document.getElementById('v-part').value, rol: document.getElementById('v-rol').value, n: hechas.length, s: hechas.filter(function (t) { return t.e === 'S'; }).length, tareas: tareas, sus: sus(vals), at: new Date().toISOString() };
    var d = cargar().filter(function (r) { return r.p !== reg.p; }); d.push(reg); d.sort(function (a, b) { return a.p < b.p ? -1 : 1; });
    msg.textContent = guardar(d) ? 'Guardado: ' + reg.p + (reg.sus === null ? ' (sin SUS completo)' : ' · SUS ' + reg.sus) + '.' : 'No se pudo guardar en este navegador.';
    pintarTabla();
  });
  document.getElementById('v-csv').addEventListener('click', function () {
    var d = cargar(), msg = document.getElementById('v-msg');
    if (!d.length) { msg.textContent = 'No hay nada que exportar.'; return; }
    var filas = [['participante', 'rol', 'tareas_hechas', 'sin_ayuda', 'sus', 'fecha'].concat(TAREAS.map(function (_, i) { return 'T' + (i + 1); }))];
    d.forEach(function (r) { filas.push([r.p, r.rol, r.n, r.s, r.sus === null ? '' : r.sus, r.at].concat(r.tareas.map(function (t) { return t.e + (t.s ? ':' + t.s + 's' : ''); }))); });
    var csv = filas.map(function (f) { return f.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'validacion-usuarios-ips.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
  var borrar = document.getElementById('v-borrar'), armado = false;
  borrar.addEventListener('click', function () {
    if (!armado) { armado = true; borrar.textContent = 'Confirmar: borrar todo'; setTimeout(function () { armado = false; borrar.textContent = 'Borrar todo'; }, 4000); return; }
    guardar([]); armado = false; borrar.textContent = 'Borrar todo'; document.getElementById('v-msg').textContent = 'Registros borrados.'; pintarTabla();
  });
  pintarTabla();
})();
</script>
</body>
</html>
'''


def fig(name, grupo, titulo, desc):
    src = img(name)
    return (f'<figure class="fig" data-g="{grupo}"><button type="button" data-src="{src}" data-t="{titulo}" aria-label="Ampliar: {titulo}">'
            f'<img src="{src}" alt="{titulo}" loading="lazy"></button><figcaption><b>{titulo}</b>{desc}</figcaption></figure>')


GALERIA = ''.join([
    fig('landing', 'producto', 'Página de inicio', 'Cada paciente, un solo registro y un recorrido sin filas; la pantalla de sala de ejemplo.'),
    fig('signin', 'producto', 'Inicio de sesión', 'Identidad con Clerk (instancia de producción), con Google o correo.'),
    fig('roles', 'producto', 'Roles', 'Cada quien ve y hace solo lo que le corresponde; una persona puede tener varios roles.'),
    fig('seguridad', 'producto', 'Seguridad y privacidad', 'Datos aislados por IPS, datos mínimos del personal, trazabilidad y derecho al olvido.'),
    fig('swagger', 'producto', 'API documentada (Swagger)', 'Todas las rutas, por módulo y bajo la IPS, con autenticación por token.'),
    fig('actions', 'calidad', 'Integración continua', 'Cada push corre la cadena de pruebas; el historial incluye los fallos que se corrigieron.'),
    fig('sonar', 'calidad', 'SonarCloud', 'Quality gate aprobado, 0 incidencias abiertas y calificación A.'),
    fig('grafana', 'operacion', 'Grafana: estado general', 'Métricas recibidas de la API de la Raspberry Pi, tasa de éxito y última métrica.'),
    fig('grafana-rutas', 'operacion', 'Grafana: rutas como plantilla', 'Las rutas se agrupan por plantilla (<code>/teams/:teamId/...</code>), nunca con ids reales.'),
    fig('clerk-orgs', 'operacion', 'Clerk: organizaciones = IPS', 'En la instancia de desarrollo; cada organización es una IPS aislada.'),
])

tot = sum(TESTS.values())
primer = subprocess.run(['git', 'log', '--reverse', '--format=%ad', '--date=format:%d-%b-%Y'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()[0]
primer = '1 de octubre de 2026'

html = TEMPLATE
for k, v in COL.items():
    html = html.replace(f'@@{k}@@', v)
repl = {
    'TOTAL_TESTS': str(tot), 'COVERAGE': COVERAGE, 'SMOKE': str(SMOKE),
    'T_UNIT': str(TESTS['unit']), 'T_E2E': str(TESTS['e2e']), 'T_WEB': str(TESTS['web']),
    'W_UNIT': str(round(TESTS['unit'] / max(TESTS.values()) * 100)), 'W_E2E': str(round(TESTS['e2e'] / max(TESTS.values()) * 100)),
    'W_WEB': str(round(TESTS['web'] / max(TESTS.values()) * 100)),
    'GALERIA': GALERIA, 'CHART': CHART, 'TOTAL_COMMITS': str(TOTAL_COMMITS), 'PCT': str(PCT_LAST), 'PRIMER': primer,
}
for k, v in repl.items():
    html = html.replace(f'@@{k}@@', v)
left = [t for t in ('@@' + x for x in ('INK', 'GALERIA')) if t in html]
if '@@' in html:
    i = html.index('@@')
    sys.exit('Quedan marcas sin reemplazar: ' + html[i:i + 40])
with open(OUT, 'w', encoding='utf8', newline='\n') as f:
    f.write(html)
print(f'{OUT} · {len(html) // 1024} KB · {TOTAL_COMMITS} commits · ultima semana {PCT_LAST} %')
