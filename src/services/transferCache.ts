import { BigNumber } from "bignumber.js";
import { PopulatedTransaction, providers } from "ethers";
import { Minter__factory } from "xpnet-web3-contracts";
import { Nft } from "../models/Nft";
import { CacheExpiry } from "./cache";
import { estimateGas } from "./unfreezeCache";

export interface IEstimateCacheService {
  get(nft: Nft, to: string): Promise<BigNumber>;
}

export const EVM_VALIDATORS = [
  "0xadFF46B0064a490c1258506d91e4325A277B22aE",
  "0xa50d8208B15F5e79A1ceABdB4a3ED1866CEB764c",
  "0xa3F99eF33eDA9E54DbA4c04a6133c0c507bA4352",
];

export function transferGasLimitCacheService(
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
      const fee = await estimateValidateTransferNft(to, nft, web3Helper);
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

export async function estimateValidateTransferNft(
  to: string,
  nft: Nft,
  provider: providers.Provider
) {
  const minter = Minter__factory.connect(
    "0x5B916EFb0e7bc0d8DdBf2d6A9A7850FdAb1984C4",
    provider
  );
  const utx = await minter.populateTransaction.validateTransferNft(
    randomAction().toString(),
    to,
    nft.uri
  );
  return await estimateGas(EVM_VALIDATORS, utx, provider);
}