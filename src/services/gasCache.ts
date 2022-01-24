import { CacheExpiry, IEstimateCacheService } from "./cache";
import { BigNumber } from "ethers";
import { providers } from "ethers";

export interface IGasPriceCacheService {
  get(): Promise<BigNumber>;

  hit(): boolean;
}

export function gasPriceCache(
  w3: providers.Provider,
  cacheExpiry: number = 1e4
): IGasPriceCacheService & CacheExpiry {
  let _cache_ms = Date.now();
  let gasPriceCache: BigNumber | undefined = undefined;

  async function getCache(): Promise<BigNumber> {
    const fetchCache = async () => {
      gasPriceCache = await w3.getGasPrice();
      _cache_ms = Date.now();
    };
    if (gasPriceCache === undefined) {
      await fetchCache();
    } else if (getCacheExpiry() == 0) {
      const old_cache = gasPriceCache;
      await fetchCache().catch((e) => {
        console.warn(`failed to fetch exchange rate: ${e}, using old data!`);
        gasPriceCache = old_cache;
      });
    }

    return gasPriceCache!;
  }
  const getCacheExpiry = () => {
    const diff = Date.now() - _cache_ms;
    if (diff > cacheExpiry) {
      return 0;
    } else {
      return cacheExpiry - diff;
    }
  };

  return {
    get: async () => {
      const cache = getCache();
      return cache;
    },
    getCacheExpiry,
    hit: () => {
      return gasPriceCache !== undefined;
    },
  };
}
