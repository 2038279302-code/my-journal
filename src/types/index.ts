export type NoteType = 'quick' | 'diary' | 'reflection'

export type Mood = 1 | 2 | 3 | 4 | 5

export const MOOD_EMOJI: Record<Mood, string> = {
  1: '😔',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🤩',
}

export const MOOD_LABEL: Record<Mood, string> = {
  1: '低落',
  2: '平淡',
  3: '还好',
  4: '不错',
  5: '超棒',
}

export interface Note {
  id: string
  user_id: string
  content: string
  type: NoteType
  mood: Mood | null
  tags: string[]
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface DailyBrief {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  headline: string
  overview: string
  sections: BriefSections
  raw_markdown: string
  created_at: string
}

export interface BriefSection {
  title: string
  items: BriefItem[]
}

export interface BriefItem {
  title: string
  date?: string
  sources?: { label: string; url: string }[]
  content: string
  insight?: string
}

export interface BriefSections {
  highlights: BriefItem[]       // 最值得关注
  products: BriefItem[]         // 产品与技术动态
  industry: BriefItem[]         // 行业与资本动态
  research: BriefItem[]         // 论文与研究
  opinions: BriefItem[]         // 今日观点
  actions: string[]             // 今日速记
}

export interface Tag {
  id: string
  name: string
  color: string
  count: number
}

export interface HeatmapDay {
  date: string
  count: number
}
