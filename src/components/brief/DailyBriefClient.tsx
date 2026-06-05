'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DailyBrief } from '@/types'
import { formatFullDate } from '@/lib/utils'
import BriefDetail from './BriefDetail'

interface BriefListItem {
  id: string
  date: string
  headline: string
  overview: string
  created_at: string
}

interface Props {
  initialBriefs: BriefListItem[]
  todayBrief: DailyBrief | null
}

type GenStatus = 'idle' | 'fetching' | 'generating' | 'saving' | 'done' | 'error'

interface GenLog {
  text: string
  type: 'info' | 'success' | 'error' | 'chunk'
}

export default function DailyBriefClient({ initialBriefs, todayBrief }: Props) {
  const [briefs, setBriefs] = useState(initialBriefs)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initialBriefs[0]?.date || null
  )
  const [selectedBrief, setSelectedBrief] = useState<DailyBrief | null>(todayBrief)
  const [loadingDate, setLoadingDate] = useState<string | null>(null)

  // 生成状态
  const [genStatus, setGenStatus] = useState<GenStatus>('idle')
  const [genLogs, setGenLogs] = useState<GenLog[]>([])
  const [liveMarkdown, setLiveMarkdown] = useState('')   // AI 流式输出的实时内容
  const [showLive, setShowLive] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<(() => void) | null>(null)

  const addLog = (text: string, type: GenLog['type'] = 'info') => {
    setGenLogs(prev => [...prev, { text, type }])
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleGenerate = async () => {
    if (genStatus === 'fetching' || genStatus === 'generating') {
      abortRef.current?.()
      return
    }

    setGenStatus('fetching')
    setGenLogs([])
    setLiveMarkdown('')
    setShowLive(false)

    const today = new Date().toISOString().split('T')[0]
    addLog(`开始生成 ${today} 日报…`, 'info')

    let aborted = false
    const eventSource = new EventSource(`/api/generate-brief?date=${today}`)
    abortRef.current = () => {
      aborted = true
      eventSource.close()
      setGenStatus('idle')
      addLog('已中止生成', 'error')
    }

    eventSource.addEventListener('progress', (e) => {
      if (aborted) return
      const data = JSON.parse(e.data)
      if (data.step === 'fetch') {
        setGenStatus('fetching')
        addLog(data.message, 'info')
      } else if (data.step === 'generate') {
        setGenStatus('generating')
        setShowLive(true)
        addLog(data.message, 'info')
      } else if (data.step === 'save') {
        setGenStatus('saving')
        addLog(data.message, 'info')
      } else {
        addLog(data.message, 'info')
      }
    })

    eventSource.addEventListener('chunk', (e) => {
      if (aborted) return
      const data = JSON.parse(e.data)
      setLiveMarkdown(prev => prev + (data.delta || ''))
    })

    eventSource.addEventListener('done', (e) => {
      if (aborted) return
      const data = JSON.parse(e.data)
      eventSource.close()
      setGenStatus('done')
      addLog(data.message, 'success')

      if (data.brief) {
        const brief: DailyBrief = data.brief
        setBriefs(prev => {
          const filtered = prev.filter(b => b.date !== today)
          return [{
            id: brief.id,
            date: brief.date,
            headline: brief.headline,
            overview: brief.overview,
            created_at: brief.created_at,
          }, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
        })
        setSelectedDate(today)
        setSelectedBrief(brief)
      }
    })

    eventSource.addEventListener('error', (e) => {
      if (aborted) return
      try {
        const data = JSON.parse((e as MessageEvent).data)
        addLog(data.message || '生成失败', 'error')
      } catch {
        addLog('连接中断或生成失败', 'error')
      }
      eventSource.close()
      setGenStatus('error')
    })

    // EventSource 自身的 onerror（网络断开等）
    eventSource.onerror = () => {
      if (aborted) return
      eventSource.close()
      setGenStatus('error')
      addLog('网络连接中断', 'error')
    }
  }

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date)
    setLoadingDate(date)
    const res = await fetch(`/api/briefs?date=${date}`)
    const json = await res.json()
    setSelectedBrief(json.data || null)
    setLoadingDate(null)
  }

  const today = new Date().toISOString().split('T')[0]
  const hasTodayBrief = briefs.some(b => b.date === today)
  const isGenerating = genStatus === 'fetching' || genStatus === 'generating' || genStatus === 'saving'

  const genBtnLabel = () => {
    if (genStatus === 'fetching') return '⟳ 抓取信息源中…'
    if (genStatus === 'generating') return '✦ AI 生成中…'
    if (genStatus === 'saving') return '⟳ 保存中…'
    if (hasTodayBrief) return '🔄 重新生成今日日报'
    return '✨ 生成今日 AI 日报'
  }

  return (
    <div className="brief-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 左侧：日报列表 */}
      <div className="brief-sidebar" style={{
        width: '300px',
        flexShrink: 0,
        borderRight: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper-warm)',
        overflow: 'hidden',
      }}>
        {/* 顶部 */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.5rem',
            color: 'var(--ink-dark)',
            marginBottom: '4px',
          }}>
            AI 日报 📰
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '14px' }}>
            共 {briefs.length} 篇日报归档
          </p>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: isGenerating
                ? 'var(--accent-sage)'
                : hasTodayBrief
                  ? 'var(--paper-card)'
                  : 'linear-gradient(135deg, var(--accent-coral), #e8847a)',
              color: isGenerating ? 'white' : hasTodayBrief ? 'var(--ink-muted)' : 'white',
              fontSize: '13px',
              fontFamily: 'var(--font-serif)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontWeight: 500,
              boxShadow: isGenerating ? 'none' : hasTodayBrief ? 'none' : '0 2px 8px rgba(232,132,122,0.35)',
            }}
          >
            <span style={isGenerating ? { animation: 'spin 1.5s linear infinite', display: 'inline-block' } : {}}>
              {isGenerating ? '⟳' : hasTodayBrief ? '🔄' : '✨'}
            </span>
            {isGenerating ? genBtnLabel().replace(/^[^ ]+ /, '') : genBtnLabel().replace(/^[^ ]+ /, '')}
          </button>
          {isGenerating && (
            <button
              onClick={() => abortRef.current?.()}
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                background: 'transparent',
                color: 'var(--ink-muted)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              × 中止生成
            </button>
          )}
        </div>

        {/* 生成日志面板 */}
        <AnimatePresence>
          {genLogs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                borderBottom: '1px solid var(--border-soft)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <div style={{
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '10px 14px',
                background: '#fafaf9',
              }}>
                {genLogs.map((log, i) => (
                  <div key={i} style={{
                    fontSize: '11px',
                    lineHeight: '1.6',
                    color: log.type === 'error' ? 'var(--accent-coral)'
                      : log.type === 'success' ? 'var(--accent-sage)'
                        : 'var(--ink-muted)',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'flex-start',
                  }}>
                    <span style={{ flexShrink: 0, opacity: 0.6 }}>
                      {log.type === 'error' ? '✕' : log.type === 'success' ? '✓' : '·'}
                    </span>
                    {log.text}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 日报列表 */}
        <div style={{ padding: '12px 12px', overflowY: 'auto', flex: 1 }}>
          {briefs.length === 0 && genStatus === 'idle' ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--ink-muted)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
              <p style={{ fontSize: '13px' }}>还没有日报</p>
              <p style={{ fontSize: '12px', marginTop: '6px', lineHeight: '1.6' }}>
                点击上方「✨ 生成今日 AI 日报」<br />即可一键生成
              </p>
            </div>
          ) : (
            briefs.map(brief => (
              <button
                key={brief.id}
                onClick={() => handleSelectDate(brief.date)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: selectedDate === brief.date
                    ? '1.5px solid var(--accent-coral)'
                    : '1px solid transparent',
                  background: selectedDate === brief.date ? 'var(--paper-card)' : 'transparent',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.15s',
                  boxShadow: selectedDate === brief.date ? 'var(--shadow-warm)' : 'none',
                }}
              >
                <div style={{
                  fontSize: '11px',
                  color: brief.date === today ? 'var(--accent-coral)' : 'var(--ink-muted)',
                  marginBottom: '4px',
                  fontWeight: brief.date === today ? 600 : 400,
                }}>
                  {brief.date === today ? '📅 今天' : brief.date}
                  {loadingDate === brief.date && ' ⟳'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--ink-dark)',
                  fontFamily: 'var(--font-serif)',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {brief.headline || brief.overview}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 右侧主区域 */}
      <div className="brief-content" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {/* 生成中：实时流式预览 */}
          {isGenerating && showLive ? (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--accent-sage)',
                  animation: 'pulse 1s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>
                  AI 正在生成日报…
                </span>
              </div>
              <div style={{
                background: 'var(--paper-card)',
                border: '1px solid var(--border-soft)',
                borderRadius: '12px',
                padding: '24px',
                fontSize: '13.5px',
                lineHeight: '1.85',
                fontFamily: 'var(--font-serif)',
                color: 'var(--ink-main)',
                whiteSpace: 'pre-wrap',
                minHeight: '200px',
              }}>
                {liveMarkdown}
                <span style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '16px',
                  background: 'var(--accent-coral)',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                  marginLeft: '2px',
                }} />
              </div>
            </motion.div>
          ) : selectedBrief ? (
            <motion.div
              key={selectedBrief.date}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BriefDetail brief={selectedBrief} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                color: 'var(--ink-muted)',
              }}
            >
              <div style={{ fontSize: '56px' }}>📰</div>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem' }}>
                点击左侧按钮生成今日日报
              </p>
              <p style={{ fontSize: '13px', maxWidth: '300px', textAlign: 'center', lineHeight: '1.7' }}>
                自动抓取 OpenAI、Anthropic、36氪、量子位<br />等多个信息源，AI 提炼整合后一键呈现
              </p>
              <button
                onClick={handleGenerate}
                style={{
                  marginTop: '8px',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-coral), #e8847a)',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'var(--font-serif)',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(232,132,122,0.4)',
                  fontWeight: 500,
                }}
              >
                ✨ 立即生成今日 AI 日报
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 全局动画 keyframes（注入到 head 的方式这里用 style tag） */}
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.5; transform: scale(0.8) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
