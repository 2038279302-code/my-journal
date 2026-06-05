import { createClient } from '@/lib/supabase/server'
import DailyBriefClient from '@/components/brief/DailyBriefClient'

export default async function DailyBriefPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session!.user.id

  const { data: briefs } = await supabase
    .from('daily_briefs')
    .select('id, date, headline, overview, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)

  // 今日日报（如果有）
  const today = new Date().toISOString().split('T')[0]
  const { data: todayBrief } = await supabase
    .from('daily_briefs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  return (
    <DailyBriefClient
      initialBriefs={briefs || []}
      todayBrief={todayBrief || null}
    />
  )
}
