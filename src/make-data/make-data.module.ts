import { Module } from '@nestjs/common';
import { MakeDataService } from './make-data.service';
import { MakeDataController } from './make-data.controller';
import { PrismaService } from 'src/common/services/prisma.service';

@Module({
  controllers: [MakeDataController],
  providers: [MakeDataService, PrismaService],
})
export class MakeDataModule {}
