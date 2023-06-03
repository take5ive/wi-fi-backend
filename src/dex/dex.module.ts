import { Module } from '@nestjs/common';
import { DexController } from './dex.controller';
import { PrismaService } from 'src/common/services/prisma.service';
import { DexService } from './dex.service';

@Module({
  controllers: [DexController],
  providers: [PrismaService, DexService],
})
export class DexModule {}
//
