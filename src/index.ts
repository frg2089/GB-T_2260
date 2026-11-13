import * as fs from 'node:fs'

import { getHistory } from './history.ts'
import { getOnline } from './online.ts'
import type { DB } from '../type.d.ts'

const end = new Date().getFullYear() - 1

const db: DB = {}

await getHistory(db)
await getOnline(db, end)

Object.entries(db)
  .flatMap(([_, items]) => items.filter(i => i.year.end === end))
  .forEach(i => (i.year.end = undefined))

await fs.promises.writeFile('db.json', JSON.stringify(db), 'utf-8')
