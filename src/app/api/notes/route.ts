import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { extractTags } from '@/lib/utils'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// 标签工具函数：更新 tags 表中的计数
// ============================================================

/**
 * 增加标签计数（新建/编辑新增的标签）
 * 若标签不存在则创建，存在则 count + delta
 */
async function incrementTags(
  supabase: SupabaseClient,
  userId: string,
  tags: string[],
  delta: number
) {
  if (tags.length === 0) return
  for (const tag of tags) {
    // 先查询是否存在
    const { data: existing } = await supabase
      .from('tags')
      .select('id, count')
      .eq('user_id', userId)
      .eq('name', tag)
      .single()

    if (existing) {
      const newCount = Math.max(0, (existing.count || 0) + delta)
      if (newCount <= 0) {
        // 计数归零，删除该标签记录
        await supabase.from('tags').delete().eq('id', existing.id)
      } else {
        await supabase.from('tags').update({ count: newCount }).eq('id', existing.id)
      }
    } else if (delta > 0) {
      // 新增标签
      await supabase
        .from('tags')
        .insert({ user_id: userId, name: tag, color: '#F6A192', count: delta })
    }
  }
}

// GET /api/notes - 获取笔记列表
export async function GET(request: NextRequest) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const tag = searchParams.get('tag')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)
  if (tag) query = query.contains('tags', [tag])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const res = NextResponse.json({ data })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}

// POST /api/notes - 创建笔记
export async function POST(request: NextRequest) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { content, type = 'quick', mood, is_private = true } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
  }

  // 提取唯一标签（避免同一篇重复计数）
  const tags = extractTags(content)

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: user.id, content, type, mood, tags, is_private })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 为每个标签增加计数（+1）
  await incrementTags(supabase, user.id, tags, 1)

  const res = NextResponse.json({ data }, { status: 201 })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}
