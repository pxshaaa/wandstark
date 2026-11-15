#!/usr/bin/env python3
"""Assemble index.html from src/, data/ and modules/ (single self-contained page for the Artifact)."""
import pathlib, sys
R = pathlib.Path(__file__).parent
order = ['b1.js', 'b10.js', 'b2.js', 'b6.js', 'b4.js', 'b9.js', 'b9k.js', 'b7b8.js', 'b13.js', 's3.js', 's3b.js', 's31.js', 'ffs.js', 'ffs-tips.js', 'en13445.js', 'en13480.js', 'asme.js', 'ped.js']
mods = [R/'modules'/n for n in order if (R/'modules'/n).exists()]
mods += [p for p in sorted((R/'modules').glob('*.js')) if p.name not in order]
data = [R/'data/materials.js'] + sorted(p for p in (R/'data').glob('mat_*.js')) + [R/'data'/n for n in ('profiles.js','flanges.js') if (R/'data'/n).exists()]
js = '\n'.join(p.read_text() for p in [R/'src/ad.js', *data, *mods, R/'src/ui.js', R/'src/report.js'])
html = f'''<title>AD 2000 Rechner</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
{(R/'src/style.css').read_text()}
</style>
{(R/'src/body.html').read_text()}
<script>
{js}
</script>
'''
(R/'index.html').write_text(html)
print('built index.html with modules:', ', '.join(p.name for p in mods), f'({len(html)//1024} KB)')

# --standalone <dir>: full HTML document for tinyjar.app/wandstark (self-hosted fonts + jsPDF, no third-party requests)
if '--standalone' in sys.argv:
    out = pathlib.Path(sys.argv[sys.argv.index('--standalone')+1]).expanduser()
    body = html.split('</style>',1)[1]
    css = (R/'src/style.css').read_text()
    page = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Wandstark – Druckbehälter-Rechner</title>
<meta name="description" content="Wandstark: Wanddicken- und Festigkeitsrechner für Druckbehälter nach AD 2000, EN 13445, EN 13480 und ASME VIII-1, mit Korrosionsbewertung, PED-Kategorie, technischer Zeichnung und PDF-Bericht. Prototyp.">
<link rel="canonical" href="https://tinyjar.app/wandstark/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#1d5b86">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Wandstark"><meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta property="og:type" content="website"><meta property="og:url" content="https://tinyjar.app/wandstark/">
<meta property="og:title" content="Wandstark – Druckbehälter-Rechner"><meta property="og:description" content="AD 2000, EN 13445, ASME VIII-1 – direkt im Browser, mit PDF-Bericht.">
<meta property="og:image" content="https://tinyjar.app/assets/og.png">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light}}
body{{margin:0;font:14px system-ui,-apple-system,sans-serif}} img{{max-width:100%}} [hidden]{{display:none!important}}
{css}
.sitefoot{{max-width:1080px;margin:0 auto;padding:8px max(16px,env(safe-area-inset-right,0px)) 110px max(16px,env(safe-area-inset-left,0px));font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:6px 16px}}
.sitefoot a{{color:var(--muted)}} .sitefoot > a{{display:inline-block;padding:10px 4px}}
</style>
<script>window.AD_LIBS=['vendor/jspdf.umd.min.js','vendor/jspdf.plugin.autotable.min.js'];window.AD_PDFJS=['vendor/pdf.min.js','vendor/pdf.worker.min.js'];</script>
</head>
<body>
{body.replace('<h1>AD 2000 Rechner</h1>','<h1>Wandstark</h1>').replace('AD 2000 Rechner · Berechnungsbericht','Wandstark · Berechnungsbericht')}
<footer class="sitefoot"><span>Wandstark ist ein Prototyp von <a href="/">Tiny Jar</a> – nicht gegen DIMy validiert, kein Ersatz für eine Prüfung durch eine zugelassene Stelle. Eingaben bleiben in deinem Browser.</span><a href="/wandstark/about/">Über Wandstark</a><a href="/imprint/">Impressum</a><a href="/wandstark/privacy/">Datenschutz</a><a href="/wandstark/logout">Abmelden</a></footer>
</body>
</html>
"""
    out.mkdir(parents=True, exist_ok=True)
    (out/'index.html').write_text(page)
    print('standalone ->', out/'index.html', f'({len(page)//1024} KB)')

