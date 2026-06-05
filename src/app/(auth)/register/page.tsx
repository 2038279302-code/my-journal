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
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: '两次密码不一致',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (result.session) {
      // Confirm email 已关闭 → 直接登录，跳转首页
      router.push('/')
      router.refresh()
    } else {
      // 需要邮件验证
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--paper-bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', color: 'var(--ink-dark)' }}>
            验证邮件已发送！
          </h2>
          <p style={{ color: 'var(--ink-muted)', marginTop: '12px', lineHeight: '1.8' }}>
            请查收邮件并点击验证链接，<br />完成后即可开始写手账 ✨
          </p>
          <Link href="/login">
            <button className="btn-journal primary" style={{ marginTop: '24px' }}>
              去登录 →
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--paper-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">📔</div>
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '2rem',
            color: 'var(--ink-dark)',
            fontWeight: 600,
          }}>
            开启新手账
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '14px', marginTop: '6px' }}>
            属于你的私人思考空间
          </p>
        </div>

        <div className="journal-card p-8 tape-sage">
          <h2 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.4rem',
            color: 'var(--ink-dark)',
            marginBottom: '24px',
          }}>
            创建账号 ✦
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '6px' }}>
                密码
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="至少 6 位"
                className="journal-input"
                style={{ fontSize: '15px' }}
              />
              {errors.password && (
                <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '6px' }}>
                确认密码
              </label>
              <input
                {...register('confirm')}
                type="password"
                placeholder="再输一次"
                className="journal-input"
                style={{ fontSize: '15px' }}
              />
              {errors.confirm && (
                <p style={{ color: 'var(--accent-coral)', fontSize: '12px', marginTop: '4px' }}>
                  {errors.confirm.message}
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
              {loading ? '创建中…' : '创建手账 ✨'}
            </button>
          </form>

          <hr className="divider-hand" />

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-muted)' }}>
            已有账号？{' '}
            <Link href="/login" style={{ color: 'var(--accent-coral)', textDecoration: 'none', fontWeight: 500 }}>
              直接登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
