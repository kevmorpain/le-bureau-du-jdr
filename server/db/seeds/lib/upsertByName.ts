export async function upsertByName<T extends { name: string }>(
  findFirst: (name: string) => Promise<unknown>,
  insert: (row: T) => Promise<unknown>,
  rows: T[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0
  for (const row of rows) {
    const existing = await findFirst(row.name)
    if (existing) { skipped++; continue }
    await insert(row)
    inserted++
  }
  return { inserted, skipped }
}
