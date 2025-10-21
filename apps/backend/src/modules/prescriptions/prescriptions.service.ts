import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { Prescription, PrescriptionSchedule, utils } from '@neurobridge/shared';
import { PDMPService } from '../pdmp/pdmp.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pdmpService: PDMPService
  ) {}

  async create(data: {
    patientId: string;
    providerId: string;
    visitId?: string;
    medicationName: string;
    dosage: string;
    route: string;
    frequency: string;
    quantity: number;
    refills: number;
    daysSupply: number;
    schedule: PrescriptionSchedule;
    indication: string;
  }): Promise<Prescription> {
    // PDMP check required for controlled substances
    if (utils.isPDMPRequired(data.schedule)) {
      const pdmpCheck = await this.pdmpService.checkPatient(data.patientId, data.providerId, data.visitId);

      if (pdmpCheck.riskScore > 70) {
        throw new BadRequestException(
          `High PDMP risk score (${pdmpCheck.riskScore}). Review required before prescribing.`
        );
      }
    }

    const result = await this.db.query<any>(
      `INSERT INTO prescriptions (
        patient_id, provider_id, visit_id, medication_name, dosage,
        route, frequency, quantity, refills, days_supply, schedule,
        indication, contraindications_checked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.patientId,
        data.providerId,
        data.visitId || null,
        data.medicationName,
        data.dosage,
        data.route,
        data.frequency,
        data.quantity,
        data.refills,
        data.daysSupply,
        data.schedule,
        data.indication,
        true, // contraindications_checked (should be validated by AI)
      ]
    );

    return this.mapToPrescription(result.rows[0]);
  }

  async findById(id: string): Promise<Prescription | null> {
    const result = await this.db.query<any>('SELECT * FROM prescriptions WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToPrescription(result.rows[0]) : null;
  }

  private mapToPrescription(row: any): Prescription {
    return {
      id: row.id,
      visitId: row.visit_id,
      patientId: row.patient_id,
      providerId: row.provider_id,
      medicationName: row.medication_name,
      medicationGenericName: row.medication_generic_name,
      dosage: row.dosage,
      route: row.route,
      frequency: row.frequency,
      quantity: row.quantity,
      refills: row.refills,
      daysSupply: row.days_supply,
      schedule: row.schedule,
      indication: row.indication,
      contraindicationsChecked: row.contraindications_checked,
      interactionWarnings: row.interaction_warnings,
      erxSentAt: row.erx_sent_at,
      erxTransactionId: row.erx_transaction_id,
      erxStatus: row.erx_status,
      erxPharmacyNcpdp: row.erx_pharmacy_ncpdp,
      specialInstructions: row.special_instructions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
