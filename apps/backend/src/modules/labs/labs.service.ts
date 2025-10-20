import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class LabsService {
  constructor(private readonly db: DatabaseService) {}

  async create(patientId: string, data: any) {
    return this.db.create('lab_results', {
      patient_id: patientId,
      lab_name: data.labName,
      lab_category: data.labCategory,
      result_date: data.resultDate,
      results: data.results,
    });
  }

  async findById(id: string) {
    return this.db.findOne('lab_results', { id });
  }
}
