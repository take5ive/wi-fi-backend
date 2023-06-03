import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Prisma } from '@prisma/client';
import { providers, ethers } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExApisService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  private readonly uniswapGraphUrl =
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
  private readonly ethProvider = new ethers.providers.JsonRpcProvider(
    'https://eth.llamarpc.com',
  );

  private async getBlockNumberAt(
    // input: timestamp, output: blockNumber
    provider: providers.Provider,
    target: number,
    blockTime: number,
    error: 60,
  ) {
    // 초기값: 현재
    let estimated = await provider.getBlockNumber();
    let estimatedTime = new Date().getTime() / 1000;

    const targetTimeStamp = target;
    // heuristic으로 to 당시의 blocknumber을 구한다. -> 5회까지 반복하여 blocknumber 구함
    for (let i = 0; i < 5; i++) {
      const intervalBlocks = Math.floor(
        (estimatedTime - targetTimeStamp) / blockTime,
      );
      estimated = estimated - intervalBlocks;
      estimatedTime = await provider
        .getBlock(estimated)
        .then((r) => r.timestamp);

      // default: 1분 차이 이내
      if (Math.abs(targetTimeStamp - estimatedTime) <= error) break;
    }
    return {
      blockNumber: estimated,
      timestamp: new Date(estimatedTime * 1000),
    };
  }

  ////////////CRON JOB//////////////////////////
  //Create List Cron
  @Cron(CronExpression.EVERY_12_HOURS) // 매 12 시간마다 실행
  async handCron() {
    if (process.env.DISABLE_CRON == 'false') {
      await this.createUniswapListing();
      await this.createPancakeswapListing();
    }
  }
  //Update pair_ Cron
  @Cron(CronExpression.EVERY_6_HOURS) // 매 6시간마다 실행
  async handCron2() {
    if (process.env.DISABLE_CRON == 'false') {
      await this.updateListingUniswap();
      await this.createPancakeswapListing();
    }
  }
  //Update token_ Cron
  @Cron(CronExpression.EVERY_3_HOURS) // 매 3시간마다 실행
  async handCron3() {
    if (process.env.DISABLE_CRON == 'false') {
      const timestamp = Math.floor(new Date().getTime() / 1000);
      await this.updatetoken_s(timestamp, 1); // 1: uniswap
      await this.updatetoken_s(timestamp, 56); // 56: pancakeswap
    }
  }
  ////////////Service Methods/////////////////////
  async initializedex_chain_() {
    await this.prismaService.chain_.upsert({
      where: {
        chain_Id: 1,
      },
      create: {
        chain_Id: 1,
        name: 'ethereum',
      },
      update: {
        chain_Id: 1,
        name: 'ethereum',
      },
    });
    await this.prismaService.chain_.upsert({
      where: {
        chain_Id: 56,
      },
      create: {
        chain_Id: 56,
        name: 'bsc',
      },
      update: {
        chain_Id: 56,
        name: 'bsc',
      },
    });

    await this.prismaService.dex_.upsert({
      where: {
        name: 'Uniswap V2',
      },
      create: {
        name: 'Uniswap V2',
        chain_: {
          connect: {
            chain_Id: 1,
          },
        },
      },
      update: {
        name: 'Uniswap V2',
        chain_: {
          connect: {
            chain_Id: 1,
          },
        },
      },
    });
    await this.prismaService.dex_.upsert({
      where: {
        name: 'PancakeSwap V2',
      },
      create: {
        name: 'PancakeSwap V2',
        chain_: {
          connect: {
            chain_Id: 56,
          },
        },
      },
      update: {
        name: 'PancakeSwap V2',
        chain_: {
          connect: {
            chain_Id: 56,
          },
        },
      },
    });
  }

  async createUniswapListing() {
    //newest block number 알아오기
    const blocknumber_query = ` {
      _meta{
        block{
          timestamp
        }
      }
    }
    `;

    const data = await firstValueFrom(
      this.httpService
        .post(this.uniswapGraphUrl, { query: blocknumber_query })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happend!';
          }),
        ),
    );

    const timestamp = data.data.data._meta.block.timestamp;
    const curr_time = Math.floor(timestamp / 86400) * 86400 - 1;

    /////////////////BRING pair_S FROM UNISWAP/////////////////
    const pair_s_query = `
    {
        pair_DayDatas(first: 1000, orderBy: dailyVolumeUSD, orderDirection: desc,
       where: {
         date_gt: ${curr_time}
       }
        ) {
            pair_Address
            token_0{
                symbol
                decimals
                id
            }
            token_1{
                symbol
                decimals
                id
            }
            dailyVolumeUSD
            reserveUSD
        }
       }
    `;
    const pair_s_data = await firstValueFrom(
      this.httpService.post(this.uniswapGraphUrl, { query: pair_s_query }).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw 'An error happend!';
        }),
      ),
    );
    //get pair_s and token_s data from db//////////////
    const db_token_s = new Set();
    const db_pair_s = new Set();
    const d_token_s = await this.prismaService.token_.findMany({
      select: {
        address: true,
      },
      where: {
        chain_Id: 1,
      },
    });
    const d_pair_s = await this.prismaService.pair_.findMany({
      select: {
        address: true,
      },
      where: {
        chain_Id: 1,
      },
    });
    d_token_s.forEach((d) => db_token_s.add(d.address));
    d_pair_s.forEach((d) => db_pair_s.add(d.address));

    //UNISWAP에서 가져온 data와 DB에 있는 data 비교하여 중복 제거//////////////
    const token_s = {};
    const pair_s = {};
    const dat = pair_s_data.data.data.pair_DayDatas.filter(
      (d) => +d.dailyVolumeUSD > 10000 && +d.reserveUSD > 10000,
    );
    dat.forEach((d) => {
      if (!(d.token_0.id in token_s) && !db_token_s.has(d.token_0.id)) {
        token_s[d.token_0.id] = {
          symbol: d.token_0.symbol,
          address: d.token_0.id,
          decimals: +d.token_0.decimals,
          chain_Id: 1,
        };
      }
      if (!(d.token_1.id in token_s) && !db_token_s.has(d.token_1.id)) {
        token_s[d.token_1.id] = {
          symbol: d.token_1.symbol,
          address: d.token_1.id,
          decimals: +d.token_1.decimals,
          chain_Id: 1,
        };
      }
      if (!(d.pair_Address in pair_s) && !db_pair_s.has(d.pair_Address)) {
        pair_s[d.pair_Address] = {
          address: d.pair_Address,
          token_0Id: d.token_0.id,
          token_1Id: d.token_1.id,
          dex_Name: 'Uniswap V2',
          chain_Id: 1,
        };
      }
    });
    const token__data: Prisma.Token_CreateManyInput[] = Object.values(token_s);
    const pair__data: Prisma.Pair_CreateManyInput[] = Object.values(pair_s);
    /////////////////ADD TO token_S pair_S DB/////////////////
    if (token__data.length > 0) {
      await this.prismaService.token_.createMany({
        data: token__data,
      });
    }
    if (pair__data.length > 0) {
      await this.prismaService.pair_.createMany({
        data: pair__data,
      });
    }
    console.log(token__data);
    console.log(pair__data);
  }

  async updateListingUniswap() {
    //TODO
    const blocknumber_query = ` {
      _meta{
        block{
          timestamp
          number
        }
      }
    }`;
    const time_block = await firstValueFrom(
      this.httpService
        .post(this.uniswapGraphUrl, { query: blocknumber_query })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happend!';
          }),
        ),
    );
    //GET pair_ INFO FROM DB ///////////////////////
    const pair_s = await this.prismaService.pair_.findMany({
      select: {
        address: true,
      },
      where: {
        chain_Id: 1,
      },
    });

    //GET pair_ INFO FROM UNISWAP ///////////////////////
    const pair_s_id = pair_s.map((d) => d.address);
    const first = pair_s_id.length;

    const now_timestamp: number = time_block.data.data._meta.block.timestamp;
    const now_blocknumber: number = time_block.data.data._meta.block.number;
    const pair_s_query_now = `
    {
      pair_s(first: ${first}, block: {number: ${now_blocknumber}},
       where: {id_in: [${pair_s_id.map((q) => `"${q}"`).join(',')}]}
     ) {
        id
        volumeUSD
        reserveUSD
        token_0{
          symbol
        }
        token_1{
          symbol
        }
       
      }
     }
    `;
    const before_blocknumber = await this.getBlockNumberAt(
      this.ethProvider,
      now_timestamp - 86400,
      12,
      60,
    );
    //----------------//
    const pair_s_query_before = `
    {
      pair_s(first: ${first}, block: {number: ${
      before_blocknumber.blockNumber
    }},
       where: {id_in: [${pair_s_id.map((q) => `"${q}"`).join(',')}]}
     ) {
        id
        volumeUSD
        reserveUSD
        token_0{
          symbol
        }
        token_1{
          symbol
        }
       
      }
     }
    `;

    const [pair_s_data_now, pair_s_data_before] = await Promise.all([
      firstValueFrom(
        this.httpService
          .post(this.uniswapGraphUrl, { query: pair_s_query_now })
          .pipe(
            catchError((error: AxiosError) => {
              console.log(error);
              throw 'An error happend!';
            }),
          ),
      ),
      firstValueFrom(
        this.httpService
          .post(this.uniswapGraphUrl, { query: pair_s_query_before })
          .pipe(
            catchError((error: AxiosError) => {
              console.log(error);
              throw 'An error happend!';
            }),
          ),
      ),
    ]);

    const pair_s_now = pair_s_data_now.data.data.pair_s;
    const pair_s_before = pair_s_data_before.data.data.pair_s;
    const pair_s_combined = [];
    let j = 0;
    for (const i in pair_s_before) {
      if (pair_s_now[j].id != pair_s_before[i].id) {
        while (pair_s_now[j].id != pair_s_before[i].id) {
          j++;
        }
      }
      pair_s_combined.push({
        address: pair_s_now[j].id,
        chain_Id: 1,
        token_0Symbol: pair_s_now[j].token_0.symbol,
        token_1Symbol: pair_s_now[j].token_1.symbol,
        dailyVolumeUSD: +pair_s_now[j].volumeUSD - +pair_s_before[i].volumeUSD,
        reserveUSD: +pair_s_now[j].reserveUSD,
        timestamp: now_timestamp,
        blockNumber: now_blocknumber,
        apr:
          ((+pair_s_now[j].volumeUSD - +pair_s_before[i].volumeUSD) *
            730 *
            0.003) /
          (+pair_s_now[j].reserveUSD + +pair_s_before[i].reserveUSD),
      });
    }
    /////////////////UPDATE pair_S DB/////////////////
    if (pair_s_combined.length > 0) {
      await this.prismaService.pair_Snapshot.createMany({
        data: pair_s_combined,
      });
      await this.prismaService.status_.upsert({
        where: {
          status_: 1,
        },
        create: {
          timestamp: 1,
          timestamp_uniswap: now_timestamp,
          blockNumber_uniswap: now_blocknumber,
          timestamp_pancakeswap: 1,
          timestamp_bifswap: 0,
          timestamp_quickswap: 0,
          token_Timestamp: 1,
          status_: 1,
        },
        update: {
          timestamp_uniswap: now_timestamp,
          blockNumber_uniswap: now_blocknumber,
        },
      });
    }
  }
  async updatetoken_s(timestamp: number, chain_Id: number) {
    const token_s = await this.prismaService.token_.findMany({
      where: {
        chain_Id: chain_Id,
      },
      select: {
        address: true,
        chain_: {
          select: {
            name: true,
          },
        },
      },
    });

    const token_s_list = token_s.map((d) => d.address).join(',');
    const chain_ = token_s[0].chain_.name;

    const url = `https://api.coingecko.com/api/v3/simple/token__price/${chain_}`;

    const data = await firstValueFrom(
      this.httpService
        .get(url, {
          params: {
            contract_addresses: token_s_list,
            vs_currencies: 'usd',
            include_market_cap: 'true',
            include_24hr_vol: 'true',
            include_24hr_change: 'true',
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happend!';
          }),
        ),
    );
    const token_Snapshot = [];
    for (const i in data.data) {
      token_Snapshot.push({
        address: i,
        chain_Id: chain_Id,
        timestamp: timestamp,
        priceUSD: data.data[i].usd,
        usd_market_cap: data.data[i].usd_market_cap,
        dailyVolumeUSD: data.data[i].usd_24h_vol,
        daily_change: data.data[i].usd_24h_change,
      });
    }
    await this.prismaService.tokenSnapshot.createMany({
      data: token_Snapshot,
    });
    await this.prismaService.status_.upsert({
      where: {
        status_: 1,
      },
      create: {
        timestamp: 0,
        timestamp_uniswap: 0,
        blockNumber_uniswap: 0,
        timestamp_pancakeswap: 0,
        timestamp_bifswap: 0,
        timestamp_quickswap: 0,
        token_Timestamp: timestamp,
        status_: 1,
      },
      update: {
        token_Timestamp: timestamp,
      },
    });
  }

  async createPancakeswapListing() {
    //1684281600
    const curr_time =
      Math.floor(new Date().getTime() / 1000 / 86400) * 86400 - 86400;
    const pair_s_query = `
    {
      pair_DayDatas( first: 100, skip: 0,  
      orderBy: dailyVolumeUSD, orderDirection: desc,
      where: {
        date: ${curr_time}
      }
      )
       { 
        id
         pair_Address{
             id
             name
         }
         token_0{
          symbol
         }
         token_1{
          symbol
         }
         date
         dailyVolumeUSD
         reserveUSD
         totalSupply
      }
   }
    `;
    const url = `https://open-platform.nodereal.io/${process.env.NODEREAL_APIKEY}/pancakeswap-free/graphql`;
    const data = await firstValueFrom(
      this.httpService.post(url, { query: pair_s_query }).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw 'An error happend!';
        }),
      ),
    );

    const ps = new Set();
    const pair_s_snapshot = await this.prismaService.pair_Snapshot.findMany({
      where: {
        timestamp: curr_time,
        chain_Id: 56,
      },
      select: {
        address: true,
      },
    });
    pair_s_snapshot.forEach((d) => ps.add(d.address));
    const dat = {};
    const pair_s_snapshot_db = [];
    data.data.data.pair_DayDatas.forEach((d) => {
      if (d.dailyVolumeUSD > 50000 && d.reserveUSD > 100000) {
        dat[d.pair_Address.id] = {
          address: d.pair_Address.id,
          dex_Name: 'PancakeSwap V2',
          chain_Id: 56,
        };
        if (!(d.pair_Address.id in ps)) {
          pair_s_snapshot_db.push({
            chain_Id: 56,
            address: d.pair_Address.id,
            token_0Symbol: d.token_0.symbol,
            token_1Symbol: d.token_1.symbol,
            timestamp: d.date,
            blockNumber: 0,
            dailyVolumeUSD: +d.dailyVolumeUSD,
            reserveUSD: +d.reserveUSD,
            apr: (+d.dailyVolumeUSD * 730 * 0.003) / +d.reserveUSD,
          });
        }
      }
    });
    console.log(Object.values(dat).length);

    const pair_s = Object.keys(dat);
    const first = pair_s.length;
    // console.log(pair_s);
    const token_s_query = `
    {
      pair_s(first: ${first}, where: {id_in: [${pair_s
      .map((d) => `"${d}"`)
      .join(',')}]}
    ) {
        token_0 {
          id
          symbol
          decimals
        }
        token_1{
          id
          symbol
          decimals
        }
        id
    }
  }
    `;
    const data_token_ = await firstValueFrom(
      this.httpService.post(url, { query: token_s_query }).pipe(
        catchError((error: AxiosError) => {
          console.log(error);
          throw 'An error happend!';
        }),
      ),
    );

    const db_token_ = {};

    for (const i of data_token_.data.data.pair_s) {
      db_token_[i.token_0.id] = {
        symbol: i.token_0.symbol,
        address: i.token_0.id,
        decimals: +i.token_0.decimals,
        chain_Id: 56,
      };
      db_token_[i.token_1.id] = {
        symbol: i.token_1.symbol,
        address: i.token_1.id,
        decimals: +i.token_1.decimals,
        chain_Id: 56,
      };
      dat[i.id].token_0Id = i.token_0.id;
      dat[i.id].token_1Id = i.token_1.id;
    }

    const token__data: Prisma.Token_CreateManyInput[] =
      Object.values(db_token_);
    const pair__data: Prisma.Pair_CreateManyInput[] = Object.values(dat);
    const db_token_s = new Set();
    const db_pair_s = new Set();
    const d_token_s = await this.prismaService.token_.findMany({
      select: {
        address: true,
      },
      where: {
        chain_Id: 56,
      },
    });
    const d_pair_s = await this.prismaService.pair_.findMany({
      select: {
        address: true,
      },
      where: {
        chain_Id: 56,
      },
    });
    d_token_s.forEach((d) => db_token_s.add(d.address));
    d_pair_s.forEach((d) => db_pair_s.add(d.address));
    const token__dat = token__data.filter((d) => !db_token_s.has(d.address));
    const pair__dat = pair__data.filter((d) => !db_pair_s.has(d.address));
    /////////////////ADD TO token_S pair_S DB/////////////////
    if (token__dat.length > 0) {
      await this.prismaService.token_.createMany({
        data: token__dat,
      });
    }
    console.log(`token__update: ${token__dat.length}`);
    if (pair__dat.length > 0) {
      await this.prismaService.pair_.createMany({
        data: pair__dat,
      });
    }
    console.log(`pair__update: ${pair__dat.length}`);
    ///// UPDATE pair_S_SNAPSHOT DB ///////
    if (pair_s_snapshot_db.length > 0) {
      await this.prismaService.pair_Snapshot.createMany({
        data: pair_s_snapshot_db,
      });
    }
    console.log(`pair_Snapshot_update: ${pair_s_snapshot_db.length}`);
    await this.prismaService.status_.upsert({
      where: {
        status_: 1,
      },
      create: {
        timestamp: 1,
        timestamp_uniswap: 0,
        blockNumber_uniswap: 0,
        timestamp_pancakeswap: curr_time,
        timestamp_bifswap: 0,
        timestamp_quickswap: 0,
        token_Timestamp: 1,
        status_: 1,
      },
      update: {
        timestamp_pancakeswap: curr_time,
      },
    });
  }
  //////////WARNING ONLY FOR TESTNET/////////////////////
  async initializeTchain_dex_() {
    await this.prismaService.dex_.deleteMany();
    await this.prismaService.chain_.deleteMany();
    await this.prismaService.chain_.createMany({
      data: [
        {
          chain_Id: 97,
          name: 'bsc_testnet',
        },
      ],
    });
    await this.prismaService.dex_.create({
      data: {
        name: 'PancakeSwap V2',
        chain_: {
          connect: {
            chain_Id: 97,
          },
        },
      },
    });
  }
  async createTestnetDummyData() {
    //ethers.constants.AddressZero --> native token_ address
    //1. initialize chain_s, dex_es, status_
    await this.prismaService.$transaction([
      this.prismaService.dex_.deleteMany(),
      this.prismaService.chain_.deleteMany(),
      this.prismaService.status_.deleteMany(),
      this.prismaService.chain_.createMany({
        data: [],
      }),
      this.prismaService.dex_.createMany({
        data: [],
      }),
      this.prismaService.status_.create({
        data: {
          timestamp: 0,
          timestamp_uniswap: 0,
          blockNumber_uniswap: 0,
          timestamp_pancakeswap: 0,
          timestamp_bifswap: 0,
          timestamp_quickswap: 0,
          token_Timestamp: 0,
          status_: 1,
        },
      }),
    ]);
  }
}
