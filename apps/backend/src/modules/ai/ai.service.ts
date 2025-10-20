/**
 * AI Service
 * Google Vertex AI (Gemini) integration for live clinical support
 * Provides real-time safety alerts, next-question suggestions, empathy scoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database/database.service';
import { AISession, AISuggestion, AlertSeverity } from '@neurobridge/shared';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly modelVersion: string;
  private readonly promptVersion: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {
    this.modelVersion = this.configService.get<string>('VERTEX_AI_MODEL', 'gemini-1.5-pro');
    this.promptVersion = '1.0';
  }

  /**
   * Start AI session for a visit
   * This initiates the live training loop
   */
  async startSession(visitId: string, providerId: string, inputData: any): Promise<AISession> {
    const result = await this.db.query<any>(
      `INSERT INTO ai_sessions (
        visit_id, provider_id, model_version, prompt_version, input_data,
        suggestions, safety_alerts, empathy_scores, next_question_hints
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        visitId,
        providerId,
        this.modelVersion,
        this.promptVersion,
        inputData,
        [], // suggestions (populated in real-time)
        [], // safety_alerts
        [], // empathy_scores
        [], // next_question_hints
      ]
    );

    this.logger.log(`AI session ${result.rows[0].id} started for visit ${visitId}`);

    return this.mapToAISession(result.rows[0]);
  }

  /**
   * Generate safety alerts based on patient data and planned prescription
   * This is called before prescribing medication
   */
  async generateSafetyAlerts(
    patientData: any,
    plannedMedication: {
      name: string;
      dosage: string;
    }
  ): Promise<any[]> {
    // In production, this would call Vertex AI Gemini API
    // For now, return rule-based safety checks

    const alerts: any[] = [];

    // Check allergies
    if (patientData.allergies?.some((a: string) => a.toLowerCase().includes(plannedMedication.name.toLowerCase()))) {
      alerts.push({
        severity: AlertSeverity.CRITICAL,
        message: `ALLERGY ALERT: Patient allergic to ${plannedMedication.name}`,
        actionTaken: null,
        dismissed: false,
        timestamp: new Date(),
      });
    }

    // Check drug interactions
    if (patientData.currentMedications) {
      // Example: Prozac + Tramadol = Serotonin syndrome risk
      const hasProzac = patientData.currentMedications.some((m: any) =>
        m.name.toLowerCase().includes('prozac')
      );
      const planningTramadol = plannedMedication.name.toLowerCase().includes('tramadol');

      if (hasProzac && planningTramadol) {
        alerts.push({
          severity: AlertSeverity.CRITICAL,
          message: 'DRUG INTERACTION: Prozac + Tramadol → Serotonin syndrome risk. Consider alternative analgesic.',
          actionTaken: null,
          dismissed: false,
          timestamp: new Date(),
        });
      }
    }

    // In production, call Vertex AI for comprehensive analysis
    // const geminiResponse = await this.callVertexAI({ patientData, plannedMedication });

    return alerts;
  }

  /**
   * Generate next question suggestion
   * Based on conversation context and clinical guidelines
   */
  async generateNextQuestion(context: {
    transcript: string;
    chiefComplaint: string;
    visitType: string;
  }): Promise<string[]> {
    // In production, call Vertex AI Gemini
    // For now, return rule-based suggestions

    const suggestions: string[] = [];

    if (context.chiefComplaint.toLowerCase().includes('depression')) {
      suggestions.push('Have you experienced any suicidal ideation in the past week?');
      suggestions.push('How would you rate your energy level on a scale of 1-10?');
      suggestions.push('Have you noticed changes in your sleep pattern?');
    }

    if (context.chiefComplaint.toLowerCase().includes('anxiety')) {
      suggestions.push('Do you experience physical symptoms like racing heart or sweating?');
      suggestions.push('Are there specific triggers that worsen your anxiety?');
    }

    return suggestions;
  }

  /**
   * Calculate empathy score from transcript
   * Uses Vertex AI sentiment analysis
   */
  async calculateEmpathyScore(transcript: string): Promise<number> {
    // In production, use Vertex AI sentiment analysis
    // For now, return mock score

    // Look for empathetic phrases
    const empatheticPhrases = [
      'I understand',
      'That must be difficult',
      'How does that make you feel',
      'I hear you',
      'Thank you for sharing',
    ];

    const lowerTranscript = transcript.toLowerCase();
    const matchCount = empatheticPhrases.filter((phrase) =>
      lowerTranscript.includes(phrase.toLowerCase())
    ).length;

    // Score 0-1 based on empathetic phrase density
    const score = Math.min(matchCount * 0.2, 1.0);

    return score;
  }

  /**
   * Call Vertex AI (placeholder for production implementation)
   */
  private async callVertexAI(input: any): Promise<any> {
    // In production:
    // 1. Initialize Vertex AI client with service account
    // 2. Call Gemini API with structured prompt
    // 3. Parse JSON response
    // 4. Return safety alerts, suggestions, empathy score

    this.logger.warn('Vertex AI not implemented, using mock responses');

    return {
      safetyAlerts: [],
      suggestions: [],
      empathyScore: 0.75,
    };
  }

  private mapToAISession(row: any): AISession {
    return {
      id: row.id,
      visitId: row.visit_id,
      providerId: row.provider_id,
      modelVersion: row.model_version,
      promptVersion: row.prompt_version,
      inputData: row.input_data,
      suggestions: row.suggestions || [],
      safetyAlerts: row.safety_alerts || [],
      empathyScores: row.empathy_scores || [],
      nextQuestionHints: row.next_question_hints || [],
      mentorReviewed: row.mentor_reviewed,
      mentorReviewData: row.mentor_review_data,
      mentorLabels: row.mentor_labels,
      createdAt: row.created_at,
    };
  }
}
