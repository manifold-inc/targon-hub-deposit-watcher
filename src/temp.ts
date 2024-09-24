import { db } from "./setup";

const rows = await db.execute("SELECT id, credits FROM user");
console.log(rows.rows[0])
