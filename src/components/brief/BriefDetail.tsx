'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DailyBrief } from '@/types'
import { formatFullDate } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface Props {
  brief: DailyBrief
}

type ViewMode = 'beautiful' | 'raw'

const SECTION_CONFIG = [
  { key: 'highlights', icon: '🔥', label: '最值得关注', color: 'var(--accent-coral)', bg: '#fef5f3' },
  { key: 'products', icon: '📦', label: '产品与技术动态', color: 'var(--accent-sky)', bg: '#f3f7fc' },
  { key: 'industry', icon: '📰', label: '行业与资本', color: 'var(--accent-sage)', bg: '#f3faf5' },
  { key: 'research', icon: '📚', label: '论文与研究', color: 'var(--accent-lavender)', bg: '#f7f4fc' },
  { key: 'opinions', icon: '💡', label: '今日观点', color: 'var(--accent-golden)', bg: '#fdf9ee' },
] as const

export default function BriefDetail({ brief }: Props) {
  const [mode, setMode] = useState<ViewMode>('beautiful')

  const sections = brief.sections || {}
  const actions: string[] = sections.actions || []

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--ink-muted)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📅 {formatFullDate(brief.date)}</span>
          <span>·</span>
          <span>AI 日报</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1.7rem',
          color: 'var(--ink-dark)',
          lineHeight: '1.4',
          marginBottom: '14px',
        }}>
          {brief.headline || `${brief.date} AI 日报`}
        </h1>

        {brief.overview && (
          <div style={{
            background: 'var(--paper-warm)',
            border: '1px solid var(--border-soft)',
            borderLeft: '4px solid var(--accent-coral)',
            borderRadius: '0 10px 10px 0',
            padding: '14px 18px',
            fontSize: '14px',
            lineHeight: '1.8',
            color: 'var(--ink-main)',
          }}>
            {brief.overview}
          </div>
        )}
      </div>

      {/* 视图切换 */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-soft)',
        paddingBottom: '14px',
      }}>
        {(['beautiful', 'raw'] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '5px 14px',
              borderRadius: '8px',
              border: mode === m ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-soft)',
              background: mode === m ? 'var(--paper-cream)' : 'transparent',
              color: mode === m ? 'var(--accent-coral)' : 'var(--ink-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              transition: 'all 0.15s',
            }}
          >
            {m === 'beautiful' ? '✨ 美观视图' : '📄 原文'}
          </button>
        ))}
      </div>

      {mode === 'beautiful' ? (
        <div>
          {/* 今日速记 */}
          {actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #fff8f0, #fff3eb)',
                border: '1px solid #f9c9be',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '24px',
              }}
            >
              <h2 style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.1rem',
                color: 'var(--accent-coral)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                🧭 今日 PM 速记
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {actions.map((action, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '6px 0',
                    borderBottom: i < actions.length - 1 ? '1px solid #fde8e3' : 'none',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'var(--ink-main)',
                  }}>
                    <span style={{ color: 'var(--accent-coral)', flexShrink: 0 }}>📌</span>
                    <span dangerouslySetInnerHTML={{ __html: action.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* 各章节 */}
          {SECTION_CONFIG.map(({ key, icon, label, color, bg }, si) => {
            const items = ((sections as unknown) as Record<string, unknown[]>)[key] || []
            if (items.length === 0) return null

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.06 }}
                style={{ marginBottom: '28px' }}
              >
                <h2 style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.2rem',
                  color,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {icon} {label}
                  <span style={{
                    fontSize: '11px',
                    background: bg,
                    border: `1px solid ${color}33`,
                    borderRadius: '10px',
                    padding: '1px 8px',
                    color,
                  }}>
                    {items.length}
                  </span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(items as Array<Record<string, string>>).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: bg,
                        border: `1px solid ${color}22`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: '0 10px 10px 0',
                        padding: '14px 16px',
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      {item.title && (
                        <h3 style={{
                          fontSize: '14px',
                          color: 'var(--ink-dark)',
                          fontWeight: 600,
                          marginBottom: '6px',
                          lineHeight: '1.5',
                          fontFamily: 'var(--font-serif)',
                        }}>
                          {item.title}
                        </h3>
                      )}
                      {item.date && (
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '6px' }}>
                          📅 {item.date}
                        </div>
                      )}
                      {item.content && (
                        <div style={{
                          fontSize: '13px',
                          lineHeight: '1.75',
                          color: 'var(--ink-main)',
                          fontFamily: 'var(--font-serif)',
                        }}>
                          <BriefItemContent content={item.content} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* 原文 Markdown */
        <div style={{
          background: 'var(--paper-card)',
          border: '1px solid var(--border-soft)',
          borderRadius: '12px',
          padding: '24px',
          fontSize: '14px',
          lineHeight: '1.85',
          fontFamily: 'var(--font-serif)',
          color: 'var(--ink-main)',
        }}>
          <div className="prose-journal">
            <ReactMarkdown>{brief.raw_markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

// 简单解析内联 Markdown（加粗、引用块）
function BriefItemContent({ content }: { content: string }) {
  const lines = content.split('\n').filter(l => l.trim())
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} style={{
              borderLeft: '3px solid var(--ink-faint)',
              marginLeft: 0,
              paddingLeft: '12px',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              fontSize: '12px',
              marginTop: '8px',
            }}>
              {line.slice(2).replace(/\*\*(.+?)\*\*/g, '')}
            </blockquote>
          )
        }
        return (
          <p key={i} style={{ margin: '4px 0' }}
            dangerouslySetInnerHTML={{
              __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            }}
          />
        )
      })}
    </>
  )
}
