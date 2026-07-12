# Star Citizen Item Research And Entry Model

## Scope
This document captures a practical research baseline for logistics item intake and request forms.

## Source Baseline

### Official sources
- CIG / RSI pages are the canonical source for naming and release notes.
- In this environment, direct RSI scraping hit a 403 response for public page fetches, so fully automated ingestion from RSI was not possible during this pass.
- Recommendation: run a scheduled import in a trusted backend with browser automation or approved API access for official naming updates.

### Community sources validated as reachable
- Star Citizen Wiki (community-maintained):
  - Mining overview page is reachable and provides ore naming and gameplay context.
- Erkul (community tooling):
  - Reachable and useful as a component/weapon naming reference and loadout taxonomy.

### Community sources blocked by anti-bot in this environment
- UEX Corp commodities endpoint returned a Cloudflare challenge page from this runtime.

## Improved Entry Model Implemented
- Intake/request line items now support:
  - `entryMethod`: `catalog` or `manual`.
  - `quality`: explicit quality field.
  - `details`: variant/manufacturer/free-form details.
- Material lines now require explicit ore quality.
- Refinery jobs now track:
  - `inputQuality` from intake.
  - `outputQuality` from refinery output selection.
- Offer approval now performs inventory receipt for non-material items automatically.

## Why this model works better
- Catalog mode is fast when a known item exists.
- Manual mode allows unknown/new items without blocking intake.
- Quality and details fields preserve metadata not captured by simple item name + quantity.
- Material pipelines now carry quality from intake to refined output records.

## Next data steps
- Add periodic catalog sync from approved sources.
- Add alias tables (manufacturer prefixes, in-game shorthand).
- Add item family IDs to prevent duplicate naming drift.
- Add confidence score for fuzzy matching to reduce accidental auto-matches.
