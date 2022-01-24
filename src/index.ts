import express from "express";
import { ChainFactory, ChainFactoryConfigs } from "xp.network";
import { Config } from "xp.network/dist/consts";
import AppConfig from "./Config";

import { estimateRouter } from "./routes/estimate";

(async () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.status(200).json({ message: "ok" });
  });

  const estimate = estimateRouter(
    ChainFactory(Config, ChainFactoryConfigs.MainNet())
  );

  app.use("/", estimate);

  app.listen(AppConfig.port, () => {
    console.log(`Listening on port ${AppConfig.port}`);
  });
})();
