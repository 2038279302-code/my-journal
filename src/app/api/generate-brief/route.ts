import { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { parseBriefMarkdown } from '@/lib/utils'

// 信息源配置
const SOURCES = [
  { name: 'follow-builders X feed', url: 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json', type: 'json' },
  { name: 'follow-builders Blogs feed', url: 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json', type: 'json' },
  { name: 'OpenAI 官方博客', url: 'https://openai.com/blog', type: 'web' },
  { name: 'Anthropic 官方博客', url: 'https://www.anthropic.com/news', type: 'web' },
  { name: '36氪 AI', url: 'https://36kr.com/information/AI/', type: 'web' },
  { name: '量子位', url: 'https://www.qbitai.com/', type: 'web' },
  { name: '机器之心', url: 'https://www.jiqizhixin.com/', type: 'web' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/front', type: 'web' },
]

// SSE helper
function sseMsg(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

// 抓取单个 URL（带超时）
async function fetchSource(url: string, timeoutMs = 10000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JournalBot/1.0)' },
    })
    if (!res.ok) return ''
    const text = await res.text()
    return text.slice(0, 8000) // 单个源最多取 8000 字符，防止 token 爆炸
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

// 构建给 AI 的 Prompt
function buildPrompt(date: string, rawContents: Array<{ name: string; content: string }>) {
  const sourcesBlock = rawContents
    .filter(s => s.content.trim())
    .map(s => `### 来源：${s.name}\n${s.content.trim().slice(0, 3000)}`)
    .join('\n\n---\n\n')

  return `今天是 ${date}。你是一位专业的 AI 产品经理，需要根据以下从各信息源抓取到的原始内容，生成一份高质量的中文 AI 日报。

## 要求
1. 严格基于提供的原始内容，不得凭空捏造任何新闻
2. 按重要性排序，筛选最有价值的 AI 动态
3. 每条内容必须能在原始内容中找到对应信息
4. 语言流畅自然，像一位懂 AI 的产品经理朋友娓娓道来

## 输出格式（严格遵守）

# 【AI 日报】${date} · {一句话概括今天最重要的事}

## 今日概览
（2-3 句话总结今日 AI 领域整体氛围和最核心事件）

## 🔥 最值得关注
（1-3 条真正重磅消息，每条包含：标题、\`日期\` · 来源、发生了什么、PM 视角分析）

### {标题}
\`${date}\` · 来源：[{媒体名}]({url})

**发生了什么：** {客观描述}

**PM 视角：** {深度分析，包含直接影响、推导结论、行动建议}

---

## 📦 产品与技术动态
（3-5 条，格式同上，简洁描述 + PM 启示）

## 📰 行业与资本动态
（2-3 条，融资/并购/监管等）

## 💡 今日观点
（1-2 条头部 AI Builder 的有价值观点）

## 🧭 今日 AI 产品决策速记
（3-5 条，格式：- 📌 **结论** — 建议动作）

---
*本日报由 AI 自动生成 | 生成时间：${new Date().toLocaleString('zh-CN')}*
*⚠️ 如发现内容异常，请以原文链接为准*

## 原始内容（仅供参考）

${sourcesBlock}

现在请生成日报，只输出日报正文 Markdown，不要有任何额外说明：`
}

export async function GET(request: NextRequest) {
  // 鉴权
  const { supabase } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const apiKey = process.env.AI_API_KEY
  const apiBase = process.env.AI_API_BASE_URL || 'https://bobapi.cn/v1'
  const model = process.env.AI_MODEL || 'claude-sonnet-4-5'

  if (!apiKey) {
    return new Response(
      sseMsg('error', { message: '未配置 AI_API_KEY，请在 .env.local 中填写你的 BobAPI Key' }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseMsg(event, data)))
      }

      try {
        // Step 1: 并行抓取信息源
        send('progress', { step: 'fetch', message: '正在抓取各信息源内容…', total: SOURCES.length, done: 0 })

        const results = await Promise.allSettled(
          SOURCES.map(s => fetchSource(s.url).then(content => ({ name: s.name, content })))
        )

        const rawContents: Array<{ name: string; content: string }> = []
        let doneCount = 0
        for (const r of results) {
          doneCount++
          if (r.status === 'fulfilled' && r.value.content.trim()) {
            rawContents.push(r.value)
            send('progress', { step: 'fetch', message: `已抓取：${r.value.name}`, total: SOURCES.length, done: doneCount })
          } else {
            const name = r.status === 'fulfilled' ? r.value.name : '未知来源'
            send('progress', { step: 'fetch', message: `跳过（无内容）：${name}`, total: SOURCES.length, done: doneCount })
          }
        }

        if (rawContents.length === 0) {
          send('error', { message: '所有信息源抓取失败，请检查网络连接' })
          controller.close()
          return
        }

        send('progress', { step: 'generate', message: `共抓取 ${rawContents.length} 个信息源，正在调用 AI 生成日报…` })

        // Step 2: 调用 AI 生成日报（流式）
        const prompt = buildPrompt(date, rawContents)

        const aiRes = await fetch(`${apiBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            stream: true,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!aiRes.ok) {
          const errText = await aiRes.text()
          send('error', { message: `AI 接口调用失败（${aiRes.status}）：${errText.slice(0, 200)}` })
          controller.close()
          return
        }

        // Step 3: 流式读取 AI 输出
        const reader = aiRes.body?.getReader()
        if (!reader) {
          send('error', { message: 'AI 响应流为空' })
          controller.close()
          return
        }

        let fullMarkdown = ''
        const dec = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue
            try {
              const chunk = JSON.parse(raw)
              const delta = chunk.choices?.[0]?.delta?.content || ''
              if (delta) {
                fullMarkdown += delta
                send('chunk', { delta })
              }
            } catch {
              // 忽略解析失败的 chunk
            }
          }
        }

        if (!fullMarkdown.trim()) {
          send('error', { message: 'AI 未生成任何内容，请重试' })
          controller.close()
          return
        }

        // Step 4: 存入 Supabase
        send('progress', { step: 'save', message: '正在保存到数据库…' })

        const { headline, overview, actions } = parseBriefMarkdown(fullMarkdown)
        const sections = parseSections(fullMarkdown)

        const { data: savedBrief, error: dbErr } = await supabase
          .from('daily_briefs')
          .upsert({
            user_id: user.id,
            date,
            headline: headline || `${date} AI 日报`,
            overview,
            sections: { ...sections, actions },
            raw_markdown: fullMarkdown,
          }, { onConflict: 'user_id,date' })
          .select()
          .single()

        if (dbErr) {
          send('error', { message: `保存失败：${dbErr.message}` })
          controller.close()
          return
        }

        send('done', { brief: savedBrief, message: `✅ ${date} 日报已生成并保存` })
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : '未知错误' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ---------- 章节解析（与 sync-brief 保持一致）----------

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
    for (const [key, sectionKey] of Object.entries(sectionMap)) {
      if (line.startsWith('## ') && line.includes(key)) {
        if (currentItem && currentSection) { sections[currentSection].push(currentItem); currentItem = null }
        currentSection = sectionKey
        break
      }
    }
    if (line.startsWith('## ') && !Object.keys(sectionMap).some(k => line.includes(k))) {
      if (currentItem && currentSection) { sections[currentSection].push(currentItem); currentItem = null }
      currentSection = null
    }
    if (line.startsWith('### ') && currentSection) {
      if (currentItem) sections[currentSection].push(currentItem)
      currentItem = { title: line.replace('### ', '').trim(), content: '' }
    }
    if (currentItem && line.match(/^`\d{4}-\d{2}-\d{2}`/)) {
      currentItem.date = line.match(/`(\d{4}-\d{2}-\d{2})`/)?.[1]
    }
    if (currentItem && !line.startsWith('### ') && !line.startsWith('## ') && line.trim() !== '---') {
      currentItem.content += (currentItem.content ? '\n' : '') + line
    }
  }
  if (currentItem && currentSection) sections[currentSection].push(currentItem)
  return sections
}
