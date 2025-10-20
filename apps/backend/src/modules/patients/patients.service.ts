/**
 * Patients Service
 * CRUD operations for patients with PHI encryption
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { Patient, Address } from '@neurobridge/shared';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly encryption: EncryptionService
  ) {}

  /**
   * Find patient by ID (decrypts PHI)
   */
  async findById(id: string): Promise<Patient | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.decryptPatient(result.rows[0]);
  }

  /**
   * Find patient by user ID
   */
  async findByUserId(userId: string): Promise<Patient | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM patients WHERE user_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.decryptPatient(result.rows[0]);
  }

  /**
   * Create new patient (encrypts PHI)
   */
  async create(
    userId: string,
    data: {
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      phone: string;
      address: Address;
      ssn?: string;
      insuranceProvider?: string;
      insuranceId?: string;
      insuranceGroup?: string;
    }
  ): Promise<Patient> {
    // Encrypt PHI fields
    const firstNameEncrypted = this.encryption.encrypt(data.firstName);
    const lastNameEncrypted = this.encryption.encrypt(data.lastName);
    const dobEncrypted = this.encryption.encrypt(data.dateOfBirth.toISOString());
    const phoneEncrypted = this.encryption.encrypt(data.phone);
    const addressEncrypted = this.encryption.encrypt(JSON.stringify(data.address));
    const ssnEncrypted = data.ssn ? this.encryption.encrypt(data.ssn) : null;
    const insuranceIdEncrypted = data.insuranceId
      ? this.encryption.encrypt(data.insuranceId)
      : null;
    const insuranceGroupEncrypted = data.insuranceGroup
      ? this.encryption.encrypt(data.insuranceGroup)
      : null;

    const result = await this.db.query<any>(
      `INSERT INTO patients (
        user_id, first_name_encrypted, last_name_encrypted,
        date_of_birth_encrypted, phone_encrypted, address_encrypted,
        ssn_encrypted, insurance_provider, insurance_id_encrypted,
        insurance_group_encrypted, total_points, current_streak_days,
        longest_streak_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId,
        firstNameEncrypted,
        lastNameEncrypted,
        dobEncrypted,
        phoneEncrypted,
        addressEncrypted,
        ssnEncrypted,
        data.insuranceProvider || null,
        insuranceIdEncrypted,
        insuranceGroupEncrypted,
        0, // total_points
        0, // current_streak_days
        0, // longest_streak_days
      ]
    );

    this.logger.log(`Created patient ${result.rows[0].id} for user ${userId}`);

    return this.decryptPatient(result.rows[0]);
  }

  /**
   * Update patient
   */
  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    const patient = await this.findById(id);
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Encrypt PHI fields if provided
    if (data.firstName) {
      fields.push(`first_name_encrypted = $${paramCount}`);
      values.push(this.encryption.encrypt(data.firstName));
      paramCount++;
    }

    if (data.lastName) {
      fields.push(`last_name_encrypted = $${paramCount}`);
      values.push(this.encryption.encrypt(data.lastName));
      paramCount++;
    }

    if (data.phone) {
      fields.push(`phone_encrypted = $${paramCount}`);
      values.push(this.encryption.encrypt(data.phone));
      paramCount++;
    }

    if (data.address) {
      fields.push(`address_encrypted = $${paramCount}`);
      values.push(this.encryption.encrypt(JSON.stringify(data.address)));
      paramCount++;
    }

    // Non-PHI fields
    if (data.primaryDiagnosis) {
      fields.push(`primary_diagnosis = $${paramCount}`);
      values.push(data.primaryDiagnosis);
      paramCount++;
    }

    if (data.comorbidities) {
      fields.push(`comorbidities = $${paramCount}`);
      values.push(data.comorbidities);
      paramCount++;
    }

    if (data.allergies) {
      fields.push(`allergies = $${paramCount}`);
      values.push(data.allergies);
      paramCount++;
    }

    if (data.currentMedications) {
      fields.push(`current_medications = $${paramCount}`);
      values.push(JSON.stringify(data.currentMedications));
      paramCount++;
    }

    if (fields.length === 0) {
      return patient;
    }

    values.push(id);

    const result = await this.db.query<any>(
      `UPDATE patients SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return this.decryptPatient(result.rows[0]);
  }

  /**
   * Award points to patient
   */
  async awardPoints(patientId: string, points: number, reason: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Update patient total points
      await client.query(
        'UPDATE patients SET total_points = total_points + $1 WHERE id = $2',
        [points, patientId]
      );

      // Create point transaction
      const patient = await this.findById(patientId);
      await client.query(
        `INSERT INTO point_transactions (user_id, points, reason)
         VALUES ($1, $2, $3)`,
        [patient.userId, points, reason]
      );
    });

    this.logger.log(`Awarded ${points} points to patient ${patientId}: ${reason}`);
  }

  /**
   * Update streak
   */
  async updateStreak(patientId: string): Promise<void> {
    const patient = await this.findById(patientId);

    const newStreakDays = patient.currentStreakDays + 1;
    const longestStreak = Math.max(newStreakDays, patient.longestStreakDays);

    await this.db.query(
      `UPDATE patients
       SET current_streak_days = $1, longest_streak_days = $2
       WHERE id = $3`,
      [newStreakDays, longestStreak, patientId]
    );

    this.logger.log(`Updated streak for patient ${patientId}: ${newStreakDays} days`);
  }

  /**
   * Decrypt patient PHI fields
   */
  private decryptPatient(row: any): Patient {
    try {
      return {
        id: row.id,
        userId: row.user_id,
        firstName: this.encryption.decrypt(row.first_name_encrypted),
        lastName: this.encryption.decrypt(row.last_name_encrypted),
        dateOfBirth: new Date(this.encryption.decrypt(row.date_of_birth_encrypted)),
        phone: this.encryption.decrypt(row.phone_encrypted),
        address: JSON.parse(this.encryption.decrypt(row.address_encrypted)),
        primaryDiagnosis: row.primary_diagnosis || [],
        comorbidities: row.comorbidities || [],
        allergies: row.allergies || [],
        currentMedications: row.current_medications || [],
        insuranceProvider: row.insurance_provider,
        insuranceId: row.insurance_id_encrypted
          ? this.encryption.decrypt(row.insurance_id_encrypted)
          : undefined,
        insuranceGroup: row.insurance_group_encrypted
          ? this.encryption.decrypt(row.insurance_group_encrypted)
          : undefined,
        minorUntilDate: row.minor_until_date,
        guardianId: row.guardian_id,
        totalPoints: row.total_points,
        currentStreakDays: row.current_streak_days,
        longestStreakDays: row.longest_streak_days,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      this.logger.error(`Failed to decrypt patient data: ${error.message}`);
      throw new Error('Failed to decrypt patient data');
    }
  }
}
