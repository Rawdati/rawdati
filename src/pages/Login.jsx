import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        switchMode('reset')
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const switchMode = (next) => {
    setMode(next)
    setEmail('')
    setPassword('')
    setNewPassword('')
    setShowPassword(false)
    setError('')
    setInfo('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfo('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل دخولك.')
        setMode('signin')
        setEmail('')
        setPassword('')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setInfo('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.')
      } else if (mode === 'reset') {
        if (newPassword.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
        setInfo('تم تغيير كلمة المرور بنجاح! يمكنك الآن استخدام التطبيق.')
        setNewPassword('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    signin: 'سجّل دخولك لإدارة روضاتك',
    signup: 'أنشئ حسابًا جديدًا',
    forgot: 'أدخل بريدك لاستعادة كلمة المرور',
    reset: 'أدخل كلمة المرور الجديدة',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--teal-dark), var(--teal))', padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 28 }}>
        <h1 className="disp" style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>
          روضتي
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
          {titles[mode]}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode !== 'reset' && (
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              البريد الإلكتروني
              <input className="input" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 6 }} />
            </label>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              كلمة المرور
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)',
                  }}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
          )}

          {mode === 'reset' && (
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              كلمة المرور الجديدة
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted)',
                  }}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
          )}

          {mode === 'signin' && (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12.5, fontWeight: 600, textAlign: 'left', padding: 0, cursor: 'pointer' }}
            >
              نسيت كلمة المرور؟
            </button>
          )}

          {error && <p style={{ color: '#C1524A', fontSize: 13, fontWeight: 600 }}>{error}</p>}
          {info && <p style={{ color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}>{info}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 6 }}>
            {loading ? 'جارٍ التحميل...' :
              mode === 'signin' ? 'تسجيل الدخول' :
              mode === 'signup' ? 'إنشاء حساب' :
              mode === 'forgot' ? 'إرسال رابط الاستعادة' :
              'تغيير كلمة المرور'}
          </button>
        </form>

        {mode === 'signin' && (
          <button
            onClick={() => switchMode('signup')}
            style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center' }}
          >
            ليس لديك حساب؟ أنشئ واحدًا
          </button>
        )}
        {mode === 'signup' && (
          <button
            onClick={() => switchMode('signin')}
            style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center' }}
          >
            لديك حساب؟ سجّل دخولك
          </button>
        )}
        {mode === 'forgot' && (
          <button
            onClick={() => switchMode('signin')}
            style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center' }}
          >
            الرجوع لتسجيل الدخول
          </button>
        )}
      </div>
    </div>
  )
}
