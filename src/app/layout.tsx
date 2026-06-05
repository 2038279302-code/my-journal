import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '我的手账 · My Journal',
  description: '记录想法、反思与每日 AI 动态的私人空间',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
