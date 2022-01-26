import { BigNumber, providers } from 'ethers';
import { Minter__factory } from 'xpnet-web3-contracts';
import { Nft } from '../models/Nft';
import { estimateGas } from '../routes/estimate';
import { CacheExpiry, IEstimateCacheService, randomAction } from './cache';
import { EVM_VALIDATORS } from './cache';

export function unfreezeGasLimitCacheService(
    cacheExpiry: number = 3.6e6,
    web3Helper: providers.Provider,
    minterAddress: string
): IEstimateCacheService & CacheExpiry {
    let _cache_ms = Date.now();
    let gasPriceCache: Map<string, BigNumber> | undefined = undefined;

    async function getCache(
        to: string,
        nft: Nft
    ): Promise<Map<string, BigNumber>> {
        const fetchCache = async () => {
            const fee = await estimateValidateUnfreezeNft(
                to,
                nft,
                web3Helper,
                minterAddress
            );

            gasPriceCache = new Map().set(nft.uri, fee);
            _cache_ms = Date.now();
        };
        if (gasPriceCache === undefined) {
            await fetchCache();
        } else if (getCacheExpiry() == 0) {
            const old_cache = new Map(gasPriceCache);
            await fetchCache().catch(e => {
                console.warn(
                    `failed to fetch exchange rate: ${e}, using old data!`
                );
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

export async function estimateValidateUnfreezeNft(
    to: string,
    nft: Nft,
    provider: providers.Provider,
    minterAddress: string
) {
    const minter = Minter__factory.connect(minterAddress, provider);
    const utx = await minter.populateTransaction.validateUnfreezeNft(
        randomAction().toString(),
        to,
        nft.uri,
        nft.wrapperContract!
    );
    return await estimateGas(EVM_VALIDATORS, utx, provider);
}
