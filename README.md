# Concept Wealth — Client Space (working name)

A unified, client-facing financial product for **Concept Wealth Woodhill**
(Sanlam BlueStar, Pretoria). One site that brings a client's whole financial
life together: a simple **dashboard**, the **calculators/tools**, **resources**,
and **TrustFile** — the family-file / estate-readiness product with its own
subscription.

Static HTML, **no build step** — open any page in a browser. A shared JS
app-shell keeps navigation in one place.

## Structure
- **Main site (top menu bar — `js/topbar.js`):** Dashboard · Profile · Calculators · Resources · TrustFile · About
- **TrustFile (left sidebar — `js/tf-shell.js`):** Home · Profile · My Will · Documents · People & Access · Messages · Estate Costs · Security & Privacy
- `css/trustfile.css` — design system · `js/cw-profile.js` — local profile engine
- `brand.html` — living design system / brand board
- `estate_cost_calculator.html` — estate cost tool (live, SARS 2026/27)

## Design
Brand colours and type drawn from the parent companies **Glacier by Sanlam**
(navy `#172B4D`, steel `#4F6D9F`) and **Sanlam BlueStar** (Sanlam blue `#0076CE`,
charcoal `#333E48`). Typeface **Roboto** (shared by both). See `brand.html`.

## Status
Work in progress. Phase 1: no document storage, no login, no payments —
profile + checklist + results in `localStorage` only. Not financial advice.
