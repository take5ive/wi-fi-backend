import { Module } from '@nestjs/common';
import { AprsController } from './aprs.controller';
import { PrismaService } from 'src/common/services/prisma.service';
import { CacheService } from 'src/common/services/cache.service';
import { AprsService } from './aprs.service';

@Module({
  controllers: [AprsController],
  providers: [PrismaService, AprsService],
})
export class AprsModule {}
