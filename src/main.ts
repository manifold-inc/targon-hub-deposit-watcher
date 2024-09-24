import { type EventRecord } from "@polkadot/types/interfaces";

import { env } from "./env";
import { bt } from "./setup";
import { log } from "./utils";

export const getEventsFromBlock = async (hash: string) => {
  let events: EventRecord[];
  try {
    const apiAt = await bt.api.at(hash);
    events = (await apiAt.query["system"][
      "events"
    ]()) as unknown as EventRecord[];
  } catch {
    log.error("Failed to get block", false);
    return null;
  }
  return events
    .filter(({ event }) => event.method === "Transfer")
    .map((e: EventRecord) => e.event);
};

const getBalance = async (coldkey: string) => {
  return Number(
    (
      (await bt.api.query["system"]["account"](coldkey)) as unknown as {
        data: { free: string };
      }
    ).data.free,
  );
};

const main = async () => {
  process.on("SIGINT", function() {
    log.info("Gracefully quitting");
    process.exit();
  });
  process.on("SIGTERM", function() {
    log.info("Gracefully quitting");
    process.exit();
  });
  const COLDKEYS = env.COLDKEYS.split(",").map((k) => k.trim());
  const WARNING_TRANSFER_THRESHOLD = parseInt(
    env.WARNING_TRANSFER_THRESHOLD ?? "0",
  );
  const WARNING_BALANCE_THRESHOLD = parseInt(
    env.WARNING_BALANCE_THRESHOLD ?? "0",
  );
  if (isNaN(WARNING_BALANCE_THRESHOLD)) {
    throw new Error(`Invalid ENV variables ${WARNING_BALANCE_THRESHOLD}`);
  }
  if (isNaN(WARNING_TRANSFER_THRESHOLD)) {
    throw new Error(`Invalid ENV variables ${WARNING_TRANSFER_THRESHOLD}`);
  }

  const WARNING_ONLY = env.WARNING_ONLY?.toLowerCase() === "true" ?? false;
  log.info("Starting up with config:");
  log.info(
    JSON.stringify(
      {
        COLDKEYS,
        WARNING_ONLY,
        WARNING_BALANCE_THRESHOLD,
        WARNING_TRANSFER_THRESHOLD,
      },
      null,
      2,
    ),
  );

  await bt.api.rpc.chain.subscribeFinalizedHeads(async (header) => {
    const currentChainBlockHash = header.hash.toString();
    log.info(`Processing ${currentChainBlockHash}`);
    const events = await getEventsFromBlock(currentChainBlockHash);
    if (!events) return;
    for (const e of events) {
      const [_from, _to, _rao] = e.data;
      const rao = Number(_rao);
      const tao = (rao / 1e9).toLocaleString();
      const from = _from.toString();
      const to = _to.toString();
      if (!COLDKEYS.includes(from.toString())) continue;

      if (WARNING_TRANSFER_THRESHOLD && rao >= WARNING_TRANSFER_THRESHOLD) {
        log.warn(`From\n\`${from}\`\nTo\n\`${to}\`\n${tao}t`);
      } else if (!WARNING_ONLY) {
        log.info(`From\n\`${from}\`\nTo\n\`${to}\`\n${tao}t`, true);
      }

      if (!WARNING_BALANCE_THRESHOLD) continue;
      const balance = await getBalance(from);
      if (balance <= WARNING_BALANCE_THRESHOLD) {
        log.warn(
          `Wallet \`${from}\` below threshold: ${(balance / 1e9).toLocaleString()}t`,
        );
      }
    }
  });
};

await main();
