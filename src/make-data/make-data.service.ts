import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import {
  chainInterface,
  tokenInterface,
  dexInterface,
  pairInterface,
} from './interface/nonRandomData.interface';

@Injectable()
export class MakeDataService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly x = {
    baobab: {
      chainId: 1001,
      USDC_6: '0x597653951027c042958e60007d9044AF1B753f5F',
      USDT_6: '0x2e878772e49516FD5Ff4A848ec410db71ad1DcE6',
      WBTC_18: '0x5281278F9066223632915F6cA846E26abE2EbB2A',
      WETH_18: '0x15bb48F04AE662AF87DEb5efbe266593Cba99255',
      USDC_WETH_Pair: '0x9297b4c9A3679abC63C0C7a6Da60E425fBe51dCd',
      USDT_WETH_Pair: '0x1d243895cB0E739A9353dE10397466Bcd04130C8',
      USDC_USDT_Pair: '0xA39EDB1B9e42d3E03819Afc89B351466d9c1D93a',
      USDC_WBTC_Pair: '0x45122844F2DB17392A3b88f9b31b65b56B784a3b',
      USDT_WBTC_Pair: '0xf674330051b3fcD68645B71ef8e5367511A0897F',
      WETH_WBTC_Pair: '0xCe893024bef9Cf7CF8353d558a64Cb0EFAA90706',
      dex: 'Uniswap V2',
    },
    chiado: {
      chainId: 10200,
      USDC_6: '0xAF7552931152170Bf3f1585dd97075B4A47dbd71',
      USDT_6: '0xaaC552Eb6519456f9fF596B97266ee9F5f68d09C',
      WBTC_18: '0xa83EC0095295E87D9dfe544E4E6EdC48C3B48a34',
      WETH_18: '0x42A7ddC4C5814eDD824353BD9CbdCB4D2f1AAdce',
      USDC_WETH_Pair: '0xe41A1C20d783982393F0936C123A82953eDa98f3',
      USDT_WETH_Pair: '0xb66C0dcF9f824156cB718b3eC3A007488890D028',
      USDC_USDT_Pair: '0x906c4f715878F980816A16e912840609f5f6E507',
      USDC_WBTC_Pair: '0xa874e4d38EC3D091495E4822219106f52c0ADCA6',
      USDT_WBTC_Pair: '0x03b305DA9F0EDC3Df0704D17F51689568fa9f228',
      WETH_WBTC_Pair: '0xfDEE68d55DB1f30cF52Feba942969846077FEfC0',
      dex: 'Uniswap V2',
    },
    goerli: {
      chainId: 5,
      USDC_18: '0x7ea6ea49b0b0ae9c5db7907d139d9cd3439862a1',
      USDT_6: '0x9f65d8E5c6947a4D6B11B3059e174C48F9b8c516',
      PEPE_18: '0x5B9C6cCc716F635392060f1580a8AdAF85C76a14',
      WETH_18: '0x227A02c6617f02a40a28570E8F272b528aC42cfB',
      USDC_WETH_Pair: '0x4b4d80b80Cc24E94c002588a7FA1572CFab078C2',
      USDT_WETH_Pair: '0xCC61560497922C268164CE453f6452a3e6D31C05',
      USDC_USDT_Pair: '0xa9d26b97D25Eb94CBEE1773F9BCFD1938e60EcCA',
      USDC_PEPE_Pair: '0xfa8Db578340654E7CF8870a896950ceAB3a9d6B7',
      USDT_PEPE_Pair: '0x409C9DBC8421408DFD33822966aeDdAf14706dc0',
      WETH_PEPE_Pair: '0x7fE36BbefAC77548B299d58fDF90309e008eB1b2',
      dex: 'Uniswap V2',
    },
    mumbai: {
      chainId: 80001,
      USDT_6: '0x2BEe6c37Ca26D5c341E1B7eC71d5BCdd705539c1',
      WBTC_18: '0xB499C2788bb5F0DA3DC389A7DcFAA7f03EF7dfbE',
      WETH_18: '0x3a4E2BB60048Efe94cbCB8092651fbFDD2FBF595',
      USDC_18: '0xedb95d8037f769b72aaab41deec92903a98c9e16',
      USDC_WETH_Pair: '0x431c51BB5Bc37e32523614178Df35eb780baaF15',
      USDT_WETH_Pair: '0x6aE441c8d2E012A786b00929f22044D99d7bF922',
      USDC_USDT_Pair: '0x00CE9D2E0f3C0C73482CCbd0974c07FD2581F78e',
      USDC_WBTC_Pair: '0x264e4904B749E822cb7237fA4a63562a0F215ADa',
      USDT_WBTC_Pair: '0x16fB714693b372A8276142C9F71270163242E4F9',
      WETH_WBTC_Pair: '0x1a28d11a36b0902090d611360AD1Cbc58A191ea5',
      dex: 'Uniswap V2',
    },
  };

  async makeNonRandomData() {
    const chain = {};
    const pair = [];
    const dex = {};
    const token = [];

    for (const i in this.x) {
      chain[i] = {
        chainId: this.x[i].chainId,
        name: i,
      };
      for (const j in this.x[i]) {
        const tokens_ = j.split('_');
        console.log(j, tokens_);
        if (tokens_.length == 1) {
          if (tokens_[0] == 'dex') {
            dex[this.x[i][j]] = {
              name: this.x[i][j],
            };
          }
        } else if (tokens_.length == 2) {
          token.push({
            address: this.x[i][j],
            symbol: tokens_[0],
            name: tokens_[0],
            decimals: parseInt(tokens_[1]),
            chainId: this.x[i].chainId,
          });
        } else if (tokens_.length == 3) {
          console.log(token, tokens_[0]);
          let token0Id_;
          let token1Id_;

          token.forEach((t) => {
            if (t.symbol == tokens_[0] && t.chainId == this.x[i].chainId) {
              token0Id_ = t.address;
            }
            if (t.symbol == tokens_[1] && t.chainId == this.x[i].chainId) {
              token1Id_ = t.address;
            }
          });
          pair.push({
            address: this.x[i][j],
            token0Symbol: tokens_[0],
            token1Symbol: tokens_[1],
            token0Id: token0Id_,
            token1Id: token1Id_,
            chainId: this.x[i].chainId,
            dexName: this.x[i].dex,
          });
        }
      }
    }
    const chainData: chainInterface[] = Object.values(chain);
    const tokenData: tokenInterface[] = token;
    const dexData: dexInterface[] = Object.values(dex);
    const pairData: pairInterface[] = pair;

    console.log(chainData);
    console.log(tokenData);
    console.log(dexData);
    console.log(pairData);

    await this.prisma.$transaction([
      //delete all
      this.prisma.pairSnapshot.deleteMany(),
      this.prisma.pair.deleteMany(),
      this.prisma.token.deleteMany(),
      this.prisma.dex.deleteMany(),
      this.prisma.chain.deleteMany(),
      // insert all
      this.prisma.chain.createMany({
        data: chainData,
      }),
      this.prisma.token.createMany({
        data: tokenData,
      }),
      this.prisma.dex.createMany({
        data: dexData,
      }),
      this.prisma.pair.createMany({
        data: pairData,
      }),
    ]);
  }

  async makeRandomData() {
    const pair: pairInterface[] = await this.prisma.pair.findMany();

    const timestamp = Math.floor(new Date().getTime() / 1000);

    const pairSnapshot = pair.map((p) => {
      const reserveUSD = Math.random() * 9000000 + 1000000;
      const apr = Math.random() * 60 + 3;
      const apy = Math.pow(1 + apr / 36500, 365) * 100 - 100;
      const volumeUSD = (reserveUSD * apr) / (365 * 0.3);
      return {
        chainId: p.chainId,
        token0Symbol: p.token0Symbol,
        token1Symbol: p.token1Symbol,
        address: p.address,
        snapshotTimestamp: timestamp,
        reserveUSD: reserveUSD,
        volumeUSD: volumeUSD,
        apr: apr,
        apy: apy,
      };
    });
    // const tokenSnapshot = token.map((t) => {});
    const status = {
      timestamp: timestamp,
    };
    await this.prisma.$transaction([
      this.prisma.pairSnapshot.createMany({
        data: pairSnapshot,
      }),
      this.prisma.status.create({
        data: status,
      }),
    ]);
  }
}
