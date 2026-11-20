#!/usr/bin/env python3
"""Genera docs/demo/IPS-proyecto.html: una sola página, sin dependencias externas, con las capturas de docs/demo/img incrustadas.

Uso (desde la raiz del repo):  python docs/demo/build-demo.py
Los numeros de pruebas y cobertura se actualizan a mano en CIFRAS (salen de `pnpm test`, `pnpm test:e2e`, `pnpm test` del frontend y SonarCloud);
los commits por semana se calculan de git.
"""
import base64, colorsys, datetime, json, os, subprocess, sys

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

/* Problema */
.flujos { display: grid; gap: 12px; margin: 26px 0 8px; }
.flujo { display: grid; grid-template-columns: 150px 1fr; gap: 14px; align-items: center; }
.flujo > b { font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.pf { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.pf .e { background: var(--white); border: 2px solid var(--line); border-radius: 10px; padding: 8px 12px; font-weight: 700; font-size: 14.5px; }
.pf .r, .pf .o { font-size: 12px; font-weight: 800; border-radius: 99px; padding: 3px 9px; }
.pf .r { color: #7A5200; background: #FFF1CC; }
.pf .o { color: #0C5A38; background: #DDF4E8; }
.flujo.hoy .e { border-color: var(--amber); }
.flujo.con .e { border-color: var(--green); }
@media (max-width: 760px) { .flujo { grid-template-columns: 1fr; } }

/* Stack tecnologico */
.stk { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(330px, 100%), 1fr)); gap: 18px; margin-top: 8px; }
.stk .card { padding: 20px 22px; }
.stk h3 { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.stk h3 i { font-style: normal; width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: #E3F3EA; color: var(--green); font-size: 15px; font-weight: 800; }
.stk ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.stk li { font-size: 14.5px; color: var(--muted); padding-left: 14px; position: relative; }
.stk li::before { content: ''; position: absolute; left: 0; top: .62em; width: 6px; height: 6px; border-radius: 2px; background: var(--blue); }
.stk li b { color: var(--ink); }
.stk li code { white-space: nowrap; }
.porque { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 14px; margin-top: 20px; }
.porque div { border-left: 4px solid var(--green); padding: 4px 0 4px 14px; font-size: 14.5px; color: var(--muted); }
.porque div b { display: block; color: var(--ink); font-size: 15.5px; margin-bottom: 2px; }

/* Visor del recorrido */
.rec { display: grid; grid-template-columns: 290px 1fr; gap: 22px; background: var(--ink); color: #fff; border-radius: 18px; padding: 20px; margin-top: 22px; }
.caps { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; align-content: start; counter-reset: c; }
.caps button { all: unset; box-sizing: border-box; width: 100%; cursor: pointer; display: grid; grid-template-columns: 26px 1fr; gap: 8px; padding: 8px 10px; border-radius: 10px; font-size: 14.5px; color: #D5DEE8; }
.caps button::before { counter-increment: c; content: counter(c); font-family: var(--mono); font-size: 12.5px; color: var(--greenl); padding-top: 2px; }
.caps button:hover { background: rgba(255,255,255,.07); }
.caps button[aria-current="step"] { background: rgba(60,200,140,.18); color: #fff; font-weight: 700; }
.caps button:focus-visible { outline: 3px solid var(--amber); outline-offset: 1px; }
.vista img { width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,.14); display: block; background: #0B1622; }
.vista .txt { margin-top: 14px; min-height: 92px; }
.vista .txt b { display: block; font-size: 19px; margin-bottom: 4px; }
.vista .txt p { color: #C3CFDB; margin: 0; max-width: 78ch; }
.ctl { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
.ctl button { font: inherit; font-weight: 700; font-size: 14px; padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.28); background: transparent; color: #fff; cursor: pointer; }
.ctl button[aria-pressed="true"] { background: var(--greenl); border-color: var(--greenl); color: var(--ink); }
.ctl small { margin-left: auto; color: #A9B8C8; }
@media (max-width: 860px) { .rec { grid-template-columns: 1fr; } .caps { grid-template-columns: 1fr 1fr; } }
footer { background: var(--ink); color: #A9B8C8; padding: 26px 0; font-size: 14px; }
code { font-family: var(--mono); font-size: .92em; background: #E8EDF2; padding: 1px 6px; border-radius: 5px; }
.dark code { background: rgba(255,255,255,.1); }
@media (max-width: 860px) { .barra { grid-template-columns: 110px 1fr 40px; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } * { transition: none !important; } }
</style>
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>
<nav class="nav" aria-label="Secciones">
  <div class="wrap">
    <b>IPS <i>Consulta Externa</i></b>
    <a href="#problema">Problema</a><a href="#demo">Demo</a><a href="#recorrido">Recorrido</a><a href="#pruebas">Pruebas</a>
    <a href="#seguridad">Seguridad</a><a href="#arquitectura">Arquitectura</a><a href="#stack">Stack</a><a href="#estado">Estado</a>
  </div>
</nav>

<header class="portada">
  <div class="wrap">
    <span class="eti" style="color:var(--greenl)">El proyecto completo · demo</span>
    <h1>Sistema de información hospitalaria para la consulta externa: <em>un registro por paciente, todo trazado, probado y protegido</em></h1>
    <p class="lead">Agendamiento, admisión con turnos y pantalla de sala, consulta médica con firma y fórmula, y farmacia con inventario. Cada IPS ve solo lo suyo, cada persona solo lo que su rol permite, y cada cambio (y cada lectura de una historia clínica) deja rastro. En producción en <a href="https://ips.devrojas.xyz" style="color:var(--bluel)">ips.devrojas.xyz</a>, sobre una Raspberry Pi propia con los secretos en Vault (OpenBao) y publicada por Cloudflare Tunnel.</p>
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

<section id="problema">
  <div class="wrap">
    <span class="eti">Por qué existe</span>
    <h2>El problema: cada etapa de la consulta externa guarda su propio registro</h2>
    <p class="lead">En una IPS de mediana complejidad, agendar, tomar turno, admitir, consultar y dispensar funcionan como procesos separados. El mismo dato se vuelve a escribir, el paciente retrocede y espera sin saber cuánto falta, y nadie puede reconstruir qué pasó. <b>El software existe para resolver eso.</b></p>
    <div class="flujos" aria-label="Recorrido del paciente, antes y con el sistema">
      <div class="flujo hoy"><b>Hoy</b><div class="pf">
        <span class="e">Agendamiento</span><span class="r">↻ vuelve a digitar</span>
        <span class="e">Turno</span><span class="r">↻ vuelve a digitar</span>
        <span class="e">Admisión</span><span class="r">↻ vuelve a digitar</span>
        <span class="e">Consulta</span><span class="r">fórmula en papel</span>
        <span class="e">Farmacia</span>
      </div></div>
      <div class="flujo con"><b>Con el sistema</b><div class="pf">
        <span class="e">Agendamiento</span><span class="o">mismo registro</span>
        <span class="e">Turno</span><span class="o">mismo registro</span>
        <span class="e">Admisión</span><span class="o">mismo registro</span>
        <span class="e">Consulta</span><span class="o">fórmula digital firmada</span>
        <span class="e">Farmacia</span>
      </div></div>
    </div>
    <div class="cards" style="margin-top:22px">
      <article class="card"><span class="chip info">Lo que se observó</span><h3>Datos repetidos y fórmula transcrita</h3>
        <p>En el recorrido de un paciente, el documento de identidad se digita entre tres y cuatro veces, y la fórmula médica se transcribe a mano para que farmacia pueda atenderla. Es la observación directa del equipo en una IPS de mediana complejidad.</p></article>
      <article class="card"><span class="chip info">Lo que dice la literatura</span><h3>Un problema del proceso, no de las personas</h3>
        <p>En la E.S.E. Antonio Nariño (Burbano y Montenegro, 2010), el 57 % del personal reportó incumplimiento de la calidad esperada por exceso de trámites y papeleo, y solo entre el 21 % y el 25 % de los usuarios calificó como excelente la asignación de citas. Personal y usuarios señalan el mismo obstáculo.</p></article>
      <article class="card"><span class="chip info">Por qué sigue pasando</span><h3>Informatizado, pero a pedazos</h3>
        <p>Persiste aun con historia clínica electrónica: se digitalizó módulo por módulo, sin un flujo continuo. La Ley 2015 de 2020 exige una historia clínica electrónica interoperable; el desafío de fondo es la continuidad de la información entre etapas.</p></article>
    </div>
    <p class="cita" style="margin-top:22px">La pregunta que resolvemos: ¿qué características debe tener un sistema de información para que, en la consulta externa de una IPS de mediana complejidad, cada dato del paciente se capture una sola vez, su atención avance sin retrocesos ni esperas evitables, y su recorrido quede trazado de principio a fin?</p>
    <div class="tabla"><table>
      <caption>Cada dificultad, y cómo la resuelve el sistema</caption>
      <thead><tr><th>Dificultad</th><th>Cómo la resuelve el sistema</th><th>Dónde se ve</th></tr></thead>
      <tbody>
        <tr><td><b>Datos repetidos</b> en cada etapa</td><td>Un solo registro por paciente en cada IPS (documento único); lo que se captura en una etapa está disponible en la siguiente según el rol.</td><td><a href="#recorrido">Recorrido, caps. 3 y 4</a></td></tr>
        <tr><td><b>Fórmula transcrita</b> a mano</td><td>La fórmula se firma en la consulta y llega a farmacia, que entrega contra ella sin volver a digitarla.</td><td><a href="#recorrido">Caps. 11 y 13</a></td></tr>
        <tr><td><b>Retrocesos</b>: el dato no está donde se necesita</td><td>Agenda, admisión, consulta y farmacia comparten la misma ficha; la historia clínica solo la ven los médicos.</td><td><a href="#roles">Explorador de roles</a></td></tr>
        <tr><td><b>Esperas</b> sin visibilidad del turno</td><td>Turno por servicio, llamado en la pantalla de sala con voz y reanuncio automático antes de marcarse «no se presentó».</td><td><a href="#recorrido">Caps. 8 a 10</a></td></tr>
        <tr><td><b>Inventario desconectado</b> de la fórmula</td><td>Inventario por lote ligado a la entrega: sale primero lo que vence primero, no se entrega más de lo pendiente ni lotes vencidos, y hay filtros de stock bajo y por vencer.</td><td><a href="#recorrido">Caps. 12 y 13</a></td></tr>
        <tr><td><b>Sin trazabilidad</b> del recorrido</td><td>Historial de eventos que solo se agrega (quién, qué y cuándo) y registro de quién lee cada historia clínica.</td><td><a href="#recorrido">Cap. 14</a> y <a href="#seguridad">Seguridad</a></td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px; font-size:14.5px; color:var(--muted)">Honestidad sobre la evidencia: el sistema elimina la recaptura por diseño, pero todavía no medimos en una IPS real cuánto se reducen las esperas y los retrocesos; esa medición es el siguiente paso.</p>
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
    <h2>Recorrido en 8 pasos</h2>
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

<section id="recorrido" style="padding-top:0">
  <div class="wrap">
    <span class="eti">Producción, de punta a punta</span>
    <h2>El recorrido real: de la apertura de la IPS a la entrega de la fórmula</h2>
    <p class="lead">Se ejecutó en <b>ips.devrojas.xyz</b> el 18 de noviembre de 2026, con datos ficticios en una organización de prueba. Elige un capítulo, recórrelo con las flechas o reprodúcelo solo.</p>
    <div class="rec">
      <ol class="caps" id="rec-caps" aria-label="Capítulos del recorrido"></ol>
      <div class="vista">
        <img id="rec-img" alt="">
        <img id="rec-gif" alt="Recorrido animado de producción: admisión, turnos, consulta y farmacia" hidden src="@@GIF@@">
        <div class="txt" aria-live="polite"><b id="rec-t"></b><p id="rec-d"></p></div>
        <div class="ctl">
          <button type="button" id="rec-prev">‹ Anterior</button>
          <button type="button" id="rec-play" aria-pressed="false">▶ Reproducir</button>
          <button type="button" id="rec-next">Siguiente ›</button>
          <button type="button" id="rec-gifbtn" aria-pressed="false">Ver animado</button>
          <small id="rec-pos"></small>
        </div>
      </div>
    </div>
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
    <h2>Verificado con pruebas</h2>
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
        <tr><td>Gestión de secretos</td><td>Los secretos viven en <b>OpenBao</b> (el Vault de código abierto, con almacenamiento Raft, solo en 127.0.0.1 de la Pi). <code>up.sh</code> los trae con un token de solo lectura y genera el <code>.env</code> con permisos 600; si el vault está sellado o falla, no toca el <code>.env</code> actual</td><td>Revisado en la Pi (<code>deploy/pi/up.sh</code>); SonarCloud sin <i>hotspots</i></td></tr>
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
      <div><b>Latencias mal medidas en Grafana</b><span>El histograma usaba rangos pensados para milisegundos con valores en segundos: todos los percentiles salían 2,5 / 4,75 / 4,95 s. Se corrigieron los rangos (5 ms a 10 s) con una prueba. <span class="chip ok" style="margin-left:4px">desplegado: el p50 pasó de 2,5 s a unos 88 ms</span></span></div>
      <div><b>Los errores del correo podían exponer la dirección de un paciente</b><span>Ahora se registran solo códigos de error, con tiempos máximos de 10 s y TLS obligatorio en producción.</span></div>
      <div><b>La web pública decía «Próximamente» en módulos que ya funcionan</b><span>Admisión, consulta médica y farmacia. Corregido y desplegado: <span class="chip ok">ya figuran como disponibles</span></span></div>
    </div>
    <h3 style="margin-top:34px">Brechas que declaramos</h3>
    <div class="cards">
      <div class="card"><span class="chip pend">Pendiente</span><h3>Copias de seguridad</h3><p>Confirmar que el clúster de Atlas las incluya y registrar la primera prueba de restauración.</p></div>
      <div class="card"><span class="chip pend">Pendiente</span><h3>Respaldo del vault</h3><p>Guardar fuera de la Pi las llaves de desellado y una instantánea Raft de OpenBao; sin ellas, perder la Pi es perder los secretos.</p></div>
      <div class="card"><span class="chip pend">Pendiente</span><h3>Pruebas de penetración</h3><p>Un escaneo (por ejemplo OWASP ZAP) sobre la API desplegada. El 429 real se prueba en e2e, no en producción.</p></div>
      <div class="card"><span class="chip pend">Pendiente</span><h3>Texto legal de la autorización</h3><p>El sistema registra la autorización; el texto que se lee al paciente lo redacta un asesor jurídico.</p></div>
    </div>
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
      <div class="capa"><h3>Servicios</h3><ul><li>Clerk (identidad y organizaciones = IPS)</li><li>Correo SMTP (Spacemail)</li><li>Grafana Cloud: métricas y logs por OTLP</li><li><b>OpenBao (Vault):</b> los secretos, fuera del código y del repositorio</li></ul></div>
      <div class="capa"><h3>Operación</h3><ul><li>Raspberry Pi con Docker Compose</li><li><code>up.sh</code>: trae los secretos del vault y genera el <code>.env</code></li><li>Cloudflare Tunnel en su propio compose (HTTPS, sin puertos abiertos)</li><li>GitHub Actions y SonarCloud</li></ul></div>
    </div>
  </div>
</section>

<section id="stack">
  <div class="wrap">
    <span class="eti">Con qué está hecho</span>
    <h2>Stack tecnológico</h2>
    <p class="lead">Primero el modelo de negocio y después las piezas técnicas. Las versiones son las del repositorio.</p>
    <h3 style="margin:26px 0 4px">Stack de negocio: SaaS multi-tenant</h3>
    <p class="lead" style="font-size:16px">Una sola instalación del sistema atiende a muchas IPS. Cada IPS es un <b>tenant</b>: una organización aislada, con su personal, sus roles, su configuración y sus datos.</p>
    <div class="stk">
      <article class="card"><h3><i aria-hidden="true">M</i>Modelo SaaS</h3><ul>
        <li><b>Software como servicio</b>: una instalación, muchas instituciones, desde el navegador y sin instalar nada en la IPS</li>
        <li>Dirigido a IPS de <b>mediana complejidad</b>, que rara vez tienen un equipo propio de tecnología</li>
        <li>Planes y cobro por suscripción: <b>no implementados</b></li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">T</i>Multi-tenant</h3><ul>
        <li><b>Tenant = IPS</b> = una organización de Clerk, identificada por <code>teamId</code> en cada ruta, consulta y colección</li>
        <li>Una IPS nueva se crea desde el inicio de sesión; su administrador asigna los roles</li>
        <li>El <code>teamId</code> de la ruta debe coincidir con la membresía de quien llama</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">A</i>Aislamiento y permisos por IPS</h3><ul>
        <li>Cada IPS ve solo sus pacientes, su personal y sus agendas; lo comprueba una prueba e2e entre dos IPS</li>
        <li>Una persona puede estar en varias IPS, con roles distintos en cada una</li>
        <li>7 roles y 13 permisos, asignados por la administración de cada IPS</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">C</i>Configuración y trazabilidad por IPS</h3><ul>
        <li>Cada IPS define sus datos (NIT y habilitación), sus servicios con prefijo de turno, sus consultorios y el llamado de turnos</li>
        <li>Auditoría y registro de lecturas separados por IPS</li>
        <li>Derecho al olvido del personal sin romper el historial</li>
      </ul></article>
    </div>
    <h3 style="margin:34px 0 4px">Stack técnico</h3>
    <p class="lead" style="font-size:16px">TypeScript de punta a punta, un solo gestor de paquetes y un contenedor por servicio.</p>
    <div class="stk">
      <article class="card"><h3><i aria-hidden="true">W</i>Interfaz web</h3><ul>
        <li><b>Next.js 15</b> (App Router, renderizado en servidor) y <b>React 19</b></li>
        <li><b>TypeScript 5</b></li>
        <li><b>Tailwind CSS 3.4</b> con componentes tipo shadcn/ui sobre <b>Radix UI</b></li>
        <li><b>Clerk para Next.js 7</b>: inicio de sesión y organizaciones (cada IPS)</li>
        <li><b>pdf-lib</b>: la fórmula médica en PDF</li>
        <li><b>openapi-typescript</b>: los tipos de la web se generan desde la API</li>
        <li><b>next-themes</b> y <b>lucide-react</b>: modo claro y oscuro, e iconos</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">A</i>Servidor (API)</h3><ul>
        <li><b>NestJS 12</b> sobre <b>Node 24</b>, con <b>TypeScript 6</b></li>
        <li><b>DDD</b>: 8 contextos de negocio, con comandos y consultas separados (CQRS escrito a mano, sin librería)</li>
        <li><b>class-validator</b>: validación de cada petición</li>
        <li><b>OpenAPI / Swagger</b>: documentación interactiva con todos los campos</li>
        <li><b>helmet</b> y <b>express-rate-limit</b>: cabeceras de seguridad y límite de peticiones</li>
        <li><b>pino</b> (nestjs-pino): logs estructurados, sin datos de salud</li>
        <li><b>nodemailer</b>: correo por SMTP, con tiempos máximos y TLS en producción</li>
        <li><b>@clerk/backend</b>: verificación de tokens y membresías</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">D</i>Datos</h3><ul>
        <li><b>MongoDB</b> (controlador 7.7): <b>Atlas</b> en producción, con réplica y transacciones</li>
        <li>Bloqueo optimista por versión: dos personas no se pisan los datos</li>
        <li><code>trace_events</code>: auditoría que solo se agrega; <code>clinical_access</code>: quién leyó cada historia</li>
        <li><b>MongoDB 8</b> en Docker para desarrollo y pruebas</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">S</i>Identidad, secretos y observabilidad</h3><ul>
        <li><b>Clerk</b>: identidad (Google o correo), organizaciones = IPS, webhooks con firma</li>
        <li><b>OpenBao</b> (fork de código abierto de HashiCorp Vault): los secretos</li>
        <li><b>Spacemail</b>: correo SMTP</li>
        <li><b>OpenTelemetry</b> hacia <b>Grafana Cloud</b>: métricas (Prometheus) y logs (Loki)</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">Q</i>Calidad y pruebas</h3><ul>
        <li><b>Vitest</b> (API 4, web 5) y <b>Supertest</b></li>
        <li><b>Testcontainers 12</b>: una base MongoDB real en cada ejecución e2e</li>
        <li><b>oxlint</b> (API) y <b>ESLint</b> (web)</li>
        <li><b>SonarCloud</b>: calidad, cobertura (@@COVERAGE@@ %) y seguridad</li>
        <li><b>GitHub Actions</b>: CI encadenado, con las acciones fijadas por SHA</li>
        <li><b>Lighthouse</b>: revisión de accesibilidad</li>
      </ul></article>
      <article class="card"><h3><i aria-hidden="true">I</i>Infraestructura y despliegue</h3><ul>
        <li><b>Raspberry Pi</b> con <b>Docker</b> y <b>Docker Compose</b> (imágenes <code>node:24-slim</code>)</li>
        <li><b>Cloudflare Tunnel</b> y DNS: HTTPS forzado, TLS 1.3 y sin puertos abiertos</li>
        <li><b>pnpm 12</b>: un solo gestor de paquetes para la API y la web</li>
        <li><code>deploy.sh</code>, <code>up.sh</code> y <code>smoke-test.sh</code> (@@SMOKE@@ pruebas de seguridad)</li>
        <li>Render quedó como alternativa (el plan gratuito se agotó)</li>
      </ul></article>
    </div>
    <div class="porque">
      <div><b>Un solo lenguaje</b>TypeScript en la web y en la API, con los tipos de la web generados desde la especificación de la API.</div>
      <div><b>Historia consistente</b>Transacciones en MongoDB: el dato y su evento de auditoría se guardan juntos o no se guarda ninguno.</div>
      <div><b>Sin contraseñas propias</b>La identidad la gestiona Clerk; la base nunca guarda contraseñas.</div>
      <div><b>Secretos fuera del código</b>OpenBao los guarda y <code>up.sh</code> los trae al arrancar.</div>
    </div>
  </div>
</section>

<section id="estado">
  <div class="wrap">
    <span class="eti">Sin adornos</span>
    <h2>Qué está listo y qué falta</h2>
    <div class="cards">
      <div class="card"><span class="chip ok">Listo</span><ul><li>Flujo completo ejecutado en producción el 18-nov-2026 con datos ficticios: registrar, agendar, admitir, llamar, consultar, firmar y dispensar</li><li>Roles, aislamiento por IPS y registro de lecturas</li><li>Autorización del titular y política de conservación (Res. 1995/1999)</li><li>Producción con Clerk de producción, HTTPS, Grafana y los secretos en OpenBao (Vault)</li><li>CI, Sonar y @@SMOKE@@ pruebas de seguridad</li></ul></div>
      <div class="card"><span class="chip pend">Falta validar</span><ul><li>Pruebas automáticas de la interfaz de extremo a extremo (IPS-152)</li><li>Copias de seguridad de Atlas y primera restauración de prueba</li><li>Respaldo de las llaves y de la instantánea del vault</li><li>Escaneo de penetración</li><li>Correo al paciente: el envío SMTP está listo; faltan las historias 2 y 3 de la épica 8</li></ul></div>
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

  /* ---- Visor del recorrido real */
  var REC = @@REC_JSON@@;
  var caps = document.getElementById('rec-caps'), ri = document.getElementById('rec-img'), rg = document.getElementById('rec-gif');
  var rt = document.getElementById('rec-t'), rd = document.getElementById('rec-d'), rp = document.getElementById('rec-pos');
  var play = document.getElementById('rec-play'), gifb = document.getElementById('rec-gifbtn'), cur = 0, timer = null;
  REC.forEach(function (c, i) {
    var li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.textContent = c.t; b.addEventListener('click', function () { parar(); mostrar(i); });
    li.appendChild(b); caps.appendChild(li);
  });
  function mostrar(i) {
    cur = (i + REC.length) % REC.length;
    ri.hidden = false; rg.hidden = true; gifb.setAttribute('aria-pressed', 'false');
    ri.src = REC[cur].i; ri.alt = 'Captura real: ' + REC[cur].t; rt.textContent = REC[cur].t; rd.textContent = REC[cur].d;
    rp.textContent = (cur + 1) + ' de ' + REC.length;
    caps.querySelectorAll('button').forEach(function (b, k) { if (k === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }
  function parar() { if (timer) { clearInterval(timer); timer = null; } play.setAttribute('aria-pressed', 'false'); play.textContent = '▶ Reproducir'; }
  play.addEventListener('click', function () {
    if (timer) { parar(); return; }
    play.setAttribute('aria-pressed', 'true'); play.textContent = '❚❚ Pausar';
    timer = setInterval(function () { mostrar(cur + 1); }, 5000);
  });
  document.getElementById('rec-prev').addEventListener('click', function () { parar(); mostrar(cur - 1); });
  document.getElementById('rec-next').addEventListener('click', function () { parar(); mostrar(cur + 1); });
  gifb.addEventListener('click', function () {
    parar();
    var on = gifb.getAttribute('aria-pressed') !== 'true';
    gifb.setAttribute('aria-pressed', on ? 'true' : 'false'); ri.hidden = on; rg.hidden = !on;
    if (on) { rt.textContent = 'Recorrido animado'; rd.textContent = 'Admisión, turnos, pantalla de sala, consulta, inventario y farmacia, tal como se ejecutaron (50 cuadros).'; rp.textContent = ''; }
    else mostrar(cur);
  });
  mostrar(0);
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
    fig('modulos', 'producto', 'Módulos disponibles', 'Admisión y turnos, consulta médica y farmacia ya figuran como disponibles; solo la mesa de ayuda sigue como próxima.'),
    fig('roles', 'producto', 'Roles', 'Cada quien ve y hace solo lo que le corresponde; una persona puede tener varios roles.'),
    fig('seguridad', 'producto', 'Seguridad y privacidad', 'Datos aislados por IPS, datos mínimos del personal, trazabilidad y derecho al olvido.'),
    fig('swagger', 'producto', 'API documentada (Swagger)', 'Todas las rutas, por módulo y bajo la IPS, con autenticación por token.'),
    fig('actions', 'calidad', 'Integración continua', 'Cada push corre la cadena de pruebas; el historial incluye los fallos que se corrigieron.'),
    fig('sonar', 'calidad', 'SonarCloud', 'Quality gate aprobado, 0 incidencias abiertas y calificación A.'),
    fig('grafana', 'operacion', 'Grafana: estado general', 'Métricas recibidas de la API de la Raspberry Pi, tasa de éxito y última métrica.'),
    fig('grafana-rutas', 'operacion', 'Grafana: rutas como plantilla', 'Las rutas se agrupan por plantilla (<code>/teams/:teamId/...</code>), nunca con ids reales.'),
    fig('grafana-latencia', 'operacion', 'Grafana: latencia corregida', 'Tras corregir los rangos del histograma el p50 pasó de 2,5 s a unos 88 ms; el panel de errores lista los 401 y 404 por ruta.'),
    fig('clerk-orgs', 'operacion', 'Clerk: organizaciones = IPS', 'En la instancia de desarrollo; cada organización es una IPS aislada.'),
])

PASOS = [
    ('rec-01-datos-ips', 'Datos de la IPS', 'La administración registra el NIT, el código de habilitación y el contacto de la institución. Esos datos salen luego en la fórmula médica.'),
    ('rec-02-servicios', 'Servicios y consultorios', 'Se crea el servicio «Medicina general» con su prefijo de turno (MG) y el «Consultorio 301», donde se llamará a los pacientes.'),
    ('rec-03-paciente-autorizado', 'Paciente con autorización de datos', 'Una sola ficha por paciente. Queda registrada la autorización de tratamiento de datos (Ley 1581 de 2012), con quién y cuándo, y el historial empieza a llenarse. La historia clínica solo la ven los médicos.'),
    ('rec-04-paciente-sin-autorizacion', 'Paciente sin autorización: aviso', 'Si no se marcó la autorización al registrar, la ficha lo avisa y permite registrarla después con un botón. Editar al paciente nunca la borra.'),
    ('rec-05-agenda-abierta', 'Abrir la agenda del día', 'Un profesional, un servicio y un consultorio: la agenda se divide en cupos de 20 minutos (16:00 a 18:00, seis cupos).'),
    ('rec-06-cita-confirmada', 'Agendar y confirmar', 'Se elige un cupo libre, se busca al paciente por documento o nombre y se agenda. El panel de la cita permite confirmar, reprogramar, cancelar o abrir la consulta.'),
    ('rec-07-agenda-ocupada', 'Agenda con citas', 'Los cupos ocupados muestran el paciente (2 de 6). No hay choques de horario: cada cupo tiene un solo paciente.'),
    ('rec-08-admision-turno', 'Admisión: llegada y turno', 'Al llegar el paciente, admisión registra la llegada y el sistema le da un turno por servicio (MG 1) que queda «En espera».'),
    ('rec-09-turnos-llamar', 'Turnos: llamar al paciente', 'Quien atiende llama al siguiente turno. El turno pasa a «Anunciado» y puede llamarse de nuevo, marcarse atendido o como no presentado.'),
    ('rec-10-pantalla-sala', 'Pantalla de sala', 'El televisor muestra el turno, el consultorio y el nombre abreviado, con campanada y voz. Si el sonido está apagado avisa en grande: es el aviso nuevo de la historia IPS-148.'),
    ('rec-11-consulta-firmada', 'Consulta firmada con fórmula', 'El médico registra motivo, signos vitales, examen, diagnóstico CIE-10, plan y fórmula, y firma. Desde ese momento la consulta es inmutable: solo admite notas aclaratorias.'),
    ('rec-12-inventario', 'Inventario por lote', 'Farmacia recibe un lote con su vencimiento y su proveedor. Al entregar, sale primero lo que vence primero y no se dispensan lotes vencidos.'),
    ('rec-13-farmacia-entregada', 'Farmacia: entrega parcial y completa', 'La fórmula se entregó en dos partes (10 y 5 unidades): el sistema impide entregar más de lo pendiente y deja la fórmula en «Entregada».'),
    ('rec-14-historial', 'Todo queda trazado', 'En el historial del paciente: registro, autorización, cita, llegada, llamados, consulta firmada y las dos entregas, cada paso con quién y cuándo. Es el registro de auditoría que solo se agrega, nunca se edita.'),
]
REC_JSON = json.dumps([{'t': t, 'd': d, 'i': img(n)} for n, t, d in PASOS], ensure_ascii=False)
with open(os.path.join(IMG, 'recorrido.gif'), 'rb') as _f:
    GIF = 'data:image/gif;base64,' + base64.b64encode(_f.read()).decode()

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
    'GALERIA': GALERIA, 'CHART': CHART, 'REC_JSON': REC_JSON, 'GIF': GIF, 'TOTAL_COMMITS': str(TOTAL_COMMITS), 'PCT': str(PCT_LAST), 'PRIMER': primer,
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
