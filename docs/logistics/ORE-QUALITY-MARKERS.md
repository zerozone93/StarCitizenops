# Ore Quality Marker Research

Date: 2026-07-12

## Sources
- Star Citizen Wiki: Mining
  - https://starcitizen.tools/Mining
- Star Citizen Wiki: Refinery Deck
  - https://starcitizen.tools/Refinery_Deck
- Existing project notes
  - docs/logistics/MINING-STOCKKEEPING-RESEARCH.md

## Practical quality model used in this repo

Star Citizen mining value is driven by ore concentration and inert material in raw loads, then by refinery method/yield in processing.
The game loop does not expose a universal in-game letter-grade standard, so this implementation uses operational quality markers that match mining workflow decisions.

### Intake ore quality markers (raw load)
- Trace seam (<10% ore, very high inert)
- Low concentration (10-24% ore)
- Workable concentration (25-39% ore)
- Rich concentration (40-59% ore)
- Exceptional concentration (60%+ ore)
- Volatile Quantanium mix (stability watch)
- Unrated / mixed load

### Refinery output quality markers
- Industrial grade (high inert carryover)
- Commercial grade (balanced yield)
- High-purity grade (premium sale)
- Spec grade (top-tier purity)
- Volatile stabilized lot (quantanium-safe)
- Contaminated refinery output

## Why this model
- It maps to the mining decision points players actually manage: concentration, inert load, volatility, and refinery method outcome.
- It works for both manual entry and scanner-assisted intake.
- It keeps quality metadata useful for stock requests and fulfillment decisions.
