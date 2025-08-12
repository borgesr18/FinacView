import { env } from "../utils/env"

async function main() {
  const dueDay = env.billingDueDay || 5
  console.log(`Cron: generate invoices for next period with due day ${dueDay}`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
