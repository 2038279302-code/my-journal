import { createClient } from '@/lib/supabase/server'
import ReflectionClient from '@/components/reflection/ReflectionClient'

export default async function ReflectionPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session!.user.id

  const { data: reflections } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'reflection')
    .order('created_at', { ascending: false })

  // 获取统计数据
  const { count: totalNotes } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  // 近 30 天的笔记（用于生成周/月统计）
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: recentNotes } = await supabase
    .from('notes')
    .select('created_at, mood, tags, type')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  return (
    <ReflectionClient
      reflections={reflections || []}
      totalNotes={totalNotes || 0}
      recentNotes={recentNotes || []}
    />
  )
}
