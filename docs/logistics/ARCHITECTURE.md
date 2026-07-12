# Logistics Architecture

The Logistics module is designed as an organisation-scoped feature that reuses the host app's auth and organisation model instead of creating a separate identity system.

## Principles
- Organisation-scoped data only
- Permanent inventory transactions as the source of truth
- Shared services for business rules and permission enforcement
- External inputs (screenshots, spreadsheets, Google Sheets, Discord) become reviewable changes before they enter the ledger
