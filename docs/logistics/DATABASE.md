# Logistics Database Notes

The initial Prisma schema contains an organisation-scoped Logistics model set including:
- LogisticsOrganisationSettings
- InventoryItem and InventoryItemAlias
- InventoryLocation
- InventoryTransaction and InventoryTransactionLine
- InventoryBalance
- MemberCustody
- EquipmentRequest and EquipmentRequestLine
- StockReservation
- StockScan and StockScanDetectedItem
- InventoryImport and InventoryImportRow
- SpreadsheetConnection
- LogisticsAuditLog
- LogisticsOrgAdmin

These models are intended to be extended with the host application's existing auth and organisation models in later phases.
