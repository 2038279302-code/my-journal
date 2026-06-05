'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Note, Tag, Mood, MOOD_EMOJI, MOOD_LABEL } from '@/types'
import { getDailyPrompt, formatDate, formatTimeOnly, formatRelativeTime, extractTags, getTagColor, truncate } from '@/lib/utils'
import NoteCard from './NoteCard'
import Heatmap from './Heatmap'
import TagCloud from './TagCloud'
import NoteEditor from '../editor/NoteEditor'

interface Props {
  initialNotes: Note[]
  initialHeatmap: Record<string, number>
  initialTags: Tag[]
}

const TAPE_COLORS = ['tape-coral', 'tape-sage', 'tape-sky', 'tape-lavender', 'tape-golden']

export default function HomeClient({ initialNotes, initialHeatmap, initialTags }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [input, setInput] = useState('')
  const [mood, setMood] = useState<Mood | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [heatmap, setHeatmap] = useState(initialHeatmap)
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const prompt = getDailyPrompt()

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim(), type: 'quick', mood }),
      })
      const json = await res.json()
      if (json.data) {
        setNotes(prev => [json.data, ...prev])
        const day = json.data.created_at.split('T')[0]
        setHeatmap(prev => ({ ...prev, [day]: (prev[day] || 0) + 1 }))
        const newTags = extractTags(input)
        if (newTags.length > 0) {
          setTags(prev => {
            const updated = [...prev]
            for (const t of newTags) {
              const existing = updated.find(x => x.name === t)
              if (existing) existing.count++
              else updated.push({ id: t, name: t, color: getTagColor(t), count: 1 })
            }
            return updated.sort((a, b) => b.count - a.count)
          })
        }
        setInput('')
        setMood(null)
        showToast('已记下来 ✨')
      } else {
        showToast(json.error || '保存失败，可以稍后再试', 'error')
      }
    } catch {
      showToast('保存失败，请检查网络连接', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('删除失败，可以稍后再试', 'error')
        return
      }
      const note = notes.find(n => n.id === id)
      setNotes(prev => prev.filter(n => n.id !== id))
      // 更新热力图
      if (note) {
        const day = note.created_at.split('T')[0]
        setHeatmap(prev => {
          const newMap = { ...prev }
          if (newMap[day] > 1) newMap[day]--
          else delete newMap[day]
          return newMap
        })
        // 更新标签计数
        if (note.tags.length > 0) {
          setTags(prev => {
            const updated = prev.map(t => {
              if (note.tags.includes(t.name)) {
                return { ...t, count: Math.max(0, t.count - 1) }
              }
              return t
            }).filter(t => t.count > 0)
            return updated
          })
        }
      }
      showToast('已删除 🌿')
    } catch {
      showToast('删除失败，可以稍后再试', 'error')
    }
  }

  const handleUpdate = async (id: string, content: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (json.data) {
        setNotes(prev => prev.map(n => n.id === id ? json.data : n))
        showToast('保存成功 ✨')
      } else {
        showToast('保存失败，可以稍后再试', 'error')
      }
    } catch {
      showToast('保存失败，请检查网络连接', 'error')
    }
    setEditingNote(null)
  }

  // 按日期分组
  const filteredNotes = activeTag
    ? notes.filter(n => n.tags.includes(activeTag))
    : notes

  const groupedNotes: Record<string, Note[]> = {}
  for (const note of filteredNotes) {
    const day = note.created_at.split('T')[0]
    if (!groupedNotes[day]) groupedNotes[day] = []
    groupedNotes[day].push(note)
  }

  const totalNotes = notes.length

  return (
    <div className="page-container" style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 24px' }}>

      {/* 顶部统计 */}
      <div className="home-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', color: 'var(--ink-dark)', marginBottom: '4px' }}>
            想法记录 ✦
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>
            共记录了 <strong style={{ color: 'var(--accent-coral)' }}>{totalNotes}</strong> 个想法
          </p>
        </div>
        <div className="home-header-date" style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
      </div>

      {/* 热力图 */}
      <div style={{ marginBottom: '28px' }}>
        <Heatmap data={heatmap} />
      </div>

      {/* 快速输入区 */}
      <motion.div
        className="journal-card tape-coral"
        style={{ padding: '20px', marginBottom: '28px' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '15px',
          color: 'var(--ink-muted)',
          marginBottom: '12px',
          fontStyle: 'italic',
        }}>
          {prompt}
        </p>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          placeholder="写点什么… 用 #标签 来分类，⌘+Enter 快速保存"
          className="journal-input"
          rows={2}
          style={{
            fontSize: '15px',
            lineHeight: '1.7',
            width: '100%',
            minHeight: '60px',
          }}
        />

        {/* 底部工具栏 */}
        <div className="input-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          {/* 情绪选择 */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {([1, 2, 3, 4, 5] as Mood[]).map(m => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? null : m)}
                title={MOOD_LABEL[m]}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: mood === m ? '2px solid var(--accent-coral)' : '1.5px solid var(--border-soft)',
                  background: mood === m ? 'var(--paper-cream)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {MOOD_EMOJI[m]}
              </button>
            ))}
          </div>

          <div className="input-toolbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setExpanded(true)}
              className="btn-journal"
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              📝 长文日记
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !input.trim()}
              className="btn-journal primary"
              style={{ fontSize: '13px', padding: '6px 18px' }}
            >
              {submitting ? '保存中…' : '记下来 →'}
            </button>
          </div>
        </div>

        {/* 实时标签预览 */}
        {extractTags(input).length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {extractTags(input).map(tag => (
              <span
                key={tag}
                className="tag-pill"
                style={{ background: getTagColor(tag) + '33', color: 'var(--ink-main)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* 标签云 */}
      {tags.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <TagCloud tags={tags} activeTag={activeTag} onTagClick={setActiveTag} />
        </div>
      )}

      {/* 时间线 */}
      <div>
        {activeTag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--ink-muted)', fontSize: '13px' }}>筛选：</span>
            <span
              className="tag-pill"
              style={{ background: getTagColor(activeTag) + '33', color: 'var(--ink-main)', cursor: 'pointer' }}
              onClick={() => setActiveTag(null)}
            >
              #{activeTag} ✕
            </span>
          </div>
        )}

        <AnimatePresence>
          {Object.entries(groupedNotes).map(([day, dayNotes], i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ marginBottom: '28px' }}
            >
              {/* 日期标题 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.1rem',
                  color: 'var(--ink-dark)',
                  fontWeight: 600,
                }}>
                  {formatDate(day + 'T00:00:00')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-light)' }}>
                  {day} · {dayNotes.length} 条
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }} />
              </div>

              {/* 该日笔记 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayNotes.map((note, j) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    tapeColor={TAPE_COLORS[(i + j) % TAPE_COLORS.length]}
                    onDelete={handleDelete}
                    onEdit={() => setEditingNote(note)}
                    onTagClick={setActiveTag}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNotes.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--ink-muted)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>
              {activeTag ? `还没有 #${activeTag} 相关的记录` : '今天还没有记录，写点什么吧'}
            </p>
          </div>
        )}
      </div>

      {/* 全屏 Markdown 编辑器 */}
      <AnimatePresence>
        {(expanded || editingNote) && (
          <NoteEditor
            initialContent={editingNote?.content || ''}
            onSave={async (content, type, mood) => {
              if (editingNote) {
                await handleUpdate(editingNote.id, content)
              } else {
                try {
                  const res = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, type, mood }),
                  })
                  const json = await res.json()
                  if (json.data) {
                    setNotes(prev => [json.data, ...prev])
                    const day = json.data.created_at.split('T')[0]
                    setHeatmap(prev => ({ ...prev, [day]: (prev[day] || 0) + 1 }))
                    showToast('保存成功 ✨')
                  } else {
                    showToast(json.error || '保存失败，可以稍后再试', 'error')
                  }
                } catch {
                  showToast('保存失败，请检查网络连接', 'error')
                }
              }
              setExpanded(false)
              setEditingNote(null)
            }}
            onClose={() => { setExpanded(false); setEditingNote(null) }}
          />
        )}
      </AnimatePresence>

      {/* 全局 Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="toast-global"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: toast.type === 'error' ? '#e57373' : 'var(--ink-dark)',
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
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
