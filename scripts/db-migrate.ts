import { env } from "./utils/env"
import { Client } from "pg"
import fs from "node:fs"
import path from "node:path"

async function main() {
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is not set. Skipping migration.")
    process.exit(1)
  }
  const client = new Client({ connectionString: env.databaseUrl })
  await client.connect()
  const migrationsDir = path.join(process.cwd(), "db", "migrations")
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort()
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8")
    console.log(`Applying migration: ${file}`)
    await client.query(sql)
  }
  await client.end()
  console.log("Migrations applied successfully.")
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
