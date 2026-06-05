import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { supabase, response } = createRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('count', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const res = NextResponse.json({ data })
  response.cookies.getAll().forEach(({ name, value, ...opts }) => res.cookies.set(name, value, opts))
  return res
}
