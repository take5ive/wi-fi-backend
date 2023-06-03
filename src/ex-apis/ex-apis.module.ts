import { Module } from '@nestjs/common';
import { ExApisService } from './ex-apis.service';
import { ExApisController } from './ex-apis.controller';

@Module({
  providers: [ExApisService],
  controllers: [ExApisController],
})
export class ExApisModule {}
