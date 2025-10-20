import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  async log(data: {
    userId?: string;
    userRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: any;
    reason?: string;
  }): Promise<void> {
    await this.db.create('audit_logs', {
      user_id: data.userId,
      user_role: data.userRole,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      changes: data.changes,
      reason: data.reason,
      retention_expires_at: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
    });
  }
}
