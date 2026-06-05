import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { extractTags } from '@/lib/utils'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// 标签工具函数（与 route.ts 共享逻辑，保持一致）
// ============================================================
async function incrementTags(
  supabase: SupabaseClient,
  userId: string,
  tags: string[],
  delta: number
) {
  if (tags.length === 0) return
  for (const tag of tags) {
    const { data: existing } = await supabase
      .from('tags')
      .select('id, count')
      .eq('user_id', userId)
      .eq('name', tag)
      .single()

    if (existing) {
      const newCount = Math.max(0, (existing.count || 0) + delta)
      if (newCount <= 0) {
        await supabase.from('tags').delete().eq('id', existing.id)
      } else {
        await supabase.from('tags').update({ count: newCount }).eq('id', existing.id)
      }
    } else if (delta > 0) {
      await supabase
        .from('tags')
        .insert({ user_id: userId, name: tag, color: '#F6A192', count: delta })
    }
  }
}

// GET /api/notes/:id - 获取单条笔记
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const res = NextResponse.json({ data })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}

// PATCH /api/notes/:id - 更新笔记
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // 先获取原始记录，用于计算标签变化
  const { data: oldNote } = await supabase
    .from('notes')
    .select('tags')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.content !== undefined) {
    updates.content = body.content
    // 提取新标签（去重）
    updates.tags = extractTags(body.content)
  }
  if (body.mood !== undefined) updates.mood = body.mood
  if (body.type !== undefined) updates.type = body.type
  if (body.is_private !== undefined) updates.is_private = body.is_private

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 同步标签计数：计算新增的标签和移除的标签
  if (body.content !== undefined && oldNote) {
    const oldTags: string[] = oldNote.tags || []
    const newTags: string[] = (updates.tags as string[]) || []

    // 找出新增标签（在新标签中但不在旧标签中）
    const addedTags = newTags.filter(t => !oldTags.includes(t))
    // 找出移除标签（在旧标签中但不在新标签中）
    const removedTags = oldTags.filter(t => !newTags.includes(t))

    await incrementTags(supabase, user.id, addedTags, 1)
    await incrementTags(supabase, user.id, removedTags, -1)
  }

  const res = NextResponse.json({ data })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}

// DELETE /api/notes/:id - 删除笔记
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // 先获取记录的标签，用于更新计数
  const { data: note } = await supabase
    .from('notes')
    .select('tags')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 删除后，减少该记录所有标签的计数
  if (note && note.tags && note.tags.length > 0) {
    await incrementTags(supabase, user.id, note.tags as string[], -1)
  }

  const res = NextResponse.json({ success: true })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}
