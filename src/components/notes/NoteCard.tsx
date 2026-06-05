'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Note, MOOD_EMOJI } from '@/types'
import { formatTimeOnly, formatRelativeTime, getTagColor, truncate } from '@/lib/utils'

interface Props {
  note: Note
  tapeColor?: string
  onDelete: (id: string) => void
  onEdit: () => void
  onTagClick: (tag: string) => void
}

export default function NoteCard({ note, tapeColor = 'tape-coral', onDelete, onEdit, onTagClick }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()

  const isLong = note.content.length > 200
  const displayContent = isLong ? truncate(note.content, 200) : note.content

  const toggleActions = () => {
    setShowActions(v => !v)
    if (showActions) setConfirmDelete(false)
  }

  return (
    <motion.div
      layout
      className={`journal-card ${tapeColor}`}
      style={{ padding: '14px 16px 12px' }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => { setShowActions(false); setConfirmDelete(false) }}
      onTap={toggleActions}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* 情绪图标 */}
        {note.mood && (
          <div className="mood-badge" style={{ flexShrink: 0, marginTop: '2px' }}>
            {MOOD_EMOJI[note.mood]}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 内容 */}
          <p style={{
            fontSize: '14px',
            lineHeight: '1.75',
            color: 'var(--ink-main)',
            fontFamily: 'var(--font-serif)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}>
            {displayContent}
            {isLong && (
              <button
                onClick={() => router.push(`/notes/${note.id}`)}
                style={{
                  color: 'var(--accent-coral)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '0 4px',
                }}
              >
                查看全文 →
              </button>
            )}
          </p>

          {/* 标签 */}
          {note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
              {note.tags.map(tag => (
                <button
                  key={tag}
                  className="tag-pill"
                  onClick={() => onTagClick(tag)}
                  style={{
                    background: getTagColor(tag) + '33',
                    color: 'var(--ink-main)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* 底部信息栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-light)' }}>
              {formatTimeOnly(note.created_at)} · {formatRelativeTime(note.created_at)}
            </span>

            {/* 操作按钮 */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: '6px' }}
              >
                {!confirmDelete ? (
                  <>
                    <button
                      onClick={onEdit}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--ink-muted)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'color 0.15s',
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--ink-muted)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>确认删除？</span>
                    <button
                      onClick={() => onDelete(note.id)}
                      style={{
                        background: 'var(--accent-coral)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{
                        background: 'var(--paper-warm)',
                        color: 'var(--ink-muted)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      取消
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
