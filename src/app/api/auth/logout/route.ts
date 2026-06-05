import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { supabase } = createRouteClient(request)
  await supabase.auth.signOut()
  const origin = request.nextUrl.origin
  return NextResponse.redirect(new URL('/login', origin))
}
