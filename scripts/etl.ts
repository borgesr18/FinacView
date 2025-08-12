import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const isDry = args.includes("--dry")
const isCommit = args.includes("--commit")
const fileIdx = args.findIndex(a => a === "--file")
const file = fileIdx >= 0 ? args[fileIdx + 1] : undefined

if (!isDry && !isCommit) {
  console.error("Use --dry or --commit")
  process.exit(1)
}
if (!file) {
  console.error("Use --file <path>")
  process.exit(1)
}

const reportDir = path.join("scripts", "reports")
fs.mkdirSync(reportDir, { recursive: true })
const ts = Date.now()
const reportPath = path.join(reportDir, `etl-${ts}.json`)
fs.writeFileSync(reportPath, JSON.stringify({ mode: isDry ? "dry" : "commit", file }, null, 2))
console.log(`ETL ${isDry ? "dry-run" : "commit"} initialized. Report: ${reportPath}`)
