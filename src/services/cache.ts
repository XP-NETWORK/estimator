import { BigNumber } from 'ethers';
import { Nft } from '../models/Nft';

export const EVM_VALIDATORS = [
    '0xadFF46B0064a490c1258506d91e4325A277B22aE',
    '0xa50d8208B15F5e79A1ceABdB4a3ED1866CEB764c',
    '0xa3F99eF33eDA9E54DbA4c04a6133c0c507bA4352',
];

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
