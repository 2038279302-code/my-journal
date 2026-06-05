import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

// GET /api/briefs - 获取日报列表
export async function GET(request: NextRequest) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const date = searchParams.get('date')

  if (date) {
    // 获取特定日期的日报
    const { data, error } = await supabase
      .from('daily_briefs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()
    if (error) return NextResponse.json({ data: null })
    return NextResponse.json({ data })
  }

  const { data, error } = await supabase
    .from('daily_briefs')
    .select('id, date, headline, overview, created_at')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const res = NextResponse.json({ data })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}
