import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/common/services/cache.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { PairSnapshotListDto } from './dto/pairsSnapshot.dto';

@Injectable()
export class DexService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getTopAprs(): Promise<PairSnapshotListDto> {
    const cacheKey = 'topDexAprs';
    const cached = await this.cacheService.get<PairSnapshotListDto>(cacheKey);
    if (cached) return cached;

    let status_cache = await this.cacheService.get('status');
    if (!status_cache) {
      const [status] = await this.prismaService.status.findMany({
        take: 1,
        orderBy: {
          timestamp: 'desc',
        },
      });
      await this.cacheService.set('status', status.timestamp, 10000);
      status_cache = await this.cacheService.get('status');
    }
    const pairSnapshots = await this.prismaService.pairSnapshot.findMany({
      where: {
        snapshotTimestamp: status_cache,
      },
      select: {
        chainId: true,
        pair: {
          select: {
            id: true,
            token0: {
              select: {
                address: true,
                symbol: true,
                decimals: true,
              },
            },
            token1: {
              select: {
                address: true,
                symbol: true,
                decimals: true,
              },
            },
            dexName: true,
          },
        },
        address: true,
        snapshotTimestamp: true,
        reserveUSD: true,
        volumeUSD: true,
        apr: true,
        apy: true,
      },
      orderBy: {
        apr: 'desc',
      },
    });
    const pairSnapshotList = PairSnapshotListDto.of(pairSnapshots);
    this.cacheService.set(cacheKey, pairSnapshotList, 10000);
    console.log(pairSnapshotList);
    return pairSnapshotList;
  }
}
