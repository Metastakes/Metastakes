import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { Provider } from '@neurobridge/shared';

@Injectable()
export class ProvidersService {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string): Promise<Provider | null> {
    const result = await this.db.query<any>('SELECT * FROM providers WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToProvider(result.rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Provider | null> {
    const result = await this.db.query<any>('SELECT * FROM providers WHERE user_id = $1', [userId]);
    return result.rows[0] ? this.mapToProvider(result.rows[0]) : null;
  }

  async findByNPI(npi: string): Promise<Provider | null> {
    const result = await this.db.query<any>('SELECT * FROM providers WHERE npi = $1', [npi]);
    return result.rows[0] ? this.mapToProvider(result.rows[0]) : null;
  }

  async create(userId: string, data: any): Promise<Provider> {
    const result = await this.db.query<any>(
      `INSERT INTO providers (
        user_id, first_name, last_name, credential, license_number,
        license_state, npi, dea_number, specialty, board_certifications,
        years_experience, mentor_id, requires_supervision, empathy_score,
        safety_score, total_visits_completed, is_accepting_patients
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        userId,
        data.firstName,
        data.lastName,
        data.credential,
        data.licenseNumber,
        data.licenseState,
        data.npi,
        data.deaNumber || null,
        data.specialty || [],
        data.boardCertifications || [],
        data.yearsExperience || 0,
        data.mentorId || null,
        data.requiresSupervision ?? true,
        0.0, // empathy_score
        0.0, // safety_score
        0,   // total_visits_completed
        true // is_accepting_patients
      ]
    );

    return this.mapToProvider(result.rows[0]);
  }

  async update(id: string, data: Partial<Provider>): Promise<Provider> {
    const provider = await this.findById(id);
    if (!provider) throw new NotFoundException(`Provider ${id} not found`);

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return provider;

    values.push(id);
    const result = await this.db.query<any>(
      `UPDATE providers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return this.mapToProvider(result.rows[0]);
  }

  private mapToProvider(row: any): Provider {
    return {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      credential: row.credential,
      licenseNumber: row.license_number,
      licenseState: row.license_state,
      npi: row.npi,
      deaNumber: row.dea_number,
      specialty: row.specialty || [],
      boardCertifications: row.board_certifications || [],
      yearsExperience: row.years_experience,
      mentorId: row.mentor_id,
      requiresSupervision: row.requires_supervision,
      empathyScore: parseFloat(row.empathy_score),
      safetyScore: parseFloat(row.safety_score),
      totalVisitsCompleted: row.total_visits_completed,
      isAcceptingPatients: row.is_accepting_patients,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
