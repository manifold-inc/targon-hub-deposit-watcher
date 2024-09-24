import { ApiPromise, WsProvider } from "@polkadot/api";

import { env } from "./env.js";
import { Client } from "@planetscale/database";

const provider = new WsProvider(env.BITTENSOR_NODE_URL);

const api = new ApiPromise({ provider: provider });
await api.isReady;
export const db = new Client({
  host: env.DATABASE_HOST,
  username: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
})

export const bt = {
  api,
  provider,
};
