import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/notes/HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  // layout 已经保证了 session 存在，直接用 getSession（无网络请求）
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session!.user.id

  // 获取初始笔记
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // 获取热力图数据（近365天）
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const { data: heatmapNotes } = await supabase
    .from('notes')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', yearAgo.toISOString())

  const heatmap: Record<string, number> = {}
  for (const n of heatmapNotes || []) {
    const day = n.created_at.split('T')[0]
    heatmap[day] = (heatmap[day] || 0) + 1
  }

  // 获取所有标签
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('count', { ascending: false })
    .limit(30)

  return (
    <HomeClient
      initialNotes={notes || []}
      initialHeatmap={heatmap}
      initialTags={tags || []}
    />
  )
}
