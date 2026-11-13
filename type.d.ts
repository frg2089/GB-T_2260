/**
 * @description 行政区划类型
 */
type Type =
  | '地级市'
  | '地区'
  | '林区'
  | '盟'
  | '省'
  | '市辖区'
  | '特别行政区'
  | '县'
  | '县级市'
  | '直辖市'
  | '自治区'
  | '自治县'
  | '自治州'

interface BasicItem {
  /**
   * @description 行政区划名称
   */
  name: string
  /**
   * @description 行政区划年份范围
   */
  year: {
    /**
     * @description 行政区划年份开始
     */
    start: number
    /**
     * @description 行政区划年份结束 为空则表示至今
     */
    end?: number
  }
}

interface AdvancedItem extends BasicItem {
  /**
   * @description 行政区划类型
   */
  type: Type
  /**
   * @description 行政区划级别
   */
  level: number
}

type Item = BasicItem | AdvancedItem

/**
 * @description 6位行政区划代码
 */
type Code = string

type DB = Record<Code, Item[]>

declare const db: DB
export type { Type, Item, BasicItem, AdvancedItem, Code, DB }
export default db
