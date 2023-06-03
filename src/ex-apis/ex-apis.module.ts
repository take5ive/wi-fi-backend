import { Module } from '@nestjs/common';
import { ExApisService } from './ex-apis.service';
import { ExApisController } from './ex-apis.controller';
import { PrismaService } from 'src/common/services/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [ExApisService, PrismaService],
  controllers: [ExApisController],
})
export class ExApisModule {}
