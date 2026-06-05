'use client'

// 纯静态 Demo 预览页，展示各个界面的视觉效果，不需要 Supabase
import { useState } from 'react'

const MOCK_NOTES = [
  {
    id: '1', content: '今天读到 Anthropic IPO 的消息，感觉 AI 独角兽的资本化窗口真的开了。要关注一下 Claude API 接下来的价格策略变化 #AI #产品思考',
    type: 'quick', mood: 4, tags: ['AI', '产品思考'], created_at: '2026-06-04T09:30:00Z',
  },
  {
    id: '2', content: '游泳了 40 分钟，思考了一下最近的项目节奏。感觉有些事情可以更快推进，不要等到完美再开始 #反思 #习惯',
    type: 'quick', mood: 5, tags: ['反思', '习惯'], created_at: '2026-06-04T08:10:00Z',
  },
  {
    id: '3', content: '世界模型的成本已经降到了一个 GPT Plus 会员的价格/月，这个信号很重要。普通开发者现在也可以玩世界模型了 #技术 #AI',
    type: 'quick', mood: 3, tags: ['技术', 'AI'], created_at: '2026-06-03T21:45:00Z',
  },
  {
    id: '4', content: '扣子 3.0 手机遥控电脑 Agent 这个交互范式很有意思，跨设备协同是个值得深入研究的方向 #产品思考 #Agent',
    type: 'quick', mood: 4, tags: ['产品思考', 'Agent'], created_at: '2026-06-03T15:20:00Z',
  },
]

const MOCK_HEATMAP: Record<string, number> = {
  '2026-06-04': 3, '2026-06-03': 2, '2026-06-02': 4, '2026-06-01': 1,
  '2026-05-31': 2, '2026-05-30': 5, '2026-05-29': 1, '2026-05-28': 3,
  '2026-05-27': 2, '2026-05-25': 1, '2026-05-22': 4, '2026-05-20': 2,
  '2026-05-18': 3, '2026-05-15': 1, '2026-05-12': 2, '2026-05-10': 4,
}

const MOCK_TAGS = [
  { name: 'AI', count: 12 }, { name: '产品思考', count: 8 },
  { name: '反思', count: 6 }, { name: '技术', count: 5 },
  { name: 'Agent', count: 4 }, { name: '习惯', count: 3 },
]

const TAG_COLORS: Record<string, string> = {
  'AI': '#F6A192', '产品思考': '#F9C784', '反思': '#A8D5BA',
  '技术': '#A9C4E4', 'Agent': '#C9B1D9', '习惯': '#F4B9B8',
}

const MOOD_EMOJI: Record<number, string> = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' }

type TabType = 'home' | 'brief' | 'reflection' | 'search'

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [input, setInput] = useState('')
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [notes, setNotes] = useState(MOCK_NOTES)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQ, setSearchQ] = useState('')

  const NAV = [
    { id: 'home', icon: '📔', label: '想法记录' },
    { id: 'brief', icon: '📰', label: 'AI 日报' },
    { id: 'reflection', icon: '🗂️', label: '反思复盘' },
    { id: 'search', icon: '🔍', label: '搜索' },
  ] as const

  const handleAddNote = () => {
    if (!input.trim()) return
    const newNote = {
      id: String(Date.now()),
      content: input,
      type: 'quick',
      mood: selectedMood || 3,
      tags: (input.match(/#[\w\u4e00-\u9fa5]+/g) || []).map(t => t.slice(1)),
      created_at: new Date().toISOString(),
    }
    setNotes(prev => [newNote, ...prev])
    setInput('')
    setSelectedMood(null)
  }

  const filteredNotes = activeTag ? notes.filter(n => n.tags.includes(activeTag)) : notes

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Noto Serif SC', serif", background: '#fdf8f0' }}>
      {/* 侧边栏 */}
      <aside style={{
        width: 220, background: '#f9f0e1', borderRight: '1px solid rgba(74,55,40,.12)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(74,55,40,.12)' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📔</div>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: '1.3rem', color: '#2d2418', fontWeight: 600 }}>我的手账</div>
          <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>horizon@me.com</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(item => {
            const isActive = activeTab === item.id
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                  background: isActive ? '#fffcf5' : 'transparent',
                  border: isActive ? '1px solid rgba(74,55,40,.12)' : '1px solid transparent',
                  boxShadow: isActive ? '0 2px 12px rgba(74,55,40,.08)' : 'none',
                  color: isActive ? '#2d2418' : '#8b7355',
                  fontSize: 14, fontWeight: isActive ? 600 : 400, transition: 'all .2s',
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#e8907a' }} />}
              </div>
            )
          })}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(74,55,40,.12)', fontSize: 12, color: '#8b7355', textAlign: 'center' }}>
          ✦ Demo 预览模式 ✦
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#fdf8f0' }}>

        {/* ===== 想法记录页 ===== */}
        {activeTab === 'home' && (
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h1 style={{ fontFamily: 'Caveat, cursive', fontSize: '2rem', color: '#2d2418', marginBottom: 4 }}>想法记录 ✦</h1>
                <p style={{ color: '#8b7355', fontSize: 14 }}>共记录了 <strong style={{ color: '#e8907a' }}>{notes.length}</strong> 个想法</p>
              </div>
              <div style={{ fontSize: 12, color: '#8b7355' }}>2026年6月4日 星期四</div>
            </div>

            {/* 热力图 */}
            <div style={{ marginBottom: 24, padding: '16px 20px', background: '#fffcf5', borderRadius: 12, border: '1px solid rgba(74,55,40,.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#8b7355' }}>今年共记录 <strong style={{ color: '#e8907a' }}>47</strong> 次</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#c4a882' }}>
                  <span>少</span>
                  {[0,1,2,3,4].map(l => (
                    <div key={l} style={{ width: 10, height: 10, borderRadius: 2, background: ['#e8ddd0','#f9c9be','#f4a494','#e8907a','#d4624e'][l] }} />
                  ))}
                  <span>多</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
                {Array.from({ length: 26 }, (_, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Array.from({ length: 7 }, (_, di) => {
                      const d = new Date(2026, 5, 4); d.setDate(d.getDate() - (25 - wi) * 7 - (6 - di))
                      const key = d.toISOString().split('T')[0]
                      const count = MOCK_HEATMAP[key] || 0
                      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
                      const bg = ['#e8ddd0','#f9c9be','#f4a494','#e8907a','#d4624e'][level]
                      return <div key={di} style={{ width: 12, height: 12, borderRadius: 2, background: bg }} title={`${key}: ${count}条`} />
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 快速输入 */}
            <div style={{
              background: '#fffcf5', borderRadius: 12, border: '1px solid rgba(74,55,40,.08)',
              boxShadow: '0 2px 12px rgba(74,55,40,.08)', padding: 20, marginBottom: 24,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: -2, left: 20, width: 60, height: 4, borderRadius: '0 0 2px 2px', background: '#e8907a', opacity: .7 }} />
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: 15, color: '#8b7355', marginBottom: 12, fontStyle: 'italic' }}>
                今天有什么让你眼前一亮的事？✨
              </p>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="写点什么… 用 #标签 来分类，⌘+Enter 快速保存"
                rows={2}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: '1.5px solid rgba(74,55,40,.2)', padding: '8px 4px',
                  fontFamily: "'Noto Serif SC', serif", fontSize: 15, color: '#4a3728',
                  outline: 'none', resize: 'none', lineHeight: 1.7,
                }}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleAddNote() }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(m => (
                    <button key={m} onClick={() => setSelectedMood(selectedMood === m ? null : m)} style={{
                      width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
                      border: selectedMood === m ? '2px solid #e8907a' : '1.5px solid rgba(74,55,40,.12)',
                      background: selectedMood === m ? '#f5ebe0' : 'transparent',
                    }}>
                      {MOOD_EMOJI[m]}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid rgba(74,55,40,.2)', background: '#fffcf5', color: '#4a3728', fontSize: 13, cursor: 'pointer' }}>
                    📝 长文日记
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!input.trim()}
                    style={{ padding: '6px 18px', borderRadius: 8, background: '#e8907a', border: 'none', color: 'white', fontSize: 13, cursor: 'pointer', opacity: input.trim() ? 1 : .5 }}>
                    记下来 →
                  </button>
                </div>
              </div>
            </div>

            {/* 标签云 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 8 }}>标签 · {MOCK_TAGS.length} 个</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MOCK_TAGS.map(tag => {
                  const isActive = activeTag === tag.name
                  const c = TAG_COLORS[tag.name] || '#F6A192'
                  const size = 11 + (tag.count / 12) * 6
                  return (
                    <button key={tag.name} onClick={() => setActiveTag(isActive ? null : tag.name)} style={{
                      padding: '3px 12px', borderRadius: 20, fontSize: size,
                      background: isActive ? c + '55' : c + '22',
                      border: isActive ? `1.5px solid ${c}` : `1px solid ${c}44`,
                      color: '#4a3728', cursor: 'pointer', fontFamily: "'Noto Serif SC', serif",
                      fontWeight: isActive ? 600 : 400,
                    }}>
                      #{tag.name} <span style={{ opacity: .6, fontSize: 10 }}>{tag.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 时间线 */}
            <div>
              {/* 今天 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem', color: '#2d2418', fontWeight: 600 }}>今天</span>
                <span style={{ fontSize: 12, color: '#c4a882' }}>2026-06-04 · {filteredNotes.filter(n => n.created_at.startsWith('2026-06-04')).length} 条</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(74,55,40,.1)' }} />
              </div>
              {filteredNotes.filter(n => n.created_at.startsWith('2026-06-04')).map((note, i) => (
                <NoteCardDemo key={note.id} note={note} tapeColor={['#e8907a','#8fb89a','#89a8c4'][i % 3]} />
              ))}

              {/* 昨天 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
                <span style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem', color: '#2d2418', fontWeight: 600 }}>昨天</span>
                <span style={{ fontSize: 12, color: '#c4a882' }}>2026-06-03 · {filteredNotes.filter(n => n.created_at.startsWith('2026-06-03')).length} 条</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(74,55,40,.1)' }} />
              </div>
              {filteredNotes.filter(n => n.created_at.startsWith('2026-06-03')).map((note, i) => (
                <NoteCardDemo key={note.id} note={note} tapeColor={['#b09ec9','#d4a843'][i % 2]} />
              ))}
            </div>
          </div>
        )}

        {/* ===== AI 日报页 ===== */}
        {activeTab === 'brief' && (
          <div style={{ display: 'flex', height: '100vh' }}>
            {/* 左列表 */}
            <div style={{ width: 300, borderRight: '1px solid rgba(74,55,40,.1)', background: '#f9f0e1', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(74,55,40,.1)' }}>
                <h1 style={{ fontFamily: 'Caveat, cursive', fontSize: '1.5rem', color: '#2d2418', marginBottom: 4 }}>AI 日报 📰</h1>
                <p style={{ fontSize: 12, color: '#8b7355', marginBottom: 14 }}>共 3 篇日报归档</p>
                <button style={{
                  width: '100%', padding: 10, borderRadius: 10, background: '#e8907a',
                  border: 'none', color: 'white', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  ⚡ 同步今日日报
                </button>
              </div>
              <div style={{ padding: '12px', flex: 1 }}>
                {['2026-06-04', '2026-06-03', '2026-06-02'].map((date, i) => (
                  <div key={date} style={{
                    padding: '12px 14px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                    border: i === 0 ? '1.5px solid #e8907a' : '1px solid transparent',
                    background: i === 0 ? '#fffcf5' : 'transparent',
                  }}>
                    <div style={{ fontSize: 11, color: i === 0 ? '#e8907a' : '#8b7355', marginBottom: 4, fontWeight: i === 0 ? 600 : 400 }}>
                      {i === 0 ? '📅 今天' : date}
                    </div>
                    <div style={{ fontSize: 13, color: '#2d2418', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {['三条线在今天汇聚：AI 独角兽资本化全面加速', 'DeepSeek 融资落地，世界模型赛道集中爆发', 'WWDC 前瞻，苹果 AI 亟待证明自己'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 右详情 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 8 }}>📅 2026年6月4日 星期四 · AI 日报</div>
              <h1 style={{ fontFamily: 'Caveat, cursive', fontSize: '1.7rem', color: '#2d2418', lineHeight: 1.4, marginBottom: 16 }}>
                三条线在今天汇聚：AI 独角兽资本化全面加速
              </h1>
              <div style={{ background: '#f9f0e1', borderLeft: '4px solid #e8907a', borderRadius: '0 10px 10px 0', padding: '14px 18px', fontSize: 14, lineHeight: 1.8, color: '#4a3728', marginBottom: 24 }}>
                今天有三件事同时指向一个信号：AI 独角兽的资本化进程正在全面加速——Anthropic 向 SEC 秘密递交 IPO 招股书、DeepSeek 融资消息集中引爆、宇树科技 73 天极速过会。
              </div>

              {/* 今日速记 */}
              <div style={{ background: 'linear-gradient(135deg,#fff8f0,#fff3eb)', border: '1px solid #f9c9be', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem', color: '#e8907a', marginBottom: 12 }}>🧭 今日 PM 速记</h2>
                {['Anthropic IPO 通道开启 — 接下来 6 个月是 Claude 能力密集发布期，预留快速响应窗口',
                  'DeepSeek 腾讯入股 — 关注微信 AI 助手如何整合 DeepSeek',
                  'Skill 商店窗口期 — 3 个月内决策是否入驻，过了窗口期竞争烈度大幅上升'].map((a, i, arr) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid #fde8e3' : 'none', fontSize: 13, lineHeight: 1.7 }}>
                    <span style={{ color: '#e8907a', flexShrink: 0 }}>📌</span>
                    <span><strong>{a.split(' — ')[0]}</strong> — {a.split(' — ')[1]}</span>
                  </div>
                ))}
              </div>

              {/* 章节 */}
              {[
                { icon: '🔥', label: '最值得关注', color: '#e8907a', bg: '#fef5f3', items: ['Anthropic 秘密提交 IPO 招股书，AI 独角兽 IPO 时代正式开启', 'DeepSeek 融资落地：腾讯 100 亿、宁德时代 50 亿'] },
                { icon: '📦', label: '产品与技术动态', color: '#89a8c4', bg: '#f3f7fc', items: ['Codex 向所有角色和工作流开放', '微软 Build 2026：Windows 正式定位为 Agent 操作系统', '扣子 3.0 发布：手机可远程操控电脑 Agent'] },
              ].map(section => (
                <div key={section.label} style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'Caveat, cursive', fontSize: '1.2rem', color: section.color, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {section.icon} {section.label}
                    <span style={{ fontSize: 11, background: section.bg, border: `1px solid ${section.color}33`, borderRadius: 10, padding: '1px 8px' }}>{section.items.length}</span>
                  </h2>
                  {section.items.map((item, i) => (
                    <div key={i} style={{ background: section.bg, borderLeft: `3px solid ${section.color}`, borderRadius: '0 10px 10px 0', padding: '12px 16px', marginBottom: 10, fontSize: 13, color: '#4a3728', lineHeight: 1.7 }}>
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 反思复盘页 ===== */}
        {activeTab === 'reflection' && (
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <div>
                <h1 style={{ fontFamily: 'Caveat, cursive', fontSize: '2rem', color: '#2d2418', marginBottom: 4 }}>反思复盘 🗂️</h1>
                <p style={{ color: '#8b7355', fontSize: 14 }}>沉淀想法，看见成长</p>
              </div>
              <button style={{ padding: '8px 18px', borderRadius: 8, background: '#e8907a', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer' }}>
                ✍️ 新建复盘
              </button>
            </div>

            {/* 统计卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { value: '47', label: '总记录数', color: '#e8907a' },
                { value: '23', label: '近 30 天', color: '#8fb89a' },
                { value: '😊 4.2', label: '近期平均情绪', color: '#b09ec9' },
              ].map(card => (
                <div key={card.label} style={{ background: '#fffcf5', border: '1px solid rgba(74,55,40,.08)', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 12px rgba(74,55,40,.08)' }}>
                  <div style={{ fontSize: 28, fontFamily: 'Caveat, cursive', color: card.color, fontWeight: 700 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: '#8b7355', marginTop: 4 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* 情绪分布 */}
            <div style={{ background: '#fffcf5', border: '1px solid rgba(74,55,40,.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem', color: '#2d2418', marginBottom: 14 }}>近 30 天情绪分布</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 70 }}>
                {[{m:1,h:15,c:'#c4b5b5'},{m:2,h:25,c:'#d4c4a0'},{m:3,h:40,c:'#8fb89a'},{m:4,h:55,c:'#89a8c4'},{m:5,h:45,c:'#e8907a'}].map(({m,h,c}) => (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 11, color: '#8b7355' }}>{[2,4,8,11,9][m-1]}</div>
                    <div style={{ width: '100%', height: h, background: c, borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                    <div style={{ fontSize: 16 }}>{MOOD_EMOJI[m]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 热门话题 */}
            <div style={{ background: '#fffcf5', border: '1px solid rgba(74,55,40,.08)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem', color: '#2d2418', marginBottom: 12 }}>近 30 天热门话题</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MOCK_TAGS.map(tag => (
                  <div key={tag.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: (TAG_COLORS[tag.name] || '#F6A192') + '33', fontSize: 13 }}>
                    <span>#{tag.name}</span>
                    <span style={{ background: TAG_COLORS[tag.name] || '#F6A192', color: 'white', borderRadius: 10, padding: '0 6px', fontSize: 11 }}>{tag.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== 搜索页 ===== */}
        {activeTab === 'search' && (
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
            <h1 style={{ fontFamily: 'Caveat, cursive', fontSize: '2rem', color: '#2d2418', marginBottom: 24 }}>搜索 🔍</h1>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="搜索你的想法、日记…"
                style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(74,55,40,.2)', background: '#fffcf5', fontSize: 15, fontFamily: "'Noto Serif SC', serif", color: '#4a3728', outline: 'none' }}
                autoFocus
              />
              <button style={{ padding: '12px 20px', borderRadius: 8, background: '#e8907a', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer' }}>搜索</button>
            </div>
            {searchQ ? (
              <div>
                <div style={{ fontSize: 13, color: '#8b7355', marginBottom: 14 }}>
                  找到 <strong style={{ color: '#e8907a' }}>2</strong> 条结果
                </div>
                {MOCK_NOTES.filter(n => n.content.includes(searchQ)).slice(0, 3).map(note => (
                  <div key={note.id} style={{ background: '#fffcf5', border: '1px solid rgba(74,55,40,.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.75, color: '#4a3728' }}>
                      {note.content.replace(searchQ, `<mark style="background:#fef3a0">${searchQ}</mark>`)}
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                      {note.tags.map(t => <span key={t} style={{ padding: '2px 10px', borderRadius: 20, background: (TAG_COLORS[t] || '#F6A192') + '33', fontSize: 12 }}>#{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8b7355' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>✨</div>
                <p style={{ fontFamily: 'Caveat, cursive', fontSize: '1.1rem' }}>输入关键词搜索你的记录</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function NoteCardDemo({ note, tapeColor }: { note: typeof MOCK_NOTES[0], tapeColor: string }) {
  return (
    <div style={{ background: '#fffcf5', border: '1px solid rgba(74,55,40,.08)', borderRadius: 12, padding: '14px 16px 12px', marginBottom: 10, position: 'relative', boxShadow: '0 2px 12px rgba(74,55,40,.06)' }}>
      <div style={{ position: 'absolute', top: -2, left: 20, width: 60, height: 4, borderRadius: '0 0 2px 2px', background: tapeColor, opacity: .7 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: '#f9f0e1', border: '1px solid rgba(74,55,40,.1)', flexShrink: 0, marginTop: 2 }}>
          {MOOD_EMOJI[note.mood]}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: '#4a3728', fontFamily: "'Noto Serif SC', serif", margin: 0, whiteSpace: 'pre-wrap' }}>
            {note.content}
          </p>
          {note.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
              {note.tags.map(tag => (
                <span key={tag} style={{ padding: '2px 10px', borderRadius: 20, background: (TAG_COLORS[tag] || '#F6A192') + '33', fontSize: 12, color: '#4a3728' }}>#{tag}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#c4a882', marginTop: 8 }}>
            {note.created_at.split('T')[1].slice(0, 5)} · 刚刚
          </div>
        </div>
      </div>
    </div>
  )
}
