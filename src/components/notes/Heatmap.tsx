'use client'

import { useMemo, useState } from 'react'
import { format, eachDayOfInterval, subDays, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  data: Record<string, number>
}

const WEEKS = 26 // 展示近 26 周（约半年）

export default function Heatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  const { grid, maxCount } = useMemo(() => {
    const today = new Date()
    const start = subDays(today, WEEKS * 7 - 1)
    const days = eachDayOfInterval({ start, end: today })
    const maxCount = Math.max(...Object.values(data), 1)

    // 按周分组
    const weeks: typeof days[] = []
    let currentWeek: typeof days = []
    for (const day of days) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)

    return { grid: weeks, maxCount }
  }, [data])

  const getLevel = (date: Date): number => {
    const key = format(date, 'yyyy-MM-dd')
    const count = data[key] || 0
    if (count === 0) return 0
    if (count <= 1) return 1
    if (count <= 3) return 2
    if (count <= 5) return 3
    return 4
  }

  // 统计与组件实际展示范围一致：近 26 周
  const totalThisYear = useMemo(() => {
    const today = new Date()
    const cutoff = subDays(today, WEEKS * 7 - 1)
    const cutoffStr = format(cutoff, 'yyyy-MM-dd')
    return Object.entries(data)
      .filter(([k]) => k >= cutoffStr)
      .reduce((sum, [, v]) => sum + v, 0)
  }, [data])

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
          近半年记录 <strong style={{ color: 'var(--accent-coral)' }}>{totalThisYear}</strong> 次
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--ink-light)' }}>
          <span>少</span>
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} className="heatmap-cell" data-level={l} style={{ width: '10px', height: '10px' }} />
          ))}
          <span>多</span>
        </div>
      </div>

      <div className="heatmap-scroll" style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '4px' }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {week.map((day, di) => {
              const key = format(day, 'yyyy-MM-dd')
              const count = data[key] || 0
              const level = getLevel(day)
              return (
                <div
                  key={di}
                  className="heatmap-cell"
                  data-level={level}
                  title={`${format(day, 'M月d日', { locale: zhCN })}：${count} 条记录`}
                  onMouseEnter={e => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect()
                    setTooltip({ date: format(day, 'M月d日', { locale: zhCN }), count, x: rect.left, y: rect.top })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16,
          top: tooltip.y - 36,
          background: 'var(--ink-dark)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.date}：{tooltip.count} 条
        </div>
      )}
    </div>
  )
}
