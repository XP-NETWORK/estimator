import { BigNumber } from "ethers";

export interface IGasPriceCacheService {
  get(): Promise<BigNumber>;

  hit(): boolean;
}

export interface CacheExpiry {
  getCacheExpiry(): number;
}
