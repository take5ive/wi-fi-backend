export interface chainInterface {
  chainId: number;
  name: string;
}

export interface pairInterface {
  address: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Id: string;
  token1Id: string;
  chainId: number;
  dexName: string;
}

export interface dexInterface {
  name: string;
}

export interface tokenInterface {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
}
