import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '谢氏族譜 | Xie Family Genealogy',
  description: '谢氏世系圖 — Xie Clan Family Tree',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  )
}
