export class LogisticsService {
  static async ensureAccess(_context: { organisationId: string; userId: string; permission: string }) {
    return true;
  }

  static async rebuildBalances() {
    return { ok: true, updated: 0 };
  }
}
