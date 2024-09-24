import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    BITTENSOR_NODE_URL: z.string(),
    DATABASE_HOST: z.string(),
    DATABASE_USERNAME: z.string(),
    DATABASE_PASSWORD: z.string(),
    DEPOSIT_ADDRESS: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
