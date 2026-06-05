'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 位'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError('邮箱或密码错误，请重试')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo 区 */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">📔</div>
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '2rem',
            color: 'var(--ink-dark)',
            fontWeight: 600,
          }}>
            我的手账
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '14px', marginTop: '6px' }}>
            记录生活，沉淀思考
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="journal-card p-8 tape-coral">
          <h2 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.4rem',
            color: 'var(--ink-dark)',
            marginBottom: '24px',
          }}>
            欢迎回来 ✦
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: 'var(--ink-muted)',
                marginBottom: '6px',
                fontFamily: 'var(--font-serif)',
              }}>
                邮箱
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="your@email.com"
                className="journal-input"
                style={{ fontSize: '15px' }}
              />
              {errors.email && (
                <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: 'var(--ink-muted)',
                marginBottom: '6px',
                fontFamily: 'var(--font-serif)',
              }}>
                密码
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="journal-input"
                style={{ fontSize: '15px' }}
              />
              {errors.password && (
                <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div style={{
                background: '#fef2f0',
                border: '1px solid #f9c9be',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: 'var(--accent-coral)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-journal primary w-full"
              style={{ marginTop: '8px', padding: '12px', fontSize: '15px' }}
            >
              {loading ? '登录中…' : '进入手账 →'}
            </button>
          </form>

          <hr className="divider-hand" />

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-muted)' }}>
            还没有账号？{' '}
            <Link href="/register" style={{ color: 'var(--accent-coral)', textDecoration: 'none', fontWeight: 500 }}>
              创建一本新手账
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
