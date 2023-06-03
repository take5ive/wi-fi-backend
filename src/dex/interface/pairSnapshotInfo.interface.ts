export interface PairSnapshotInfo {
  chainId: number;
  pair: {
    id: string;
    token0: {
      address: string;
      symbol: string;
      decimals: number;
    };
    token1: {
      address: string;
      symbol: string;
      decimals: number;
    };
    dexName: string;
  };
  address: string;
  snapshotTimestamp: number;
  reserveUSD: number;
  volumeUSD: number;
  apr: number;
  apy: number;
}
