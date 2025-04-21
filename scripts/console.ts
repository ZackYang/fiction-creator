import repl from "node:repl";
import { db } from "../lib/db/mongo";

async function main() {
  const state = {
    Project: await db.projects(),
    Doc: await db.docs(),
    Task: await db.tasks(),
  };

  Object.assign(repl.start({ prompt: "nextcommerce> " }).context, state);
}

main().catch(console.error);