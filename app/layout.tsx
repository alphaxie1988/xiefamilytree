import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '谢氏族譜 | Xie Family Genealogy',
  description: '谢氏世系圖 — Xie Clan Family Tree',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        {/* Blocking script — runs before paint to avoid theme flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.add(t==='light'?'theme-light':'theme-dark');}catch(e){document.documentElement.classList.add('theme-dark');}})()` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
