'use client'

import { useState, useEffect, useCallback } from 'react'
import { Note, NoteType, Mood } from '@/types'

interface UseNotesOptions {
  type?: NoteType
  tag?: string
  limit?: number
}

export function useNotes(options: UseNotesOptions = {}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (options.type) params.set('type', options.type)
    if (options.tag) params.set('tag', options.tag)
    if (options.limit) params.set('limit', String(options.limit))

    const res = await fetch(`/api/notes?${params}`)
    const json = await res.json()
    if (json.error) setError(json.error)
    else setNotes(json.data || [])
    setLoading(false)
  }, [options.type, options.tag, options.limit])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const createNote = async (content: string, type: NoteType = 'quick', mood?: Mood) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type, mood }),
    })
    const json = await res.json()
    if (json.data) {
      setNotes(prev => [json.data, ...prev])
      return json.data
    }
    return null
  }

  const updateNote = async (id: string, updates: Partial<Pick<Note, 'content' | 'mood' | 'type' | 'is_private'>>) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = await res.json()
    if (json.data) {
      setNotes(prev => prev.map(n => n.id === id ? json.data : n))
      return json.data
    }
    return null
  }

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, error, createNote, updateNote, deleteNote, refetch: fetchNotes }
}

// 热力图数据 hook
export function useHeatmap() {
  const [heatmap, setHeatmap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notes?limit=365')
      .then(r => r.json())
      .then(json => {
        const counts: Record<string, number> = {}
        for (const note of json.data || []) {
          const day = note.created_at.split('T')[0]
          counts[day] = (counts[day] || 0) + 1
        }
        setHeatmap(counts)
        setLoading(false)
      })
  }, [])

  return { heatmap, loading }
}
