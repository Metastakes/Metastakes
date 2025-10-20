import { Module } from '@nestjs/common';
import { PDMPService } from './pdmp.service';
import { PDMPController } from './pdmp.controller';

@Module({
  controllers: [PDMPController],
  providers: [PDMPService],
  exports: [PDMPService],
})
export class PDMPModule {}
