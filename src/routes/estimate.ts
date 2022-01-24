import BigNumber from "bignumber.js";
import { Request, Router } from "express";
import {
  ChainFactory,
  EthNftInfo,
  NftInfo,
  Web3Helper,
  Web3Params,
} from "xp.network";
import { gasLimitCacheService } from "../services/cache";

import { gasPriceCache } from "../services/gasCache";

export function estimateRouter(factory: ChainFactory): Router {
  const router = Router();

  router.post(
    "/estimate/web3/:from/:to",
    async (
      req: Request<{ from: string; to: string }, {}, EstimateReq>,
      res
    ) => {
      try {
        const { from, to } = req.params;
        const { nft, receiver } = req.body;

        const fC = await factory.inner<Web3Helper, Web3Params>(parseInt(to));
        const gasPriceSvc = gasPriceCache(fC.getProvider());
        const gasPrice = await gasPriceSvc.get();
        const gasLimitSvc = gasLimitCacheService(3.6e6, fC);
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
  nft: NftInfo<string>;
  receiver: string;
  sender: string;
}
