import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNumber, IsString } from 'class-validator';
import { PairSnapshotInfo } from '../interface/pairSnapshotInfo.interface';

class PairSnapshotDto {
  @ApiProperty({
    title: 'pairId',
    example: '1',
  })
  pairId: string;
  @ApiProperty({
    title: 'chainId',
    example: '1',
  })
  chainId: number;

  @ApiProperty({
    title: 'token0Info',
  })
  token0: {
    address: string;
    symbol: string;
    decimals: number;
  };
  @ApiProperty({
    title: 'token1Info',
  })
  token1: {
    address: string;
    symbol: string;
    decimals: number;
  };

  @ApiProperty({
    title: 'address',
    example: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
  })
  @IsEthereumAddress()
  address: string;

  @ApiProperty({
    title: 'snapshotTimestamp',
    example: 1685458800,
  })
  @IsNumber()
  snapshotTimestamp: number;

  @ApiProperty({
    title: 'reserveUSD',
    example: 1000000,
  })
  @IsNumber()
  reserveUSD: number;

  @ApiProperty({
    title: 'volumeUSD',
    example: 1000000,
  })
  @IsNumber()
  volumeUSD: number;

  @ApiProperty({
    title: 'apr (%)',
    example: 13.15,
  })
  @IsNumber()
  apr: number;

  @ApiProperty({
    title: 'apy (%)',
    example: 15.12,
  })
  @IsNumber()
  apy: number;

  @ApiProperty({
    title: 'dexName',
    example: 'Uniswap V2',
  })
  @IsString()
  protocol: string;
}

export class PairSnapshotListDto {
  @ApiProperty({
    title: 'pairSnapshots',
    type: [PairSnapshotDto],
  })
  pairSnapshots: PairSnapshotDto[];
  static of(pairSnapshots: PairSnapshotInfo[]): PairSnapshotListDto {
    const dto = new PairSnapshotListDto();
    dto.pairSnapshots = pairSnapshots.map((pairSnapshot) => {
      const pairSnapshotDto = new PairSnapshotDto();
      pairSnapshotDto.pairId = pairSnapshot.pair.id;
      pairSnapshotDto.chainId = pairSnapshot.chainId;
      pairSnapshotDto.address = pairSnapshot.address;
      pairSnapshotDto.token0 = pairSnapshot.pair.token0;
      pairSnapshotDto.token1 = pairSnapshot.pair.token1;
      pairSnapshotDto.snapshotTimestamp = pairSnapshot.snapshotTimestamp;
      pairSnapshotDto.reserveUSD = pairSnapshot.reserveUSD;
      pairSnapshotDto.volumeUSD = pairSnapshot.volumeUSD;
      pairSnapshotDto.apr = pairSnapshot.apr;
      pairSnapshotDto.apy = pairSnapshot.apy;
      pairSnapshotDto.protocol = pairSnapshot.pair.dexName;
      return pairSnapshotDto;
    });
    return dto;
  }
}
