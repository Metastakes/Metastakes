/**
 * PDMP Service
 * Florida E-FORCSE integration for prescription drug monitoring
 * Required before prescribing Schedule II-V controlled substances
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database/database.service';
import { PDMPResult } from '@neurobridge/shared';
import axios from 'axios';

@Injectable()
export class PDMPService {
  private readonly logger = new Logger(PDMPService.name);
  private readonly pdmpApiUrl: string;
  private readonly pdmpApiKey: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {
    this.pdmpApiUrl = this.configService.get<string>('PDMP_API_URL') || '';
    this.pdmpApiKey = this.configService.get<string>('PDMP_API_KEY') || '';
  }

  /**
   * Check PDMP for patient (Florida E-FORCSE)
   * This is REQUIRED before prescribing controlled substances in Florida
   */
  async checkPatient(
    patientId: string,
    providerId: string,
    visitId?: string
  ): Promise<PDMPResult> {
    this.logger.log(`PDMP check initiated for patient ${patientId} by provider ${providerId}`);

    try {
      // In production, this would call actual E-FORCSE API
      // For now, return mock data with safety analysis
      const mockResponse = await this.callPDMPAPI(patientId);

      // Analyze results for red flags
      const redFlags = this.analyzeRedFlags(mockResponse);
      const riskScore = this.calculateRiskScore(mockResponse, redFlags);

      const result: PDMPResult = {
        prescriptionsFound: mockResponse.prescriptions.length,
        providersFound: mockResponse.providers.length,
        pharmaciesFound: mockResponse.pharmacies.length,
        redFlags,
        riskScore,
        rawData: mockResponse,
      };

      // Store PDMP check in database (HIPAA audit requirement)
      await this.db.create('pdmp_checks', {
        patient_id: patientId,
        provider_id: providerId,
        visit_id: visitId || null,
        state: 'FL',
        result_data: result,
        prescriptions_found: result.prescriptionsFound,
        providers_found: result.providersFound,
        pharmacies_found: result.pharmaciesFound,
        red_flags: result.redFlags,
        risk_score: result.riskScore,
        provider_acknowledged: false,
      });

      this.logger.log(
        `PDMP check completed: ${result.prescriptionsFound} prescriptions, risk score: ${result.riskScore}`
      );

      return result;
    } catch (error) {
      this.logger.error(`PDMP check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Acknowledge PDMP check (provider must review before prescribing)
   */
  async acknowledgePDMPCheck(
    pdmpCheckId: string,
    providerId: string,
    notes: string
  ): Promise<void> {
    await this.db.update(
      'pdmp_checks',
      { id: pdmpCheckId },
      {
        provider_acknowledged: true,
        acknowledged_at: new Date(),
        clinical_notes: notes,
      }
    );

    this.logger.log(`PDMP check ${pdmpCheckId} acknowledged by provider ${providerId}`);
  }

  /**
   * Call E-FORCSE API (mock implementation)
   */
  private async callPDMPAPI(patientId: string): Promise<any> {
    // In production, call actual E-FORCSE API
    // For now, return mock data

    if (!this.pdmpApiUrl || !this.pdmpApiKey) {
      this.logger.warn('PDMP API not configured, returning mock data');

      return {
        prescriptions: [
          {
            medication: 'Adderall 20mg',
            prescriber: 'Dr. Smith',
            pharmacy: 'CVS Pharmacy',
            dateDispensed: '2025-10-15',
            quantity: 30,
            schedule: 'II',
          },
        ],
        providers: ['Dr. Smith (NPI: 1234567890)'],
        pharmacies: ['CVS Pharmacy (NCPDP: 1234567)'],
      };
    }

    try {
      const response = await axios.post(
        this.pdmpApiUrl,
        {
          patientId,
          state: 'FL',
        },
        {
          headers: {
            Authorization: `Bearer ${this.pdmpApiKey}`,
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error(`E-FORCSE API call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze PDMP results for red flags
   */
  private analyzeRedFlags(data: any): string[] {
    const redFlags: string[] = [];

    // Multiple prescribers for same medication class
    if (data.providers.length > 3) {
      redFlags.push('Multiple prescribers (doctor shopping concern)');
    }

    // Multiple pharmacies
    if (data.pharmacies.length > 2) {
      redFlags.push('Multiple pharmacies (pharmacy shopping concern)');
    }

    // Recent controlled substance prescriptions
    const recentPrescriptions = data.prescriptions.filter((p: any) => {
      const date = new Date(p.dateDispensed);
      const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 30 && ['II', 'III', 'IV'].includes(p.schedule);
    });

    if (recentPrescriptions.length > 3) {
      redFlags.push('Multiple recent controlled substance prescriptions');
    }

    // Overlapping stimulants + benzodiazepines (dangerous combination)
    const hasStimulants = data.prescriptions.some((p: any) =>
      p.medication.toLowerCase().includes('adderall')
    );
    const hasBenzos = data.prescriptions.some((p: any) =>
      p.medication.toLowerCase().includes('xanax')
    );

    if (hasStimulants && hasBenzos) {
      redFlags.push('Concurrent stimulants and benzodiazepines (dangerous combination)');
    }

    return redFlags;
  }

  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore(data: any, redFlags: string[]): number {
    let score = 0;

    // Base score from number of red flags
    score += redFlags.length * 20;

    // Additional points for high prescription count
    if (data.prescriptions.length > 5) {
      score += 10;
    }

    // Cap at 100
    return Math.min(score, 100);
  }
}
