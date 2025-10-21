import { Module } from '@nestjs/common';
import { ERxService } from './erx.service';

@Module({
  providers: [ERxService],
  exports: [ERxService],
})
export class ERxModule {}
