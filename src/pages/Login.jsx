import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

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
          {mode === 'signin' ? 'سجّل دخولك لإدارة روضاتك' : 'أنشئ حسابًا جديدًا'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            البريد الإلكتروني
            <input className="input" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 6 }} />
          </label>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            كلمة المرور
            <input className="input" type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} style={{ marginTop: 6 }} />
          </label>

          {error && <p style={{ color: '#C1524A', fontSize: 13, fontWeight: 600 }}>{error}</p>}
          {info && <p style={{ color: 'var(--teal)', fontSize: 13, fontWeight: 600 }}>{info}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 6 }}>
            {loading ? 'جارٍ التحميل...' : mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
          style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, width: '100%', textAlign: 'center' }}
        >
          {mode === 'signin' ? 'ليس لديك حساب؟ أنشئ واحدًا' : 'لديك حساب؟ سجّل دخولك'}
        </button>
      </div>
    </div>
  )
}
