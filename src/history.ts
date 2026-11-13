import * as fs from 'node:fs'
import * as path from 'node:path'

import { JSDOM } from 'jsdom'

import type { BasicItem, DB } from '../type.d.ts'

const baseDir = path.resolve(import.meta.dirname, 'html')

const parse = async (
  fileName: string,
): Promise<[number, Record<number, string>]> => {
  const year = Number(fileName.substring(0, 4))
  const fullPath = path.resolve(baseDir, fileName)
  const content = await fs.promises.readFile(fullPath, 'utf-8')
  const dom = new JSDOM(content)
  const document = dom.window.document

  const result = Object.fromEntries(
    [...document.querySelectorAll('tbody>tr')]
      .filter(i => i.children.length >= 2)
      .map<[number, string]>(dom => {
        const size = dom.children.length - 1
        for (let i = 0; i < size; i++) {
          const szCode = dom.children[i].textContent.trim()
          if (!szCode) continue
          if (szCode.length !== 6) break

          const code = Number(szCode)
          if (!Number.isNaN(code)) {
            return [code, dom.children[i + 1].textContent.trim()]
          }
        }

        return undefined as any
      })
      .filter(i => i),
  )

  if (result && Object.keys(result).length === 0) {
    throw new Error(`No valid entries found in file: ${fileName}`)
  }

  return [year, result]
}

export const getHistory = async (db: DB) => {
  const paths = await fs.promises.readdir(baseDir)
  const results = await Promise.all(paths.map(i => parse(i)))

  results.forEach(([year, items]) => {
    Object.entries(items).forEach(([code, name]) => {
      db[code] ??= []
      const item = db[code].find(i => i.name === name)
      if (!item) {
        db[code].push({
          name,
          year: [year],
        } satisfies BasicItem)
      } else {
        if (!item.year.includes(year)) {
          item.year.push(year)
        }
      }
    })
  })

  return db
}
