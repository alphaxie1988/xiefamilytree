import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '許氏族譜 | Xu Family Genealogy',
  description: '許氏世系圖 — Xu Clan Family Tree',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  )
}
