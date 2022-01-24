import { BigNumber } from 'ethers';
import { Nft } from '../models/Nft';

export interface IGasPriceCacheService {
    get(): Promise<BigNumber>;

    hit(): boolean;
}
export interface IEstimateCacheService {
    get(nft: Nft, to: string): Promise<BigNumber>;
}

export interface CacheExpiry {
    getCacheExpiry(): number;
}

export const randomAction = () =>
    BigNumber.from(
        Math.floor(Math.random() * 999 + (Number.MAX_SAFE_INTEGER - 1000))
    );
