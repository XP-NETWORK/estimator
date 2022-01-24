import { ChainFactory } from "xp.network";

export interface IEstimateService {
  getEstimate(
    from: number,
    to: number,
    nft: any,
    receiver: string
  ): Promise<{ estimate: bigint }>;
}

export default function estimateService(
  factory: ChainFactory
): IEstimateService {
  return {
    getEstimate: async (
      from: number,
      to: number,
      nft: any,
      receiver: string
    ) => {
      const fromChain = await factory.inner(from);
      const toChain = await factory.inner(to);
      const estimate = await factory.estimateFees(
        //@ts-ignore
        fromChain,
        toChain,
        nft,
        receiver
      );
      return { estimate: BigInt(estimate.toString()) };
    },
  };
}
