# GB-T_2260

县及县以上行政区划代码（GB/T 2260）。

数据来自[中国·国家地名信息库](https://dmfw.mca.gov.cn/)（National Database for Geographical Names of China）按年份导出的行政区划列表，覆盖 1980 年至 2025 年共 46 个年份，汇总为 488 条行政区划代码，并按代码记录其名称、类型、级别与存续年份。

- `data/`：原始年份数据，每年一个 `YYYY.json`（保留接口返回的树形结构）
- `db.json`：由 `data/` 构建的扁平化数据库，按 12 位代码索引
- `type.d.ts`：`db.json` 的 TypeScript 类型声明

## 安装

```sh
npm install gb-t_2260
# 或
pnpm add gb-t_2260
```

## 数据结构

`db.json` 的类型为 `Record<Code, Item[]>`：键为 12 位行政区划代码，值为该代码在历史中出现过的所有状态，按年份先后排列。

```jsonc
{
  // 省级：北京市
  "110000000000": [{ "name": "北京市", "type": "直辖市", "level": 1, "year": { "start": 1980 } }],
  // 县级：东城区
  "110101000000": [{ "name": "东城区", "type": "市辖区", "level": 3, "year": { "start": 1980 } }],
  // 2012 年新设立的地级市
  "460300000000": [{ "name": "三沙市", "type": "地级市", "level": 2, "year": { "start": 2012 } }],
  // 已撤销的代码：end 为最后存在的年份
  "500105000000": [{ "name": "江北区", "type": "市辖区", "level": 3, "year": { "start": 1980, "end": 2024 } }]
}
```

| 字段 | 说明 |
| --- | --- |
| `name` | 行政区划名称 |
| `type` | 行政区划类型，见下方 `Type` |
| `level` | 行政区划级别：`0` 根节点、`1` 省级、`2` 地级、`3` 县级 |
| `year.start` | 该状态的起始年份 |
| `year.end` | 该状态的结束年份；**省略表示截至数据最新年份仍然有效** |

```ts
/** 行政区划类型 */
type Type =
  | '地级市' | '地区' | '林区' | '盟'
  | '省' | '市辖区' | '特别行政区'
  | '县' | '县级市' | '直辖市'
  | '自治区' | '自治县' | '自治州'

interface Item {
  /** 行政区划名称 */
  name: string
  /** 行政区划类型 */
  type: Type
  /** 行政区划级别 */
  level: number
  /** 行政区划年份范围 */
  year: {
    /** 行政区划年份开始 */
    start: number
    /** 行政区划年份结束 为空则表示至今 */
    end?: number
  }
}

/** 12位行政区划代码 */
type Code = string

declare const db: Record<Code, Item[]>
export type { Type, Item, Code }
export default db
```

> 源数据中的特殊项：根节点代码为 `00`（`name`、`type` 均为空字符串，`level` 为 `0`）；台湾省的代码在源数据中为 `资料暂缺` 而非数字代码。使用时请按需过滤。

## 使用示例

### CommonJS

```js
const db = require('gb-t_2260')

// 查询某个代码的历史
console.log(db['110000000000'])
// [ { name: '北京市', type: '直辖市', level: 1, year: { start: 1980 } } ]

// 遍历所有县级行政区
const counties = Object.entries(db)
  .filter(([, items]) => items[0].level === 3)
  .map(([code, [item]]) => ({ code, name: item.name }))
```

### ES Modules / TypeScript

```ts
import db, { type Item } from 'gb-t_2260'

/** 判断代码在指定年份是否有效 */
function isValid(code: string, year: number): boolean {
  return db[code]?.some((item: Item) => {
    const end = item.year.end ?? Infinity
    return item.year.start <= year && year <= end
  }) ?? false
}

// 三沙市于 2012 年设立
isValid('460300000000', 2011) // false
isValid('460300000000', 2012) // true
```

也可以直接引入原始 JSON（需要 `resolveJsonModule`，部分打包工具需额外配置）：

```ts
import db from 'gb-t_2260/db.json'
```

## 数据来源

| 项目 | 值 |
| --- | --- |
| 数据源 | [中国·国家地名信息库 · 行政区划](https://dmfw.mca.gov.cn/9095/xzqh/getList?year=2025) |
| 覆盖年份 | 1980 – 2025（46 个年份，无缺失） |
| 原始格式 | 每年一个 JSON，`data` 字段为树形节点（`code` / `name` / `level` / `type` / `children`） |
| 当前条目 | 488 条代码（`level` 0–3，含 34 个省级单位） |
| 规范 | [GB/T 2260](https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296) |

`db.json` 的生成规则（见 [Build-McaAdminDivisionDatabase.ps1](./scripts/Build-McaAdminDivisionDatabase.ps1)）：

1. 按年份升序读取 `data/*.json`，递归遍历 `data` 的所有节点；
2. 同一 `code` 的 `name` / `type` / `level` 在连续年份保持不变时合并为一条记录；
3. 属性变化或年份中断时，上一条记录补上 `year.end = 上一年`，并开启新记录；
4. 延续到最新年份的记录省略 `year.end`。

重新构建数据库（需要 PowerShell 7+）：

```powershell
pwsh ./scripts/Build-McaAdminDivisionDatabase.ps1 -InputPath ./data -OutputPath ./db.json
```

重新抓取数据（见 [Get-McaAdminDivisionCodes.ps1](./scripts/Get-McaAdminDivisionCodes.ps1)，需可访问中国·国家地名信息库）：

```powershell
pwsh ./scripts/Get-McaAdminDivisionCodes.ps1 -StartYear 1980 -EndYear 2025 -OutputPath ./data
```

## 许可证

- 代码：MIT，见 [LICENSE](./LICENSE)
- 数据：CC BY 4.0，见 [LICENSE.data](./LICENSE.data)