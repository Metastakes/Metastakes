import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class GLP1Service {
  constructor(private readonly db: DatabaseService) {}

  async createProgram(patientId: string, providerId: string, data: any) {
    return this.db.create('glp1_programs', {
      patient_id: patientId,
      provider_id: providerId,
      start_date: data.startDate,
      medication: data.medication,
      baseline_weight_kg: data.baselineWeightKg,
      baseline_bmi: data.baselineBmi,
      baseline_a1c: data.baselineA1c,
      target_weight_kg: data.targetWeightKg,
      pancreatitis_history: data.pancreatitisHistory,
      gallbladder_history: data.gallbladderHistory,
      thyroid_cancer_history: data.thyroidCancerHistory,
      is_active: true,
    });
  }

  async createCheckin(programId: string, data: any) {
    return this.db.create('glp1_weekly_checkins', {
      program_id: programId,
      patient_id: data.patientId,
      week_number: data.weekNumber,
      checkin_date: data.checkinDate,
      weight_kg: data.weightKg,
      bmi: data.bmi,
      nausea_severity: data.nauseaSeverity,
      medication_taken_as_prescribed: data.medicationTakenAsPrescribed,
      exercise_minutes_week: data.exerciseMinutesWeek,
      dietary_adherence_score: data.dietaryAdherenceScore,
    });
  }
}
