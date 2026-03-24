import { pinyin } from 'pinyin-pro'

export function matchesSearch(text: string | null, query: string): boolean {
  if (!text || !query.trim()) return false
  const q = query.trim().toLowerCase()
  if (text.toLowerCase().includes(q)) return true
  const py = pinyin(text, { toneType: 'none', separator: '' }).toLowerCase()
  return py.includes(q)
}
