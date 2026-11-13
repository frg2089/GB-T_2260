import * as fs from 'node:fs'

import type { DB } from '../type.d.ts'
import { getHistory } from './history.ts'
import { getOnline } from './online.ts'

const end = new Date().getFullYear()

const db: DB = {}

await getHistory(db)
await getOnline(db, end)

await fs.promises.writeFile('db.json', JSON.stringify(db), 'utf-8')
