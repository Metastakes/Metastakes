/**
 * Encryption Service
 * AES-256-GCM encryption for PHI data
 * HIPAA-compliant encryption at rest
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be set in environment variables');
    }

    // Ensure key is 32 bytes for AES-256
    this.key = Buffer.from(encryptionKey);

    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes');
    }

    this.logger.log('Encryption service initialized with AES-256-GCM');
  }

  /**
   * Encrypt sensitive data (PHI)
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error(`Encryption error: ${error.message}`);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    try {
      // Parse iv:authTag:encrypted
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption error: ${error.message}`);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way, for searches)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Compare hash with plaintext (constant-time comparison)
   */
  compareHash(hash: string, plaintext: string): boolean {
    const computedHash = this.hash(plaintext);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }
}
