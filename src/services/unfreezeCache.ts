import { BigNumber } from "bignumber.js";
import { PopulatedTransaction, providers } from "ethers";
import { Minter__factory } from "xpnet-web3-contracts";
import { Nft } from "../models/Nft";
import { CacheExpiry } from "./cache";
import { EVM_VALIDATORS, IEstimateCacheService } from "./transferCache";

export function unfreezeGasLimitCacheService(
  cacheExpiry: number = 3.6e6,
  web3Helper: providers.Provider
): IEstimateCacheService & CacheExpiry {
  let _cache_ms = Date.now();
  let gasPriceCache: Map<string, BigNumber> | undefined = undefined;

  async function getCache(
    to: string,
    nft: Nft
  ): Promise<Map<string, BigNumber>> {
    const fetchCache = async () => {
      const fee = await estimateValidateUnfreezeNft(to, nft, web3Helper);
      console.log(fee.toString(10));
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
const randomAction = () =>
  new BigNumber(
    Math.floor(Math.random() * 999 + (Number.MAX_SAFE_INTEGER - 1000))
  );

export async function estimateValidateUnfreezeNft(
  to: string,
  nft: Nft,
  provider: providers.Provider
) {
  const minter = Minter__factory.connect(
    "0x5B916EFb0e7bc0d8DdBf2d6A9A7850FdAb1984C4",
    provider
  );
  const utx = await minter.populateTransaction.validateUnfreezeNft(
    randomAction().toString(),
    to,
    nft.uri,
    nft.wrapperContract!
  );
  return await estimateGas(EVM_VALIDATORS, utx, provider);
}

export async function estimateGas(
  addrs: string[],
  utx: PopulatedTransaction,
  w3: providers.Provider
): Promise<BigNumber> {
  utx.from = addrs[0];
  let td = await w3.estimateGas(utx);
  const fee = td.mul(addrs.length + 1).mul(await w3.getGasPrice());

  return new BigNumber(fee.toString());
}
