export type InlineNode = { text: string, bold?: boolean, italic?: boolean }

export type MarkdownBlock
  = | { type: 'paragraph', inline: InlineNode[] }
    | { type: 'list', ordered: boolean, items: InlineNode[][] }
    | { type: 'table', header: InlineNode[][], rows: InlineNode[][][] }

const INLINE = /\*\*(.+?)\*\*|\*(\S(?:.*?\S)?)\*/g
const BULLET = /^- (.*)$/
const ORDERED = /^\d+\. (.*)$/
const TABLE_ROW = /^\|.*\|$/
const TABLE_SEPARATOR = /^\|(?:\s*:?-{3,}:?\s*\|)+$/

// Pas de HTML ni de lien : le rendu ne produit que des nœuds de texte, donc rien à assainir.
export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let last = 0
  for (const match of source.matchAll(INLINE)) {
    if (match.index > last) nodes.push({ text: source.slice(last, match.index) })
    nodes.push(match[1] !== undefined ? { text: match[1], bold: true } : { text: match[2]!, italic: true })
    last = match.index + match[0].length
  }
  if (last < source.length) nodes.push({ text: source.slice(last) })
  return nodes
}

// Un tableau n'existe qu'avec sa ligne de séparation (`| --- | --- |`) : une ligne qui commence par une barre dans un
// texte plus ancien reste un paragraphe.
const startsTable = (lines: string[], i: number) => TABLE_ROW.test(lines[i]!.trim()) && TABLE_SEPARATOR.test((lines[i + 1] ?? '').trim())
const tableCells = (line: string) => line.trim().slice(1, -1).split('|').map(cell => parseInline(cell.trim()))

// Des lignes consécutives de même nature forment un bloc, même sans ligne vide : les textes écrits avant ce format
// (retours à la ligne simples, puces « - ») s'affichent comme avant.
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = source.split('\n').map(line => line.trimEnd())
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim()) {
      i++
      continue
    }

    if (startsTable(lines, i)) {
      const header = tableCells(line)
      const rows: InlineNode[][][] = []
      i += 2
      while (i < lines.length && TABLE_ROW.test(lines[i]!.trim())) rows.push(tableCells(lines[i++]!))
      blocks.push({ type: 'table', header, rows })
      continue
    }

    const kind = [BULLET, ORDERED].find(re => re.test(line))
    const group: string[] = []
    while (i < lines.length && lines[i]!.trim() && !startsTable(lines, i) && (kind ? kind.test(lines[i]!) : ![BULLET, ORDERED].some(re => re.test(lines[i]!)))) {
      group.push(lines[i]!)
      i++
    }

    if (kind === BULLET || kind === ORDERED) {
      blocks.push({ type: 'list', ordered: kind === ORDERED, items: group.map(l => parseInline(l.replace(kind === BULLET ? /^- / : /^\d+\. /, ''))) })
      continue
    }
    blocks.push({ type: 'paragraph', inline: group.flatMap((l, n) => [...(n ? [{ text: '\n' }] : []), ...parseInline(l)]) })
  }
  return blocks
}
