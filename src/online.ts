import type { DB, Type, AdvancedItem } from '../type.d.ts'

interface Node {
  code: string
  name: string
  level: number
  type: Type
  children?: Node[]
}

const parse = (db: DB, nodes: Node[], year: number) => {
  for (const node of nodes) {
    const code = node.code.substring(0, 6)
    db[code] ??= [] as AdvancedItem[]
    const item = db[code].find(i => i.name === node.name)
    if (!item) {
      db[code].push({
        name: node.name,
        type: node.type,
        level: node.level,
        year: { start: Number(year) },
      } satisfies AdvancedItem)
    } else {
      item.year.start = Math.min(
        year,
        item.year.start ?? Number.MAX_SAFE_INTEGER,
      )
      item.year.end = Math.max(year, item.year.end ?? 0)
    }

    if (node.children && node.children?.length) parse(db, node.children, year)
  }
}

export const getOnline = async (db: DB, end: number) => {
  const start = 2024

  for (let i = start; i < end; i++) {
    const url = `https://dmfw.mca.gov.cn/9095/xzqh/getList?year=${i}&maxLevel=3`
    const res = await fetch(url)
    const data = await res.json()
    const root = data.data as Node

    if (!data.data) {
      console.error(data)

      throw new Error(`No data for year ${i}`)
    }

    if (root.children?.length) parse(db, root.children, i)
  }

  return db
}
