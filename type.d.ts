/** 行政区划类型 */
type Type = '地级市' | '地区' | '林区' | '盟' | '省' | '市辖区' | '特别行政区' | '县' | '县级市' | '直辖市' | '自治区' | '自治县' | '自治州'

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