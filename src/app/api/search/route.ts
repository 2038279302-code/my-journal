import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

// GET /api/search
// 支持参数：q（内容关键词）、tag（标签）、type（记录类型）、
//           date_from（起始日期 YYYY-MM-DD）、date_to（结束日期）
export async function GET(request: NextRequest) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const tag = searchParams.get('tag')?.trim()
  const type = searchParams.get('type')?.trim()
  const dateFrom = searchParams.get('date_from')?.trim()
  const dateTo = searchParams.get('date_to')?.trim()

  // 至少需要一个筛选条件
  if (!q && !tag && !type && !dateFrom && !dateTo) {
    return NextResponse.json({ data: [] })
  }

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // 按内容关键词搜索（使用 ilike，同时也匹配标签文本）
  if (q) {
    // 同时搜索内容中的关键词（ilike 对中文友好，不需要全文索引）
    query = query.ilike('content', `%${q}%`)
  }

  // 按标签过滤（PostgreSQL 数组包含查询）
  if (tag) {
    query = query.contains('tags', [tag])
  }

  // 按记录类型过滤
  if (type && ['quick', 'diary', 'reflection'].includes(type)) {
    query = query.eq('type', type)
  }

  // 按时间范围过滤
  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 若按标签搜索，同时搜索标签字段（已经通过 contains 处理）
  // 若有 q，还需额外找出 tags 数组中包含 q 的记录（标签名匹配）
  // 目前由于 ilike 只搜索 content，单独做标签匹配的结果合并
  let finalData = data || []
  if (q && !tag) {
    // 额外：通过标签数组搜索包含关键词的条目（如果 q 出现在某个 tag 名中）
    const { data: tagMatched } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .contains('tags', [q]) // 精确标签名匹配
      .order('created_at', { ascending: false })
      .limit(20)

    if (tagMatched && tagMatched.length > 0) {
      // 合并并去重
      const ids = new Set(finalData.map((n: { id: string }) => n.id))
      for (const n of tagMatched) {
        if (!ids.has(n.id)) {
          finalData.push(n)
          ids.add(n.id)
        }
      }
      // 重新排序
      finalData.sort((a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
  }

  const res = NextResponse.json({ data: finalData })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}
