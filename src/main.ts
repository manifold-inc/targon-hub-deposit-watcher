import { type EventRecord } from "@polkadot/types/interfaces";

import { env } from "./env";
import { bt, db } from "./setup";
import { CREDIT_PER_DOLLAR, getTaoPrice, log } from "./utils";

export const getEventsFromBlock = async (hash: string) => {
  let events: EventRecord[];
  try {
    const apiAt = await bt.api.at(hash);
    events = (await apiAt.query["system"][
      "events"
    ]()) as unknown as EventRecord[];
  } catch {
    log.error("Failed to get block");
    return null;
  }
  return events
    .filter(({ event }) => event.method === "Transfer")
    .map((e: EventRecord) => e.event);
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
  const DEPOSIT_ADDRESS = env.DEPOSIT_ADDRESS;

  await bt.api.rpc.chain.subscribeFinalizedHeads(async (header) => {
    const currentChainBlockHash = header.hash.toString();
    log.info(`Processing ${currentChainBlockHash}`);
    const events = await getEventsFromBlock(currentChainBlockHash);
    if (!events) return;
    let price;
    for (const e of events) {
      const [_from, _to, _rao] = e.data;
      const rao = Number(_rao);
      const tao = (rao / 1e9).toLocaleString();
      const from = _from.toString();
      const to = _to.toString();
      if (to != DEPOSIT_ADDRESS) continue;
      log.info(`From ${from} To ${to} ${tao}t`);
      try {
        const { rows } = await db.execute(
          "SELECT id, credits FROM user WHERE ss58 = ?",
          [from.toString()],
        );
        if (!rows.length) {
          continue;
        }
        const { id, credits } = rows[0];
        if (!price) {
          price = await getTaoPrice();
        }
        if (!price) {
          await db.execute(
            `
          INSERT INTO tao_transfers (userId, rao, block_hash, tx_hash, success) 
                             VALUES (?,      ?,   ?,          ?,       ?)`,
            [id, rao, currentChainBlockHash, e.hash.toHex(), false],
          );
          continue;
        }
        const owedCredits = (rao / 1e9) * price * CREDIT_PER_DOLLAR;
        console.log(owedCredits)
        await db.transaction(async (tx) => {
          await tx.execute(
            `
          UPDATE user SET credits=?`,
            [credits + owedCredits],
          );
          await tx.execute(
            `
          INSERT INTO tao_transfers (userId, rao, block_hash, tx_hash, success, priced_at, credits) 
                             VALUES (?,      ?,   ?,          ?,       ?,       ?,         ?)`,
            [
              id,
              rao,
              currentChainBlockHash,
              e.hash.toHex(),
              true,
              owedCredits,
              credits,
            ],
          );
        });
      } catch (e) {
        log.error(`An unexpected error occured ${e}`);
      }
    }
  });
};

await main();
