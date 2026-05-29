export function groupByCategory<T extends { category?: string | null }>(items: T[]): T[] {
  const order: string[] = []
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const cat = item.category ?? ''
    if (!groups.has(cat)) {
      order.push(cat)
      groups.set(cat, [])
    }
    groups.get(cat)!.push(item)
  }
  return order.flatMap(cat => groups.get(cat)!)
}
