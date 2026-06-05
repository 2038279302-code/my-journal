'use client'

import { useEffect, useState } from 'react'

export default function MainContent({ children }: { children: React.ReactNode }) {
  // 初始值设为 undefined，SSR 阶段不设任何内联偏移，靠 CSS class 来控制
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <main
      className="main-content"
      style={{
        flex: 1,
        minHeight: '100vh',
        background: 'var(--paper-bg)',
        overflowX: 'hidden',
        // 仅在客户端 hydration 完成后才用内联样式覆盖，避免 SSR/CSR 不一致闪烁
        ...(isMobile === undefined
          ? {}
          : isMobile
            ? { marginLeft: 0, paddingTop: '56px' }
            : { marginLeft: '220px', paddingTop: 0 }),
      }}
    >
      {children}
    </main>
  )
}
