import { InsightDatum } from '@/types/insights'
import { titleize } from '@/components/charts/chartTokens'

export function countData(items: InsightDatum[]) {
  return items.map((item) => ({
    key: item.key,
    label: titleize(item.label),
    value: item.value,
  }))
}
