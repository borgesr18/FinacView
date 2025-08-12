import { env } from "../utils/env"

async function main() {
  console.log("Cron: send payment reminders (3 days and 1 day before due). Environment billing due day:", env.billingDueDay)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
