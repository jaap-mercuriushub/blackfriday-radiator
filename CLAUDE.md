# CLAUDE.md: Black Friday-landingspagina's Mercurius Hub

Volledige context (status, URL's, ID's, productgegevens, volgende stappen) staat in de overdracht:
`_overdracht/HANDOFF.md` (lokaal, niet gecommit; bron: de overdrachts-zip van 27-11-2026).
Brandbooks: `_overdracht/brandbook/Mercuriushub-Brandbook-Library-v0.10.0/` (begin bij `Start-hier.md`).
Higgsfield-assets (job-ID's, video-URL's, prompts): `_overdracht/higgsfield-assets.json`.

## Repo-indeling
- Root: de Evolar-pagina (three.js, live op https://evolar-blackfriday-radiator.vercel.app).
- `shared/scrub.js` + `shared/base.css`: gedeelde scroll-video-engine en layout voor de nieuwe pagina's.
- Shoppagina's: `gloeilampgoedkoop/`, `isenvi/`, `meerdanlicht/`, `lighto/` (Duits). Elke map heeft een
  `index.html` die `../shared/base.css` en `../shared/scrub.js` laadt, de merkvariabelen in `:root` zet
  en `initPage({...})` aanroept. Frames staan in `<map>/frames/{d,m}/` (maak ze met `tools/frames.sh`),
  geoptimaliseerde productfoto's in `<map>/img/`.

## Werkafspraken
- Communiceer in het Nederlands met Jaap. Uitzondering: de Lighto.de-pagina is Duitstalig.
- Volg per merk het brandbook: lettertype, kleuren, toon, aanspreekvorm en CTA-stijl. Gebruik alleen
  productclaims die op de productpagina staan. Laat tegenstrijdige of ontbrekende claims weg.
- Kortingen heten "Black Friday-deal", met een countdown tot 30-11-2026 23:59 (+01:00).
- Elke CTA linkt naar de productpagina met `utm_source=bf-landing&utm_medium=landingpage&utm_campaign=blackfriday2026&utm_content=<plek>`.
  Dat gebeurt automatisch via `a[data-cta]` in `shared/scrub.js`.
- Statische site, geen build. Een push naar `main` deployt via Vercel (team Mercuriushub).
- Higgsfield-generaties kosten credits: noem eerst de kosten en vraag akkoord.
- Commits afsluiten met: `Co-Authored-By: Claude <noreply@anthropic.com>`

## Snel testen
```bash
python3 -m http.server 8765   # open http://localhost:8765/<shop>/
```
Controleer: het laadscherm verdwijnt, de animatie scrubt heen en terug, de panelen wisselen, op mobiel
(390×844) staat de tekst onderin en het product in beeld, en de koopbalk verschijnt pas na het verhaal.
