/**
 * HONEST colour guard: fails (exit 1) when a hex colour literal appears in any
 * git-tracked source file other than brand.config.ts, so every colour on the
 * site stays editable from that one file (AGENTS.md § Colors already bans
 * hex/rgb/hsl; this makes the ban mechanical).
 *
 * Scanned: .ts .tsx .js .mjs .css files. Not scanned: brand.config.ts (the
 * documented hex comments live there), *.test.ts(x) and *.e2e.ts(x) files,
 * Markdown, SVG/raster assets, lockfiles and this script.
 *
 * Comments are skipped (a hex in a comment never reaches the page, and GitHub
 * issue references like `#393` would otherwise match). A hex-looking string in
 * code that is not a colour (for example an anchor id) can stay if its line
 * ends with the comment `hex-ok`. The cost: the escape hatch is per line, so
 * reviewers must check each use.
 */

const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.css']
const EXEMPT_FILES = new Set([
  'brand.config.ts',
  'lib/scripts/check-colors.ts',
  'lib/scripts/check-colors.test.ts',
])
const EXEMPT_PREFIXES = ['node_modules/', '.next/', 'public/']

// A # followed by exactly 3, 4, 6 or 8 hex digits, not preceded by a word
// character, #, & or / (skips `a#b`, `##`, `&#123;`, URL fragments `/#abc`),
// and not followed by more word characters (skips `#facade-section`).
const HEX_COLOR =
  /(?<![\w#&/])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/giu

interface HexFinding {
  line: number
  match: string
}

/**
 * Blanks out `//` line comments and `/* *\/` block comments, keeping every
 * newline so line numbers survive. String literals (' " `) are respected, so
 * `https://` inside a string is not mistaken for a comment.
 */
export function stripComments(source: string): string {
  let out = ''
  let quote: string | null = null
  let index = 0
  while (index < source.length) {
    const char = source[index] ?? ''
    const next = source[index + 1] ?? ''
    if (quote) {
      out += char
      if (char === '\\') {
        out += next
        index += 2
        continue
      }
      if (char === quote) quote = null
      index += 1
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      out += char
      index += 1
      continue
    }
    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1
      continue
    }
    if (char === '/' && next === '*') {
      index += 2
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        if (source[index] === '\n') out += '\n'
        index += 1
      }
      index += 2
      continue
    }
    out += char
    index += 1
  }
  return out
}

export function findHexColors(source: string): HexFinding[] {
  const findings: HexFinding[] = []
  const rawLines = source.split('\n')
  const lines = stripComments(source).split('\n')
  for (const [index, text] of lines.entries()) {
    if ((rawLines[index] ?? '').trimEnd().endsWith('hex-ok')) continue
    for (const found of text.matchAll(HEX_COLOR)) {
      findings.push({ line: index + 1, match: found[0] })
    }
  }
  return findings
}

export function isScanned(path: string): boolean {
  if (EXEMPT_FILES.has(path)) return false
  // Tests never ship, and their names often cite issues like `(#160)`.
  if (/\.(test|e2e)\.tsx?$/u.test(path)) return false
  if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) return false
  return SCANNED_EXTENSIONS.some((extension) => path.endsWith(extension))
}

async function main() {
  const listed = Bun.spawnSync(['git', 'ls-files', '-co', '--exclude-standard'])
  const paths = listed.stdout.toString().split('\n').filter(isScanned)

  const failures: string[] = []
  for (const path of paths) {
    const file = Bun.file(path)
    if (!(await file.exists())) continue
    for (const finding of findHexColors(await file.text())) {
      failures.push(`  ${path}:${finding.line}  ${finding.match}`)
    }
  }

  if (failures.length > 0) {
    console.error(
      'check:colors: hex colour literals found outside brand.config.ts\n'
    )
    console.error(failures.join('\n'))
    console.error(
      '\nDefine the colour in brand.config.ts (as oklch) and use its CSS variable, Tailwind class or `brand.palette` import instead.'
    )
    process.exit(1)
  }

  console.log(`check:colors: ${paths.length} files scanned, no hex colours`)
}

if (import.meta.main) {
  await main()
}
