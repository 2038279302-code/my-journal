'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Note, MOOD_EMOJI } from '@/types'
import { formatDate, formatRelativeTime, getTagColor } from '@/lib/utils'
import NoteEditor from '../editor/NoteEditor'

interface RecentNote {
  created_at: string
  mood: number | null
  tags: string[]
  type: string
}

interface Props {
  reflections: Note[]
  totalNotes: number
  recentNotes: RecentNote[]
}

export default function ReflectionClient({ reflections: initialReflections, totalNotes, recentNotes }: Props) {
  const [reflections, setReflections] = useState(initialReflections)
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // 统计数据
  const last30Days = recentNotes.length
  const avgMood = recentNotes.filter(n => n.mood).length > 0
    ? (recentNotes.reduce((sum, n) => sum + (n.mood || 0), 0) / recentNotes.filter(n => n.mood).length).toFixed(1)
    : null

  // 近 30 天最常用标签
  const tagFreq: Record<string, number> = {}
  for (const n of recentNotes) {
    for (const tag of n.tags || []) {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1
    }
  }
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // 情绪分布
  const moodDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const n of recentNotes) {
    if (n.mood) moodDist[n.mood] = (moodDist[n.mood] || 0) + 1
  }
  const moodMax = Math.max(...Object.values(moodDist), 1)

  const handleSave = async (content: string, type: 'quick' | 'diary' | 'reflection', mood: number | undefined) => {
    if (editingNote) {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (json.data) setReflections(prev => prev.map(n => n.id === editingNote.id ? json.data : n))
    } else {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'reflection', mood }),
      })
      const json = await res.json()
      if (json.data) setReflections(prev => [json.data, ...prev])
    }
    setShowEditor(false)
    setEditingNote(null)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setReflections(prev => prev.filter(n => n.id !== id))
      showToast('已删除这条复盘 🌿')
    } catch {
      showToast('删除失败，可以稍后再试', 'error')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', color: 'var(--ink-dark)', marginBottom: '4px' }}>
            反思复盘 🗂️
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>
            沉淀想法，看见成长
          </p>
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="btn-journal primary"
          style={{ flexShrink: 0 }}
        >
          ✍️ 新建复盘
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px',
        marginBottom: '32px',
      }}>
        {/* 总记录 */}
        <div className="journal-card tape-coral" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-hand)', color: 'var(--accent-coral)', fontWeight: 700 }}>
            {totalNotes}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>总记录数</div>
        </div>

        {/* 近 30 天 */}
        <div className="journal-card tape-sage" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-hand)', color: 'var(--accent-sage)', fontWeight: 700 }}>
            {last30Days}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>近 30 天</div>
        </div>

        {/* 平均情绪 */}
        <div className="journal-card tape-lavender" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-hand)', color: 'var(--accent-lavender)', fontWeight: 700 }}>
            {avgMood ? `${MOOD_EMOJI[Math.round(Number(avgMood)) as 1|2|3|4|5]} ${avgMood}` : '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>近期平均情绪</div>
        </div>
      </div>

      {/* 情绪分布 */}
      {recentNotes.filter(n => n.mood).length > 0 && (
        <div className="journal-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: 'var(--ink-dark)', marginBottom: '14px' }}>
            近 30 天情绪分布
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '60px' }}>
            {([1, 2, 3, 4, 5] as const).map(m => {
              const count = moodDist[m] || 0
              const height = count > 0 ? Math.max((count / moodMax) * 50 + 8, 8) : 4
              const colors = ['#c4b5b5', '#d4c4a0', '#8fb89a', '#89a8c4', '#e8907a']
              return (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{count}</div>
                  <div style={{
                    width: '100%',
                    height: `${height}px`,
                    background: colors[m - 1],
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.3s ease',
                  }} />
                  <div style={{ fontSize: '16px' }}>{MOOD_EMOJI[m]}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 常用标签 */}
      {topTags.length > 0 && (
        <div className="journal-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: 'var(--ink-dark)', marginBottom: '12px' }}>
            近 30 天热门话题
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {topTags.map(([tag, count]) => (
              <div key={tag} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: getTagColor(tag) + '33',
                border: `1px solid ${getTagColor(tag)}44`,
                fontSize: '13px',
                color: 'var(--ink-main)',
              }}>
                <span>#{tag}</span>
                <span style={{
                  background: getTagColor(tag),
                  color: 'white',
                  borderRadius: '10px',
                  padding: '0 6px',
                  fontSize: '11px',
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分隔线 */}
      <hr className="divider-hand" />

      {/* 复盘列表 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-dark)', marginBottom: '16px' }}>
          复盘记录
        </h2>

        {reflections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--ink-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🌱</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>
              还没有复盘记录
            </p>
            <p style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.7' }}>
              定期复盘，看见自己的成长轨迹
            </p>
            <button
              onClick={() => setShowEditor(true)}
              className="btn-journal primary"
              style={{ marginTop: '18px' }}
            >
              写第一篇复盘 ✍️
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {reflections.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="journal-card tape-lavender"
                style={{ padding: '18px 20px' }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                    {formatDate(note.created_at)} · {formatRelativeTime(note.created_at)}
                    {note.mood && <span style={{ marginLeft: '6px' }}>{MOOD_EMOJI[note.mood]}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => { setEditingNote(note); setShowEditor(true) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--ink-muted)' }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(note.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--ink-muted)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* 日报来源标签（如果是从日报写的回顾） */}
                {/\[brief:\d{4}-\d{2}-\d{2}\]/.test(note.content) && (() => {
                  const match = note.content.match(/\[brief:(\d{4}-\d{2}-\d{2})\]/)
                  return match ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fff3eb',
                      border: '1px solid #f9c9be',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      color: 'var(--accent-coral)',
                      marginBottom: '8px',
                    }}>
                      📰 {match[1]} 日报回顾
                    </div>
                  ) : null
                })()}

                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: 'var(--ink-main)',
                    fontFamily: 'var(--font-serif)',
                    whiteSpace: 'pre-wrap',
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => router.push(`/notes/${note.id}`)}
                  title="点击查看全文"
                >
                  {note.content.replace(/\[brief:[^\]]+\]\n?/, '')}
                </div>
                {note.content.replace(/\[brief:[^\]]+\]\n?/, '').length > 200 && (
                  <button
                    onClick={() => router.push(`/notes/${note.id}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--accent-coral)',
                      padding: '4px 0',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    查看全文 →
                  </button>
                )}

                {note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
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
      </div>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {showEditor && (
          <NoteEditor
            initialContent={editingNote?.content || ''}
            onSave={handleSave}
            onClose={() => { setShowEditor(false); setEditingNote(null) }}
          />
        )}
      </AnimatePresence>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(45, 36, 24, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={e => e.target === e.currentTarget && setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--paper-card)',
                borderRadius: '16px',
                padding: '28px 32px',
                maxWidth: '360px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(74, 55, 40, 0.2)',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
              <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-dark)', marginBottom: '8px' }}>
                确认删除这条复盘？
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '20px', lineHeight: '1.7' }}>
                删除后无法恢复，请确认是否继续
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="btn-journal"
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  style={{
                    background: '#e57373',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-serif)',
                    cursor: 'pointer',
                  }}
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
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
