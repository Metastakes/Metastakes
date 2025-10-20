import { Module } from '@nestjs/common';
import { GLP1Service } from './glp1.service';
import { GLP1Controller } from './glp1.controller';

@Module({
  controllers: [GLP1Controller],
  providers: [GLP1Service],
  exports: [GLP1Service],
})
export class GLP1Module {}
