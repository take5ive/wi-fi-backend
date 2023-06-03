import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { DexService } from './dex.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PairSnapshotListDto } from './dto/pairsSnapshot.dto';

@Controller('dex')
export class DexController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dexService: DexService,
  ) {}

  @Get('topAprs')
  @ApiOperation({ summary: 'Get top APRs' })
  @ApiResponse({ type: PairSnapshotListDto })
  async getTopAprs(): Promise<PairSnapshotListDto> {
    return await this.dexService.getTopAprs();
  }
}
