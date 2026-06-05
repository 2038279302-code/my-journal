import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return '今天'
  if (isYesterday(date)) return '昨天'
  return format(date, 'M月d日', { locale: zhCN })
}

export function formatFullDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy年M月d日 EEEE', { locale: zhCN })
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: zhCN })
}

export function formatTimeOnly(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm')
}

export function extractTags(content: string): string[] {
  const matches = content.match(/#[\w\u4e00-\u9fa5]+/g) || []
  return [...new Set(matches.map(t => t.slice(1)))]
}

export function stripTags(content: string): string {
  return content.replace(/#[\w\u4e00-\u9fa5]+/g, '').trim()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

// 生成随机手账提示语
const PROMPTS = [
  '今天有什么让你眼前一亮的事？✨',
  '此刻脑子里转的是什么？',
  '有什么想法值得记下来？📝',
  '今天学到了什么新东西？',
  '有什么事情让你感到满足？',
  '现在最想做的一件事是？',
  '今天看到了什么有趣的东西？',
  '有什么困惑在心里绕？把它写出来。',
  '如果今天只能说一件事，是什么？',
  '有什么小小的发现想记下来？',
]

export function getDailyPrompt(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return PROMPTS[dayOfYear % PROMPTS.length]
}

// XML 解析日报
export function parseBriefXML(xml: string) {
  const markdownMatch = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  if (!markdownMatch) return null
  return markdownMatch[1].trim()
}

// 从 Markdown 日报中提取结构化数据
export function parseBriefMarkdown(markdown: string) {
  const lines = markdown.split('\n')
  
  // 提取标题行的副标题
  const headlineLine = lines.find(l => l.startsWith('# '))
  const headline = headlineLine 
    ? headlineLine.replace(/^#\s+【AI 日报】\d{4}-\d{2}-\d{2}\s*·?\s*/, '').trim()
    : ''

  // 提取今日概览
  const overviewStart = lines.findIndex(l => l.includes('今日概览'))
  let overview = ''
  if (overviewStart !== -1) {
    for (let i = overviewStart + 2; i < lines.length; i++) {
      if (lines[i].startsWith('---') || lines[i].startsWith('#')) break
      if (lines[i].trim()) overview += lines[i] + ' '
    }
  }

  // 提取今日速记（action items）
  const actionsStart = lines.findIndex(l => l.includes('今日 AI 产品决策速记') || l.includes('今日速记'))
  const actions: string[] = []
  if (actionsStart !== -1) {
    for (let i = actionsStart + 1; i < lines.length; i++) {
      if (lines[i].startsWith('#')) break
      const match = lines[i].match(/^-\s+📌\s+(.+)/)
      if (match) actions.push(match[1])
    }
  }

  return {
    headline: headline.trim(),
    overview: overview.trim(),
    actions,
  }
}

// tag 颜色池（手账风暖色）
const TAG_COLORS = [
  '#F6A192', '#F9C784', '#A8D5BA', '#A9C4E4', '#C9B1D9',
  '#F4B9B8', '#B5D5C5', '#FDD5B1', '#C4D7F4', '#E8C4B8',
]

export function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}
