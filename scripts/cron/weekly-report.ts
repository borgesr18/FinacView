async function main() {
  console.log("Cron: weekly consolidated report (revenue, actives, renewals, no-show)")
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
