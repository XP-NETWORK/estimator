import BigNumber from "bignumber.js";
import { providers } from "ethers";
import { Request, Router } from "express";
import { MainNetRpcUri } from "xp.network/dist/consts";
import { Nft } from "../models/Nft";

import { transferGasLimitCacheService } from "../services/transferCache";

import { gasPriceCache } from "../services/gasCache";
import { unfreezeGasLimitCacheService } from "../services/unfreezeCache";

export interface Providers {
  [key: number]: providers.Provider;
}

const provider: Providers = {
  4: new providers.JsonRpcProvider(MainNetRpcUri.BSC),
  5: new providers.JsonRpcProvider(MainNetRpcUri.ETHEREUM),
  6: new providers.JsonRpcProvider(MainNetRpcUri.AVALANCHE),
  7: new providers.JsonRpcProvider(MainNetRpcUri.POLYGON),
  8: new providers.JsonRpcProvider(MainNetRpcUri.FANTOM),
};

export function estimateRouter(): Router {
  const router = Router();

  router.post(
    "/estimate/transfer/:from/:to",
    async (
      req: Request<{ from: string; to: string }, {}, EstimateReq>,
      res
    ) => {
      try {
        const { from, to } = req.params;
        const { nft, receiver } = req.body;
        const toInt = parseInt(to);
        const gasPriceSvc = gasPriceCache(provider[toInt]);
        const gasPrice = await gasPriceSvc.get();
        const gasLimitSvc = transferGasLimitCacheService(
          3.6e6,
          provider[toInt]
        );
        const gasFees = await gasLimitSvc.get(nft, receiver);

        return res.status(200).json({
          fee: gasFees
            .multipliedBy(new BigNumber(gasPrice.toString()))
            .toString(10),
        });
      } catch (error) {
        return res.status(500).json({ error: (error as any).toString() });
      }
    }
  );

  router.post(
    "/estimate/unfreeze/:from/:to",
    async (
      req: Request<{ from: string; to: string }, {}, EstimateReq>,
      res
    ) => {
      try {
        const { from, to } = req.params;
        const { nft, receiver } = req.body;
        const provider = new providers.JsonRpcProvider("");
        const gasPriceSvc = gasPriceCache(provider);
        const gasPrice = await gasPriceSvc.get();
        const gasLimitSvc = unfreezeGasLimitCacheService(3.6e6, provider);
        const gasFees = await gasLimitSvc.get(nft, receiver);

        return res.status(200).json({
          fee: gasFees
            .multipliedBy(new BigNumber(gasPrice.toString()))
            .toString(10),
        });
      } catch (error) {
        return res.status(500).json({ error: (error as any).toString() });
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
