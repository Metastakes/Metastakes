import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Send email to ${to}: ${subject}`);
  }

  async sendSMS(to: string, message: string): Promise<void> {
    this.logger.log(`Send SMS to ${to}: ${message}`);
  }
}
