import { Controller, Post } from '@nestjs/common';
import { MakeDataService } from './make-data.service';

@Controller('make-data')
export class MakeDataController {
  constructor(private readonly make: MakeDataService) {}
  @Post('nonRandomData')
  async makeNonRandomData() {
    return await this.make.makeNonRandomData();
  }
  @Post('randomData')
  async makeRandomData() {
    return await this.make.makeRandomData();
  }
}

//Token
//Chain
//Pair
//PairSnapshot
//Dex
//Status

//Non-Random Data//
//1. Chain
// chainId, name
//2. Pair
// address, token0Symbol, token1Symbol
// token0Id, token1Id, chainId, dexName
// RR - token0(token0Id, chainId)
// RR - token1(token1Id, chainId)
// RR - chain(chainId)
//3. Dex
// name
//4. Token
// address, symbol, name, decimals, chainId
// RR - chain(chainId)

//Random Data//
//1. PairSnapshot
//2. TokenSnapshot
//3. Status
