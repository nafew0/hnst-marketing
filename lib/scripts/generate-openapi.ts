/**
 * Writes lib/contracts/openapi.json from the Zod contracts. With --check it
 * fails (exit 1) when the committed file is stale, so CI catches a contract
 * change that skipped regeneration.
 */
import { buildOpenApiDocument } from '@/lib/contracts/openapi'

const OUTPUT = 'lib/contracts/openapi.json'

const document = buildOpenApiDocument()

if (process.argv.includes('--check')) {
  // Compares content, not text: oxfmt reformats the committed JSON.
  const file = Bun.file(OUTPUT)
  const current = (await file.exists()) ? await file.text() : '{}'
  if (JSON.stringify(JSON.parse(current)) !== JSON.stringify(document)) {
    console.error(
      `${OUTPUT} is stale. Run \`bun run contracts:openapi\` and commit it.`
    )
    process.exit(1)
  }
  console.log(`${OUTPUT} is up to date.`)
} else {
  await Bun.write(OUTPUT, `${JSON.stringify(document, null, 2)}\n`)
  console.log(`Wrote ${OUTPUT}`)
}
