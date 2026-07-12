export type LogisticsPermission =
  | 'logistics.view'
  | 'logistics.stock.create'
  | 'logistics.stock.adjust'
  | 'logistics.stock.transfer'
  | 'logistics.stock.issue'
  | 'logistics.stock.return'
  | 'logistics.requests.create'
  | 'logistics.requests.review'
  | 'logistics.requests.approve'
  | 'logistics.requests.reject'
  | 'logistics.imports.create'
  | 'logistics.imports.approve'
  | 'logistics.exports.create'
  | 'logistics.scans.create'
  | 'logistics.scans.review'
  | 'logistics.audits.view'
  | 'logistics.settings.manage';

export interface LogisticsRouteContext {
  organisationId: string;
  userId: string;
  permission: LogisticsPermission;
}
