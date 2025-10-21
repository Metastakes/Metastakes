import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async getProviderMetrics(providerId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT * FROM provider_dashboard WHERE id = $1',
      [providerId]
    );
    return result.rows[0];
  }

  async getPatientEngagement(patientId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT * FROM patient_engagement WHERE id = $1',
      [patientId]
    );
    return result.rows[0];
  }
}
