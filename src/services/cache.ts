import { JsonRpcProvider } from "@ethersproject/providers";
import { PopulatedTransaction, providers } from "ethers";
import { BigNumber } from "bignumber.js";
import { EthNftInfo, NftInfo, Web3Helper } from "xp.network";

export interface IEstimateCacheService {
  get(nft: NftInfo<string>, to: string): Promise<BigNumber>;
}

export interface CacheExpiry {
  getCacheExpiry(): number;
}

export function gasLimitCacheService(
  cacheExpiry: number = 3.6e6,
  web3Helper: Web3Helper
): IEstimateCacheService & CacheExpiry {
  let _cache_ms = Date.now();
  let gasPriceCache: Map<string, BigNumber> | undefined = undefined;

  async function getCache(
    to: string,
    nft: NftInfo<string>
  ): Promise<Map<string, BigNumber>> {
    const fetchCache = async () => {
      const fee = await web3Helper.estimateValidateTransferNft(to, nft);
      gasPriceCache = new Map().set(nft.uri, fee);
      _cache_ms = Date.now();
    };
    if (gasPriceCache === undefined) {
      await fetchCache();
    } else if (getCacheExpiry() == 0) {
      const old_cache = new Map(gasPriceCache);
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
    get: async (nft, to) => {
      const cache = await getCache(to, nft);
      const f1 = cache.get(nft.uri);
      return f1!;
    },
    getCacheExpiry,
  };
}
