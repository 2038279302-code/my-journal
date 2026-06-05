'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: '📔', label: '想法记录' },
  { href: '/daily-brief', icon: '📰', label: 'AI 日报' },
  { href: '/reflection', icon: '🗂️', label: '反思复盘' },
  { href: '/search', icon: '🔍', label: '搜索' },
]

interface SidebarProps {
  userEmail: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  // 用 state 来追踪是否是移动端（客户端渲染后才有效）
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // 路由变化时关闭抽屉
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ fontSize: '28px', marginBottom: '4px' }}>📔</div>
        <div style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1.3rem',
          color: 'var(--ink-dark)',
          fontWeight: 600,
        }}>
          我的手账
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--ink-muted)',
          marginTop: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {userEmail}
        </div>
      </div>

      {/* 导航 */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '4px',
                background: isActive ? 'var(--paper-card)' : 'transparent',
                border: isActive ? '1px solid var(--border-soft)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-warm)' : 'none',
                color: isActive ? 'var(--ink-dark)' : 'var(--ink-muted)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
                className={cn(!isActive && 'hover:bg-[var(--paper-card)]')}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span style={{
                    marginLeft: 'auto',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-coral)',
                  }} />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* 底部退出 */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-soft)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--border-soft)',
            background: 'transparent',
            color: 'var(--ink-muted)',
            fontSize: '13px',
            fontFamily: 'var(--font-serif)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--accent-coral)'
            ;(e.target as HTMLButtonElement).style.borderColor = 'var(--accent-coral)'
          }}
          onMouseOut={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--ink-muted)'
            ;(e.target as HTMLButtonElement).style.borderColor = 'var(--border-soft)'
          }}
        >
          退出登录
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ===== 桌面端侧边栏（> 768px 显示）===== */}
      {!isMobile && (
        <aside style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '220px',
          height: '100vh',
          background: 'var(--paper-warm)',
          borderRight: '1px solid var(--border-soft)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          zIndex: 50,
        }}>
          {navContent}
        </aside>
      )}

      {/* ===== 移动端顶部栏（≤ 768px 显示）===== */}
      {isMobile && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--paper-warm)',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>📔</span>
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--ink-dark)', fontWeight: 600 }}>
              我的手账
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{
              background: 'none',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--ink-muted)',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="菜单"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </header>
      )}

      {/* ===== 移动端抽屉菜单 ===== */}
      {isMobile && mobileOpen && (
        <>
          {/* 遮罩 */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(45, 36, 24, 0.4)',
              zIndex: 110,
            }}
          />
          {/* 抽屉 */}
          <aside style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '260px',
            height: '100vh',
            background: 'var(--paper-warm)',
            borderRight: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 0',
            zIndex: 120,
            boxShadow: '4px 0 24px rgba(74, 55, 40, 0.15)',
          }}>
            {navContent}
          </aside>
        </>
      )}
    </>
  )
}
