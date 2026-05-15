export function createDataAssetTitle(title: string) {
  const compactTitle = title
    .trim()
    .replace(/^查询\s+/, "")
    .replace(/^查看\s+/, "")
    .replace(/^统计\s+/, "")
    .replace(/^分析\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*的\s*(明细数据|明细表|数据明细|结果明细|查询结果|分析结果)$/, "")
    .replace(/\s*(明细数据|明细表|数据明细|结果明细|查询结果|分析结果)$/, "")
    .replace(/[，。,.\s]+$/, "")
    .trim()

  return compactTitle || title.trim()
}
