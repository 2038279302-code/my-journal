'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { NoteType, Mood, MOOD_EMOJI, MOOD_LABEL } from '@/types'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface Props {
  initialContent?: string
  onSave: (content: string, type: NoteType, mood: Mood | undefined) => Promise<void>
  onClose: () => void
}

const TYPE_OPTIONS: { value: NoteType; label: string; emoji: string }[] = [
  { value: 'quick', label: '碎片', emoji: '💭' },
  { value: 'diary', label: '日记', emoji: '📔' },
  { value: 'reflection', label: '复盘', emoji: '🗂️' },
]

export default function NoteEditor({ initialContent = '', onSave, onClose }: Props) {
  const [content, setContent] = useState(initialContent)
  const [type, setType] = useState<NoteType>('diary')
  const [mood, setMood] = useState<Mood | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const wordCount = content.replace(/\s/g, '').length

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [content, type, mood])

  const handleSave = async () => {
    if (!content.trim() || saving) return
    setSaving(true)
    await onSave(content, type, mood)
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(45, 36, 24, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          background: 'var(--paper-card)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(74, 55, 40, 0.2)',
        }}
      >
        {/* 顶部工具栏 */}
        <div
          className="editor-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-soft)',
            background: 'var(--paper-warm)',
          }}
        >
          {/* 类型选择 */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: type === opt.value ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-soft)',
                  background: type === opt.value ? 'var(--paper-cream)' : 'transparent',
                  color: type === opt.value ? 'var(--accent-coral)' : 'var(--ink-muted)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-serif)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-soft)', flexShrink: 0 }} />

          {/* 情绪 */}
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            {([1, 2, 3, 4, 5] as Mood[]).map(m => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? undefined : m)}
                title={MOOD_LABEL[m]}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: mood === m ? '2px solid var(--accent-coral)' : 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '15px',
                  opacity: mood === undefined || mood === m ? 1 : 0.4,
                  transition: 'all 0.15s',
                }}
              >
                {MOOD_EMOJI[m]}
              </button>
            ))}
          </div>

          {/* 右侧区域 */}
          <div className="editor-toolbar-right" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* 字数 */}
            <span style={{ fontSize: '12px', color: 'var(--ink-light)' }}>
              {wordCount} 字
            </span>


            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'var(--ink-muted)',
              lineHeight: 1,
              padding: '2px',
              minWidth: '28px',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              ✕
            </button>
          </div>
        </div>

        {/* 编辑器 */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0' }} data-color-mode="light">
          <MDEditor
            value={content}
            onChange={v => setContent(v || '')}
            height="100%"
            preview="edit"
            style={{
              height: 'calc(90vh - 130px)',
              borderRadius: 0,
              border: 'none',
              background: 'var(--paper-card)',
            }}
            textareaProps={{
              placeholder: '开始写作… Markdown 语法支持',
              style: {
                fontFamily: 'var(--font-serif)',
                fontSize: '15px',
                lineHeight: '1.8',
                color: 'var(--ink-main)',
              },
            }}
          />
        </div>

        {/* 底部保存 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-soft)',
          background: 'var(--paper-warm)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
          <button onClick={onClose} className="btn-journal" style={{ fontSize: '13px' }}>
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="btn-journal primary"
            style={{ fontSize: '13px', padding: '8px 24px' }}
          >
            {saving ? '保存中…' : '💾 保存'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
