'use client'

import { Tag } from '@/types'
import { getTagColor } from '@/lib/utils'

interface Props {
  tags: Tag[]
  activeTag: string | null
  onTagClick: (tag: string | null) => void
}

export default function TagCloud({ tags, activeTag, onTagClick }: Props) {
  if (tags.length === 0) return null

  const maxCount = Math.max(...tags.map(t => t.count), 1)

  return (
    <div>
      <div style={{
        fontSize: '12px',
        color: 'var(--ink-muted)',
        marginBottom: '8px',
        fontFamily: 'var(--font-serif)',
      }}>
        标签 · {tags.length} 个
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {tags.map(tag => {
          const isActive = activeTag === tag.name
          const size = 11 + (tag.count / maxCount) * 6 // 11px ~ 17px
          const color = getTagColor(tag.name)

          return (
            <button
              key={tag.id}
              onClick={() => onTagClick(isActive ? null : tag.name)}
              style={{
                background: isActive ? color + '55' : color + '22',
                color: 'var(--ink-main)',
                border: isActive ? `1.5px solid ${color}` : `1px solid ${color}44`,
                borderRadius: '20px',
                padding: '3px 12px',
                fontSize: `${size}px`,
                fontFamily: 'var(--font-serif)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              #{tag.name}
              <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.6 }}>
                {tag.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
