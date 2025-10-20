import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { ConsentType } from '@neurobridge/shared';

@Injectable()
export class ConsentsService {
  constructor(private readonly db: DatabaseService) {}

  async create(patientId: string, consentType: ConsentType, data: any) {
    return this.db.create('consents', {
      patient_id: patientId,
      consent_type: consentType,
      consent_version: data.version || '1.0',
      consent_text: data.text,
      signed_at: new Date(),
      signature_method: data.signatureMethod,
      ip_address: data.ipAddress,
      is_active: true,
    });
  }

  async getActiveConsents(patientId: string) {
    return this.db.findMany('consents', { patient_id: patientId, is_active: true });
  }
}
