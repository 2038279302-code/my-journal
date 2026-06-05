'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Note, MOOD_EMOJI, MOOD_LABEL } from '@/types'
import { formatDate, formatTimeOnly, formatFullDate, getTagColor, extractTags } from '@/lib/utils'
import NoteEditor from '@/components/editor/NoteEditor'

const MDPreview = dynamic(() => import('@uiw/react-md-editor').then(m => m.default.Markdown), { ssr: false })

const TYPE_LABEL: Record<string, { icon: string; text: string }> = {
  quick: { icon: '💭', text: '碎片想法' },
  diary: { icon: '📔', text: '日记' },
  reflection: { icon: '🗂️', text: '复盘' },
}

export default function NoteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/notes/${id}`)
      .then(res => {
        if (res.status === 404) throw new Error('404')
        if (!res.ok) throw new Error('fetch_error')
        return res.json()
      })
      .then(json => {
        setNote(json.data)
        setError(null)
      })
      .catch(err => {
        setError(err.message === '404' ? 'not_found' : 'error')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('已删除这条记录 🌿')
      setTimeout(() => router.back(), 1000)
    } catch {
      showToast('删除失败，可以稍后再试', 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleUpdate = async (content: string, type: Note['type'], mood: number | undefined) => {
    if (!note) return
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type, mood: mood ?? null }),
    })
    const json = await res.json()
    if (json.data) {
      setNote(json.data)
      showToast('保存成功 ✨')
    } else {
      showToast('保存失败，可以稍后再试', 'error')
    }
    setShowEditor(false)
  }

  // 是否含有 Markdown 语法（简单判断）
  const hasMarkdown = note
    ? /^#{1,6}\s|^\*\*|^\-\s|\[.*\]\(|```/.test(note.content)
    : false

  return (
    <div className="page-container" style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
      {/* 顶部导航 */}
      <div className="detail-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: '1px solid var(--border-soft)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '13px',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-serif)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-coral)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-coral)'
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-soft)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'
          }}
        >
          ← 返回
        </button>

        <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', color: 'var(--ink-dark)', margin: 0, flex: 1, minWidth: 0 }}>
          记录详情
        </h1>

        {/* 操作按钮（仅在有内容时显示） */}
        {note && (
          <div className="detail-header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowEditor(true)}
              className="btn-journal"
              style={{ fontSize: '13px', padding: '6px 14px', whiteSpace: 'nowrap' }}
            >
              ✏️ 编辑
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: 'none',
                border: '1px solid var(--border-soft)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e57373'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#e57373'
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-soft)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'
              }}
            >
              🗑️ 删除
            </button>
          </div>
        )}
      </div>

      {/* 加载中 */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton" style={{ height: '32px', width: '60%', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '24px', width: '40%', borderRadius: '8px' }} />
        </div>
      )}

      {/* 错误状态 */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-muted)' }}>
          {error === 'not_found' ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍃</div>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>这条记录不存在了</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>可能已被删除，或者链接有误</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>加载失败了，可以稍后再试</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-journal"
                style={{ marginTop: '16px', fontSize: '13px' }}
              >
                重新加载
              </button>
            </>
          )}
        </div>
      )}

      {/* 记录内容 */}
      {!loading && note && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 元信息栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'var(--paper-warm)',
            borderRadius: '10px',
            border: '1px solid var(--border-soft)',
          }}>
            {/* 类型徽章 */}
            <span style={{
              fontSize: '12px',
              background: 'var(--paper-card)',
              border: '1px solid var(--border-soft)',
              borderRadius: '6px',
              padding: '2px 10px',
              color: 'var(--ink-muted)',
              flexShrink: 0,
            }}>
              {TYPE_LABEL[note.type]?.icon} {TYPE_LABEL[note.type]?.text}
            </span>

            {/* 情绪 */}
            {note.mood && (
              <span title={MOOD_LABEL[note.mood]} style={{ fontSize: '18px' }}>
                {MOOD_EMOJI[note.mood]}
              </span>
            )}

            <div style={{ width: '1px', height: '14px', background: 'var(--border-soft)' }} />

            {/* 创建时间 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>创建于</span>
              <span style={{ fontSize: '12px', color: 'var(--ink-main)' }}>
                {formatFullDate(note.created_at)} {formatTimeOnly(note.created_at)}
              </span>
            </div>

            {/* 更新时间（若与创建不同） */}
            {note.updated_at && note.updated_at !== note.created_at && (
              <>
                <div style={{ width: '1px', height: '14px', background: 'var(--border-soft)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>更新于</span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-main)' }}>
                    {formatDate(note.updated_at)} {formatTimeOnly(note.updated_at)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 正文内容 */}
          <div
            className="journal-card tape-coral"
            style={{ padding: '28px 28px 24px', marginBottom: '16px' }}
          >
            {hasMarkdown ? (
              <div data-color-mode="light" style={{ fontFamily: 'var(--font-serif)' }}>
                <MDPreview
                  source={note.content}
                  style={{
                    background: 'transparent',
                    fontSize: '15px',
                    lineHeight: '1.85',
                    color: 'var(--ink-main)',
                    fontFamily: 'var(--font-serif)',
                  }}
                />
              </div>
            ) : (
              <p style={{
                fontSize: '15px',
                lineHeight: '1.9',
                color: 'var(--ink-main)',
                fontFamily: 'var(--font-serif)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}>
                {note.content}
              </p>
            )}
          </div>

          {/* 标签 */}
          {note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {note.tags.map(tag => (
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

          {/* 字数统计 */}
          <div style={{ fontSize: '12px', color: 'var(--ink-light)', textAlign: 'right', marginTop: '8px' }}>
            共 {note.content.replace(/\s/g, '').length} 字
          </div>
        </motion.div>
      )}

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {confirmDelete && (
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
            onClick={e => e.target === e.currentTarget && setConfirmDelete(false)}
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
                确认删除这条记录？
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '20px', lineHeight: '1.7' }}>
                删除后无法恢复，请确认是否继续
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-journal"
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                  disabled={deleting}
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    background: '#e57373',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-serif)',
                    cursor: 'pointer',
                    opacity: deleting ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {deleting ? '删除中…' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {showEditor && note && (
          <NoteEditor
            initialContent={note.content}
            onSave={handleUpdate}
            onClose={() => setShowEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* Toast 提示 */}
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
