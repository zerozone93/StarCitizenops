# Mining And Stockkeeping Research Notes

Date: 2026-07-11

## Sources reviewed
- Star Citizen Wiki: Mining
  - https://starcitizen.tools/Mining
- Star Citizen Wiki: Refinery Deck
  - https://starcitizen.tools/Refinery_Deck
- Galactic Logistics (community tool): Commodities and mining/refinery sections
  - https://www.gallog.co/commodities
- UEX (community data platform): Commodities and mining/refinery navigation
  - https://uexcorp.space/commodities

## Practical mechanics to reflect in logistics systems

1. Mining has distinct acquisition modes
- Ship mining (surface/space)
- ROC or vehicle mining
- FPS hand mining
- Salvage-derived construction materials

2. Raw and refined forms must be tracked separately
- Community tools list both raw and processed forms (for example: Bexalite and Bexalite (Raw), Gold and Gold (Ore)).
- Stock records should preserve state transitions: RAW -> REFINING -> REFINED -> SOLD/TRANSFERRED.

3. Refining is a work-order pipeline, not an instant conversion
- Refinery decks process by work order.
- Method choice trades off speed, cost, and yield.
- Required stockkeeping fields: method, estimated completion, cost, projected yield, actual yield.

4. Yield quality depends on load composition
- Purity and inert content materially affect returns.
- Keep purity/inert metadata at the load or batch level.

5. Commodity markets are dynamic and community-driven
- Community sources emphasize volatility, buy/sell spreads, and per-SCU margins.
- Inventory planning should separate:
  - strategic reserves
  - active sell inventory
  - transfer allocations

## Recommended stockkeeping schema additions

For raw loads:
- extractionMethod
- sourceLocationType (surface, cave, asteroid, salvage)
- purityPercent
- inertPercent
- volatilityClass
- extractionShipOrTool

For refining jobs:
- refineryStation
- method
- methodProfile (speed/cost/yield)
- estimatedDuration
- queueState
- projectedYield
- processingCost
- completedAt
- actualYield

For refined inventory:
- grade
- destination (sale, internal transfer, construction)
- reservedForRequestId
- qualityBand

## Implemented in this repo (this change)

1. Expanded logistics catalog material coverage
- Added gemstones and additional ore/salvage materials relevant to mining and construction workflows.

2. Enhanced materials demo dataset
- Raw loads now include method, purity, inert content, volatility, and source.
- Refining jobs now include refinery method profile, estimated time, and cost.
- Refined outputs now include grade and destination.

3. Updated materials UI
- Materials ledger now surfaces the new operational fields so planners can evaluate loads and processing decisions.

## Next iteration ideas
- Add explicit state machine transitions for loads and work orders.
- Add per-material quality thresholds and preferred refinery methods.
- Add profitability view using buy/sell spread and processing cost per SCU.
