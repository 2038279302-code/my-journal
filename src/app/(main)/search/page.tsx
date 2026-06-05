'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Note, MOOD_EMOJI } from '@/types'
import { formatDate, formatTimeOnly, getTagColor, truncate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'quick', label: '💭 碎片想法' },
  { value: 'diary', label: '📔 日记' },
  { value: 'reflection', label: '🗂️ 复盘' },
]

const DATE_PRESETS = [
  { value: '', label: '不限时间' },
  { value: '7', label: '近 7 天' },
  { value: '30', label: '近 30 天' },
  { value: '90', label: '近 3 个月' },
  { value: 'custom', label: '自定义' },
]

function getDateRange(preset: string): { from: string; to: string } {
  const today = new Date()
  const toStr = today.toISOString().split('T')[0]
  if (!preset || preset === 'custom') return { from: '', to: '' }
  const days = parseInt(preset)
  const from = new Date(today)
  from.setDate(from.getDate() - days)
  return { from: from.toISOString().split('T')[0], to: toStr }
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [datePreset, setDatePreset] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [results, setResults] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    const hasFilter = query.trim() || typeFilter || datePreset
    if (!hasFilter) { setResults([]); setSearched(false); return }

    setLoading(true)
    setSearched(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (typeFilter) params.set('type', typeFilter)

      // 计算时间范围
      if (datePreset && datePreset !== 'custom') {
        const { from, to } = getDateRange(datePreset)
        if (from) params.set('date_from', from)
        if (to) params.set('date_to', to)
      } else if (datePreset === 'custom') {
        if (customFrom) params.set('date_from', customFrom)
        if (customTo) params.set('date_to', customTo)
      }

      // 若只设置了时间范围但没有其他条件，需要额外设置标识
      if (!params.has('q') && !params.has('type') && !params.has('date_from') && !params.has('date_to')) {
        setResults([]); setLoading(false); return
      }

      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error('搜索请求失败')
      const json = await res.json()
      setResults(json.data || [])
    } catch {
      setError('搜索遇到了小问题，可以稍后再试 🌿')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, typeFilter, datePreset, customFrom, customTo])

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return <>{text}</>
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i} style={{ background: '#fef3a0', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
            : part
        )}
      </>
    )
  }

  const hasActiveFilter = query.trim() || typeFilter || datePreset

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', color: 'var(--ink-dark)', marginBottom: '6px' }}>
        搜索 🔍
      </h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '13px', marginBottom: '24px' }}>
        搜索正文、标签，按类型和时间筛选记录
      </p>

      {/* 搜索框 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '16px',
      }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="搜索你的想法、日记内容…"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1.5px solid var(--border-medium)',
            background: 'var(--paper-card)',
            fontSize: '15px',
            fontFamily: 'var(--font-serif)',
            color: 'var(--ink-main)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-coral)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-medium)')}
          autoFocus
        />
        <button
          onClick={handleSearch}
          disabled={loading || !hasActiveFilter}
          className="btn-journal primary"
          style={{ padding: '12px 20px', flexShrink: 0 }}
        >
          {loading ? '搜索中…' : '搜索'}
        </button>
      </div>

      {/* 筛选条件 */}
      <div className="search-filters" style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '28px',
        padding: '14px 16px',
        background: 'var(--paper-warm)',
        borderRadius: '10px',
        border: '1px solid var(--border-soft)',
      }}>
        {/* 类型筛选 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>记录类型</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--paper-card)',
              fontSize: '13px',
              fontFamily: 'var(--font-serif)',
              color: 'var(--ink-main)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 时间预设 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>时间范围</label>
          <select
            value={datePreset}
            onChange={e => setDatePreset(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--paper-card)',
              fontSize: '13px',
              fontFamily: 'var(--font-serif)',
              color: 'var(--ink-main)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {DATE_PRESETS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 自定义日期范围 */}
        {datePreset === 'custom' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>开始日期</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--paper-card)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--ink-main)',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>结束日期</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--paper-card)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--ink-main)',
                  outline: 'none',
                }}
              />
            </div>
          </>
        )}

        {/* 清空筛选 */}
        {(typeFilter || datePreset) && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setTypeFilter(''); setDatePreset(''); setCustomFrom(''); setCustomTo('') }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)',
              }}
            >
              清除筛选
            </button>
          </div>
        )}
      </div>

      {/* 结果区 */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-muted)' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌿</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem' }}>{error}</p>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '10px' }} />
            ))}
          </motion.div>
        ) : searched ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '14px' }}>
              找到 <strong style={{ color: 'var(--accent-coral)' }}>{results.length}</strong> 条结果
            </div>

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔎</div>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem' }}>
                  没有找到相关记录
                </p>
                <p style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.7' }}>
                  可以换个关键词试试，或者调整类型和时间范围
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.map((note, i) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="journal-card"
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                    onClick={() => router.push(`/notes/${note.id}`)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        background: 'var(--paper-warm)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: '6px',
                        padding: '1px 7px',
                        color: 'var(--ink-muted)',
                        flexShrink: 0,
                      }}>
                        {note.type === 'quick' ? '💭 碎片' : note.type === 'diary' ? '📔 日记' : '🗂️ 复盘'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-light)' }}>
                        {formatDate(note.created_at)} {formatTimeOnly(note.created_at)}
                      </span>
                      {note.mood && (
                        <span style={{ fontSize: '14px' }}>{MOOD_EMOJI[note.mood]}</span>
                      )}
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        color: 'var(--ink-light)',
                      }}>
                        查看全文 →
                      </span>
                    </div>

                    <p style={{
                      fontSize: '13px',
                      lineHeight: '1.75',
                      color: 'var(--ink-main)',
                      fontFamily: 'var(--font-serif)',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {highlight(truncate(note.content, 200), query)}
                    </p>

                    {note.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {note.tags.map(tag => (
                          <span key={tag} className="tag-pill" style={{ background: getTagColor(tag) + '33', color: 'var(--ink-main)' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-muted)' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>✨</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem' }}>
              输入关键词搜索你的记录
            </p>
            <p style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.8' }}>
              支持搜索正文内容、标签名称 · 可按类型和时间筛选
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
