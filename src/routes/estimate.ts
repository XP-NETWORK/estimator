import { BigNumber, PopulatedTransaction, providers } from 'ethers';
import { Request, Router } from 'express';
import { MainNetRpcUri } from 'xp.network/dist/consts';
import { Nft } from '../models/Nft';

import { transferGasLimitCacheService } from '../services/transferCache';

import { unfreezeGasLimitCacheService } from '../services/unfreezeCache';
import {
    CacheExpiry,
    IEstimateCacheService,
    IGasPriceCacheService,
} from '../services/cache';
import '../services/gasPriceCache';
import { createGasPriceCache } from '../services/gasPriceCache';
export interface GasPriceCache {
    [key: number]: IEstimateCacheService;
}

const transferGasPriceCache: GasPriceCache = {
    4: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.BSC),
        '0xF8679A16858cB7d21b3aF6b2AA1d6818876D3741'
    ),
    5: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.ETHEREUM),
        '0x8B2957DbDC69E158aFceB9822A2ff9F2dd5BcD65'
    ),
    6: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.AVALANCHE),
        '0x5B916EFb0e7bc0d8DdBf2d6A9A7850FdAb1984C4'
    ),
    7: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.POLYGON),
        '0x2f072879411503580B8974A221bf76638C50a82a'
    ),
    8: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.FANTOM),
        '0x5B916EFb0e7bc0d8DdBf2d6A9A7850FdAb1984C4'
    ),
    11: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.CELO),
        '0xF8679A16858cB7d21b3aF6b2AA1d6818876D3741'
    ),
    20: transferGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.IOTEX),
        '0xd9dDB5d6c9D7d764B06E7C5aFF26AD316a4c227F'
    ),
};

const unfreezeGasPriceCache: GasPriceCache = {
    4: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.BSC),
        '0xF8679A16858cB7d21b3aF6b2AA1d6818876D3741'
    ),
    5: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.ETHEREUM),
        '0x8B2957DbDC69E158aFceB9822A2ff9F2dd5BcD65'
    ),
    6: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.AVALANCHE),
        '0x5B916EFb0e7bc0d8DdBf2d6A9A7850FdAb1984C4'
    ),
    7: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.POLYGON),
        '0x2f072879411503580B8974A221bf76638C50a82a'
    ),
    8: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.FANTOM),
        '0x5B916EFb0e7bc0d8DdBf2d6A9A7850FdAb1984C4'
    ),
    11: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.CELO),
        '0xF8679A16858cB7d21b3aF6b2AA1d6818876D3741'
    ),
    20: unfreezeGasLimitCacheService(
        3.6e6,
        new providers.JsonRpcProvider(MainNetRpcUri.IOTEX),
        '0xd9dDB5d6c9D7d764B06E7C5aFF26AD316a4c227F'
    ),
};

export interface GasLimitCache {
    [key: number]: IGasPriceCacheService & CacheExpiry;
}

const gasLimitCache: GasLimitCache = {
    4: createGasPriceCache(new providers.JsonRpcProvider(MainNetRpcUri.BSC)),
    5: createGasPriceCache(
        new providers.JsonRpcProvider(MainNetRpcUri.ETHEREUM)
    ),
    6: createGasPriceCache(
        new providers.JsonRpcProvider(MainNetRpcUri.AVALANCHE)
    ),
    7: createGasPriceCache(
        new providers.JsonRpcProvider(MainNetRpcUri.POLYGON)
    ),
    8: createGasPriceCache(new providers.JsonRpcProvider(MainNetRpcUri.FANTOM)),
    11: createGasPriceCache(new providers.JsonRpcProvider(MainNetRpcUri.CELO)),
    20: createGasPriceCache(new providers.JsonRpcProvider(MainNetRpcUri.IOTEX)),
};

export function estimateRouter(): Router {
    const router = Router();

    router.post(
        '/estimate/transfer/:from/:to',
        async (
            req: Request<{ from: string; to: string }, {}, EstimateReq>,
            res
        ) => {
            try {
                const { from, to } = req.params;
                const { nft, receiver } = req.body;
                const toInt = parseInt(to);
                const gasPriceSvc = transferGasPriceCache[toInt];
                const gasPrice = await gasPriceSvc.get(nft, receiver);
                const gasLimitCacheSvc = gasLimitCache[toInt];
                const gasFees = await gasLimitCacheSvc.get();

                return res.status(200).json({
                    fee: gasFees.mul(gasPrice).toString(),
                });
            } catch (error) {
                return res
                    .status(500)
                    .json({ error: (error as any).toString() });
            }
        }
    );

    router.post(
        '/estimate/unfreeze/:from/:to',
        async (
            req: Request<{ from: string; to: string }, {}, EstimateReq>,
            res
        ) => {
            try {
                const { from, to } = req.params;
                const { nft, receiver } = req.body;
                const toInt = parseInt(to);
                const gasPriceSvc = unfreezeGasPriceCache[toInt];
                const gasPrice = await gasPriceSvc.get(nft, receiver);
                const gasLimitCacheSvc = gasLimitCache[toInt];
                const gasFees = await gasLimitCacheSvc.get();
                return res.status(200).json({
                    fee: gasFees.mul(gasPrice).toString(),
                });
            } catch (error) {
                return res
                    .status(500)
                    .json({ error: (error as any).toString() });
            }
        }
    );

    return router;
}

export interface EstimateReq {
    nft: Nft;
    receiver: string;
    sender: string;
}

export async function estimateGas(
    addrs: string[],
    utx: PopulatedTransaction,
    w3: providers.Provider
): Promise<BigNumber> {
    utx.from = addrs[0];
    let td = await w3.estimateGas(utx);
    const fee = td.mul(addrs.length + 1);

    return fee;
}
