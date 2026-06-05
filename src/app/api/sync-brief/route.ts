import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { parseBriefXML, parseBriefMarkdown } from '@/lib/utils'

// POST /api/sync-brief
// 支持两种方式同步日报：
//   方式1：body 中直接传 { markdown: "..." }（推荐，Skill 直接 POST）
//   方式2：body 中传 { date: "YYYY-MM-DD" }，从本地 /tmp/ai-daily-brief-{date}.xml 读取（本地开发）
export async function POST(request: NextRequest) {
  const { supabase } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { date, markdown: rawMarkdown, xml: rawXml } = body

  const targetDate = date || new Date().toISOString().split('T')[0]

  let markdown: string | null = null

  // 优先使用直接传入的 markdown 内容
  if (rawMarkdown && typeof rawMarkdown === 'string') {
    markdown = rawMarkdown.trim()
  }
  // 其次尝试解析传入的 xml 内容
  else if (rawXml && typeof rawXml === 'string') {
    markdown = parseBriefXML(rawXml)
  }
  // 最后尝试从本地 /tmp 文件读取（仅本地开发有效）
  else {
    try {
      const { readFileSync, existsSync } = await import('fs')
      const filePath = `/tmp/ai-daily-brief-${targetDate}.xml`
      if (existsSync(filePath)) {
        const xmlContent = readFileSync(filePath, 'utf-8')
        markdown = parseBriefXML(xmlContent)
      }
    } catch {
      // 文件系统不可用（如 Vercel Edge Runtime），忽略
    }
  }

  if (!markdown) {
    return NextResponse.json(
      {
        error: '未找到日报内容。请通过以下方式之一提供内容：\n1. 在请求 body 中传入 { markdown: "..." }\n2. 在请求 body 中传入 { xml: "..." }\n3. 本地开发时传入 { date: "YYYY-MM-DD" }（需 /tmp/ai-daily-brief-{date}.xml 存在）',
      },
      { status: 400 }
    )
  }

  // 从 Markdown 提取结构化数据
  const { headline, overview, actions } = parseBriefMarkdown(markdown)

  // 解析各个章节
  const sections = parseSections(markdown)

  // 写入 Supabase（upsert by date）
  const { data, error } = await supabase
    .from('daily_briefs')
    .upsert({
      user_id: user.id,
      date: targetDate,
      headline: headline || `${targetDate} AI 日报`,
      overview,
      sections: { ...sections, actions },
      raw_markdown: markdown,
    }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, message: `✅ ${targetDate} 日报同步成功` })
}

function parseSections(markdown: string) {
  const sections: Record<string, unknown[]> = {
    highlights: [],
    products: [],
    industry: [],
    research: [],
    opinions: [],
  }

  const sectionMap: Record<string, keyof typeof sections> = {
    '最值得关注': 'highlights',
    '产品与技术': 'products',
    '行业与资本': 'industry',
    '论文与研究': 'research',
    '今日观点': 'opinions',
  }

  const lines = markdown.split('\n')
  let currentSection: keyof typeof sections | null = null
  let currentItem: { title: string; content: string; date?: string } | null = null

  for (const line of lines) {
    // 检测章节标题
    for (const [key, sectionKey] of Object.entries(sectionMap)) {
      if (line.includes(key) && line.startsWith('## ')) {
        // 保存上一个条目
        if (currentItem && currentSection) {
          sections[currentSection].push(currentItem)
          currentItem = null
        }
        currentSection = sectionKey
        break
      }
    }

    // 遇到其他 H2（如 今日概览、今日 AI 产品决策速记），重置 currentSection 避免内容污染
    if (line.startsWith('## ') && !Object.keys(sectionMap).some(k => line.includes(k))) {
      if (currentItem && currentSection) {
        sections[currentSection].push(currentItem)
        currentItem = null
      }
      currentSection = null
    }

    // 检测条目标题
    if (line.startsWith('### ') && currentSection) {
      if (currentItem) {
        sections[currentSection].push(currentItem)
      }
      currentItem = { title: line.replace('### ', '').trim(), content: '' }
    }

    // 提取日期
    if (currentItem && line.match(/^`\d{4}-\d{2}-\d{2}`/)) {
      currentItem.date = line.match(/`(\d{4}-\d{2}-\d{2})`/)?.[1]
    }

    // 累积内容（跳过分隔线）
    if (currentItem && !line.startsWith('### ') && !line.startsWith('## ') && line.trim() !== '---') {
      currentItem.content += (currentItem.content ? '\n' : '') + line
    }
  }

  // 推入最后一个条目
  if (currentItem && currentSection) {
    sections[currentSection].push(currentItem)
  }

  return sections
}
