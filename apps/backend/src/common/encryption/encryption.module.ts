/**
 * Encryption Module
 * AES-256-GCM encryption for PHI data (HIPAA compliance)
 */

import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
