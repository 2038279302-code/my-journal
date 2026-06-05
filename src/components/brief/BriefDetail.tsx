'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DailyBrief } from '@/types'
import { formatFullDate } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

interface Props {
  brief: DailyBrief
}

type ViewMode = 'beautiful' | 'raw'

// 灵感浮层的来源上下文
interface InsightSource {
  sectionLabel: string
  itemTitle: string
}

// 今日回顾笔记结构
interface DailyReview {
  id: string
  content: string
  created_at: string
  updated_at: string
}

const SECTION_CONFIG = [
  { key: 'highlights', icon: '🔥', label: '最值得关注', color: 'var(--accent-coral)', bg: '#fef5f3' },
  { key: 'products', icon: '📦', label: '产品与技术动态', color: 'var(--accent-sky)', bg: '#f3f7fc' },
  { key: 'industry', icon: '📰', label: '行业与资本', color: 'var(--accent-sage)', bg: '#f3faf5' },
  { key: 'research', icon: '📚', label: '论文与研究', color: 'var(--accent-lavender)', bg: '#f7f4fc' },
  { key: 'opinions', icon: '💡', label: '今日观点', color: 'var(--accent-golden)', bg: '#fdf9ee' },
] as const

export default function BriefDetail({ brief }: Props) {
  const [mode, setMode] = useState<ViewMode>('beautiful')

  // P0-1: 灵感捕捉浮层
  const [insightSource, setInsightSource] = useState<InsightSource | null>(null)
  const [insightText, setInsightText] = useState('')
  const [insightSaving, setInsightSaving] = useState(false)
  const [insightToast, setInsightToast] = useState<string | null>(null)
  const insightTextareaRef = useRef<HTMLTextAreaElement>(null)

  // P0-2: 今日回顾
  const [review, setReview] = useState<DailyReview | null>(null)
  const [reviewLoading, setReviewLoading] = useState(true)
  const [reviewEditing, setReviewEditing] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewToast, setReviewToast] = useState<string | null>(null)

  const sections = brief.sections || {}
  const actions: string[] = sections.actions || []

  // 加载今日回顾（通过 content_contains 精确匹配 marker）
  useEffect(() => {
    const loadReview = async () => {
      setReviewLoading(true)
      try {
        const marker = `[brief:${brief.date}]`
        const res = await fetch(
          `/api/notes?type=reflection&content_contains=${encodeURIComponent(marker)}&limit=1`
        )
        const json = await res.json()
        if (json.data && json.data.length > 0) {
          const found: DailyReview = json.data[0]
          setReview(found)
          // 展示内容时去掉 marker 行
          setReviewText(found.content.replace(/\[brief:[^\]]+\]\n?/, '').trim())
        }
      } catch {
        // ignore
      } finally {
        setReviewLoading(false)
      }
    }
    loadReview()
  }, [brief.date])

  // 打开灵感浮层
  const openInsight = (source: InsightSource) => {
    setInsightSource(source)
    setInsightText('')
    setTimeout(() => insightTextareaRef.current?.focus(), 100)
  }

  // 保存灵感笔记
  const saveInsight = async () => {
    if (!insightText.trim() || insightSaving) return
    setInsightSaving(true)
    try {
      const contextPrefix = `💡 来自「${brief.date} AI日报 · ${insightSource?.sectionLabel}」\n> ${insightSource?.itemTitle}\n\n`
      const fullContent = contextPrefix + insightText.trim()

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fullContent,
          type: 'quick',
        }),
      })
      if (res.ok) {
        setInsightToast('💡 灵感已记录！')
        setInsightSource(null)
        setInsightText('')
      } else {
        setInsightToast('保存失败，请重试')
      }
    } catch {
      setInsightToast('保存失败，请重试')
    } finally {
      setInsightSaving(false)
      setTimeout(() => setInsightToast(null), 2500)
    }
  }

  // 保存今日回顾
  const saveReview = async () => {
    if (!reviewText.trim() || reviewSaving) return
    setReviewSaving(true)
    try {
      const marker = `[brief:${brief.date}]`
      const fullContent = `${marker}\n${reviewText.trim()}`

      let res: Response
      if (review) {
        // 更新已有回顾
        res = await fetch(`/api/notes/${review.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: fullContent }),
        })
      } else {
        // 新建回顾
        res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: fullContent,
            type: 'reflection',
          }),
        })
      }

      const json = await res.json()
      if (json.data) {
        setReview(json.data)
        setReviewEditing(false)
        setReviewToast('✅ 今日回顾已保存')
      } else {
        setReviewToast('保存失败，请重试')
      }
    } catch {
      setReviewToast('保存失败，请重试')
    } finally {
      setReviewSaving(false)
      setTimeout(() => setReviewToast(null), 2500)
    }
  }

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
                        position: 'relative',
                      }}
                      // 鼠标悬停时显示灵感按钮
                      onMouseEnter={e => {
                        const btn = (e.currentTarget as HTMLDivElement).querySelector('.insight-btn') as HTMLElement
                        if (btn) btn.style.opacity = '1'
                      }}
                      onMouseLeave={e => {
                        const btn = (e.currentTarget as HTMLDivElement).querySelector('.insight-btn') as HTMLElement
                        if (btn) btn.style.opacity = '0'
                      }}
                    >
                      {/* 资讯头部：标题 + 灵感按钮 */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: item.date || item.content ? '6px' : 0 }}>
                        {item.title && (
                          <h3 style={{
                            flex: 1,
                            fontSize: '14px',
                            color: 'var(--ink-dark)',
                            fontWeight: 600,
                            lineHeight: '1.5',
                            fontFamily: 'var(--font-serif)',
                            margin: 0,
                          }}>
                            {item.title}
                          </h3>
                        )}
                        {/* P0-1: 灵感捕捉按钮 */}
                        <button
                          className="insight-btn"
                          onClick={() => openInsight({ sectionLabel: label, itemTitle: item.title || '该资讯' })}
                          title="记录灵感"
                          style={{
                            opacity: 0,
                            transition: 'opacity 0.15s',
                            flexShrink: 0,
                            background: 'white',
                            border: `1px solid ${color}44`,
                            borderRadius: '8px',
                            padding: '3px 9px',
                            fontSize: '11px',
                            color,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-serif)',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          }}
                        >
                          💡 记灵感
                        </button>
                      </div>

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

          {/* P0-2: 今日回顾 */}
          <DailyReviewSection
            briefDate={brief.date}
            review={review}
            reviewText={reviewText}
            setReviewText={setReviewText}
            reviewEditing={reviewEditing}
            setReviewEditing={setReviewEditing}
            reviewSaving={reviewSaving}
            reviewLoading={reviewLoading}
            onSave={saveReview}
          />
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

      {/* P0-1: 灵感捕捉浮层 */}
      <AnimatePresence>
        {insightSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(45, 36, 24, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={e => e.target === e.currentTarget && setInsightSource(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                background: 'var(--paper-warm)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 20px 60px rgba(45,36,24,0.2)',
              }}
            >
              {/* 来源标签 */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fff3eb',
                border: '1px solid #f9c9be',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '11px',
                color: 'var(--accent-coral)',
                marginBottom: '14px',
                maxWidth: '100%',
              }}>
                <span>📰</span>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {insightSource.sectionLabel} · {insightSource.itemTitle}
                </span>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.2rem',
                color: 'var(--ink-dark)',
                marginBottom: '14px',
              }}>
                💡 记录你的灵感
              </h3>

              <textarea
                ref={insightTextareaRef}
                value={insightText}
                onChange={e => setInsightText(e.target.value)}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveInsight()
                  if (e.key === 'Escape') setInsightSource(null)
                }}
                placeholder="这条资讯让你想到了什么？有什么启发或行动想法？"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-soft)',
                  background: 'white',
                  fontSize: '14px',
                  lineHeight: '1.75',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--ink-main)',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-coral)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-soft)'}
              />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '14px',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                  ⌘↵ 快速保存 · Esc 关闭
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setInsightSource(null)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)',
                      background: 'transparent',
                      color: 'var(--ink-muted)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={saveInsight}
                    disabled={!insightText.trim() || insightSaving}
                    style={{
                      padding: '7px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: insightText.trim() ? 'var(--accent-coral)' : 'var(--ink-faint)',
                      color: 'white',
                      fontSize: '13px',
                      cursor: insightText.trim() ? 'pointer' : 'default',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                  >
                    {insightSaving ? '保存中…' : '💾 保存灵感'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast 通知 */}
      <AnimatePresence>
        {(insightToast || reviewToast) && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--ink-dark)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '13px',
              fontFamily: 'var(--font-serif)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              zIndex: 400,
              whiteSpace: 'nowrap',
            }}
          >
            {insightToast || reviewToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// P0-2: 今日回顾区块组件
// ============================================================

interface DailyReviewSectionProps {
  briefDate: string
  review: DailyReview | null
  reviewText: string
  setReviewText: (v: string) => void
  reviewEditing: boolean
  setReviewEditing: (v: boolean) => void
  reviewSaving: boolean
  reviewLoading: boolean
  onSave: () => void
}

function DailyReviewSection({
  briefDate,
  review,
  reviewText,
  setReviewText,
  reviewEditing,
  setReviewEditing,
  reviewSaving,
  reviewLoading,
  onSave,
}: DailyReviewSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleStartEdit = () => {
    setReviewEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 80)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{
        marginTop: '36px',
        paddingTop: '28px',
        borderTop: '1px dashed var(--border-soft)',
      }}
    >
      {/* 区域标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1.2rem',
          color: 'var(--accent-lavender)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: 0,
        }}>
          📝 今日回顾
          <span style={{
            fontSize: '11px',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
          }}>
            读完日报，写下今天的思考
          </span>
        </h2>

        {review && !reviewEditing && (
          <button
            onClick={handleStartEdit}
            style={{
              background: 'none',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '4px 12px',
              fontSize: '12px',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-lavender)'
              ;(e.target as HTMLButtonElement).style.color = 'var(--accent-lavender)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'var(--border-soft)'
              ;(e.target as HTMLButtonElement).style.color = 'var(--ink-muted)'
            }}
          >
            ✏️ 编辑
          </button>
        )}
      </div>

      {reviewLoading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-muted)', fontSize: '13px' }}>
          加载中…
        </div>
      ) : review && !reviewEditing ? (
        /* 已有回顾，展示模式 */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, #f8f4ff, #f4f0ff)',
            border: '1px solid var(--accent-lavender)',
            borderLeft: '3px solid var(--accent-lavender)',
            borderRadius: '0 12px 12px 0',
            padding: '18px 20px',
          }}
        >
          <div style={{
            fontSize: '14px',
            lineHeight: '1.85',
            color: 'var(--ink-main)',
            fontFamily: 'var(--font-serif)',
            whiteSpace: 'pre-wrap',
          }}>
            {reviewText}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '12px' }}>
            ✍️ {new Date(review.updated_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 记录
          </div>
        </motion.div>
      ) : reviewEditing || !review ? (
        /* 编辑/新建回顾 */
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <textarea
            ref={textareaRef}
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSave()
              if (e.key === 'Escape' && review) setReviewEditing(false)
            }}
            placeholder={`读完 ${briefDate} 的日报，你有什么想法？哪条内容让你印象深刻？有什么值得行动的？`}
            style={{
              width: '100%',
              minHeight: '130px',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1.5px solid var(--border-soft)',
              background: 'white',
              fontSize: '14px',
              lineHeight: '1.8',
              fontFamily: 'var(--font-serif)',
              color: 'var(--ink-main)',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-lavender)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-soft)'}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
              ⌘↵ 保存{review ? ' · Esc 取消' : ''}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {review && reviewEditing && (
                <button
                  onClick={() => setReviewEditing(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-soft)',
                    background: 'transparent',
                    color: 'var(--ink-muted)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  取消
                </button>
              )}
              <button
                onClick={onSave}
                disabled={!reviewText.trim() || reviewSaving}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: reviewText.trim() ? 'var(--accent-lavender)' : 'var(--ink-faint)',
                  color: 'white',
                  fontSize: '13px',
                  cursor: reviewText.trim() ? 'pointer' : 'default',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 500,
                  transition: 'background 0.15s',
                }}
              >
                {reviewSaving ? '保存中…' : review ? '💾 更新回顾' : '📝 保存回顾'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {!review && !reviewEditing && !reviewLoading && (
        /* 未写过回顾的引导状态 */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '28px 20px',
            background: 'var(--paper-card)',
            borderRadius: '12px',
            border: '1px dashed var(--border-soft)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌱</div>
          <p style={{ color: 'var(--ink-muted)', fontSize: '13px', lineHeight: '1.7', marginBottom: '16px' }}>
            读完日报，写下今天的思考<br />
            让信息真正内化为你自己的认知
          </p>
          <button
            onClick={handleStartEdit}
            style={{
              padding: '8px 22px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent-lavender), #9b8ec4)',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              fontWeight: 500,
              boxShadow: '0 2px 10px rgba(155,142,196,0.35)',
            }}
          >
            ✍️ 写今日回顾
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================
// 简单解析内联 Markdown（加粗、引用块）
// ============================================================
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
