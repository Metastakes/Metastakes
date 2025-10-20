import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { Visit, VisitType, VisitStatus, CPT_CODES, utils } from '@neurobridge/shared';

@Injectable()
export class VisitsService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    patientId: string;
    providerId: string;
    scheduledStart: Date;
    scheduledDurationMinutes: number;
    visitType: VisitType;
    chiefComplaint?: string;
  }): Promise<Visit> {
    const result = await this.db.query<any>(
      `INSERT INTO visits (
        patient_id, provider_id, scheduled_start, scheduled_duration_minutes,
        visit_type, visit_status, chief_complaint
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.patientId,
        data.providerId,
        data.scheduledStart,
        data.scheduledDurationMinutes,
        data.visitType,
        VisitStatus.SCHEDULED,
        data.chiefComplaint || null,
      ]
    );
    return this.mapToVisit(result.rows[0]);
  }

  async findById(id: string): Promise<Visit | null> {
    const result = await this.db.query<any>('SELECT * FROM visits WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToVisit(result.rows[0]) : null;
  }

  async update(id: string, data: Partial<Visit>): Promise<Visit> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.visitStatus) {
      fields.push(`visit_status = $${paramCount}`);
      values.push(data.visitStatus);
      paramCount++;
    }

    if (data.subjective) {
      fields.push(`subjective = $${paramCount}`);
      values.push(data.subjective);
      paramCount++;
    }

    if (data.objective) {
      fields.push(`objective = $${paramCount}`);
      values.push(data.objective);
      paramCount++;
    }

    if (data.assessment) {
      fields.push(`assessment = $${paramCount}`);
      values.push(data.assessment);
      paramCount++;
    }

    if (data.plan) {
      fields.push(`plan = $${paramCount}`);
      values.push(data.plan);
      paramCount++;
    }

    if (data.transcript) {
      fields.push(`transcript = $${paramCount}`);
      values.push(data.transcript);
      paramCount++;
    }

    if (data.totalTimeMinutes) {
      fields.push(`total_time_minutes = $${paramCount}`);
      values.push(data.totalTimeMinutes);
      paramCount++;

      // Auto-recommend CPT code
      const cptCode = utils.recommendCPTCode(data.totalTimeMinutes, data.mdmLevel || 'moderate');
      if (cptCode) {
        fields.push(`cpt_codes = $${paramCount}`);
        values.push([cptCode]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Visit not found');
      return existing;
    }

    values.push(id);
    const result = await this.db.query<any>(
      `UPDATE visits SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return this.mapToVisit(result.rows[0]);
  }

  async complete(id: string): Promise<Visit> {
    const visit = await this.findById(id);
    if (!visit) throw new Error('Visit not found');
    const now = new Date();
    const totalMinutes = visit.actualStart
      ? Math.round((now.getTime() - new Date(visit.actualStart).getTime()) / 60000)
      : visit.scheduledDurationMinutes;

    return this.update(id, {
      visitStatus: VisitStatus.COMPLETED,
      actualEnd: now,
      totalTimeMinutes: totalMinutes,
    });
  }

  private mapToVisit(row: any): Visit {
    return {
      id: row.id,
      patientId: row.patient_id,
      providerId: row.provider_id,
      supervisingMentorId: row.supervising_mentor_id,
      scheduledStart: row.scheduled_start,
      scheduledDurationMinutes: row.scheduled_duration_minutes,
      actualStart: row.actual_start,
      actualEnd: row.actual_end,
      visitType: row.visit_type,
      visitStatus: row.visit_status,
      chiefComplaint: row.chief_complaint,
      googleMeetUrl: row.google_meet_url,
      googleCalendarEventId: row.google_calendar_event_id,
      subjective: row.subjective,
      objective: row.objective,
      assessment: row.assessment,
      plan: row.plan,
      transcript: row.transcript,
      aiSessionId: row.ai_session_id,
      aiAlerts: row.ai_alerts || [],
      cptCodes: row.cpt_codes || [],
      mdmLevel: row.mdm_level,
      totalTimeMinutes: row.total_time_minutes,
      g2211Applicable: row.g2211_applicable,
      pdmpCheckedAt: row.pdmp_checked_at,
      pdmpResult: row.pdmp_result,
      prescriptionsIssued: row.prescriptions_issued || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
