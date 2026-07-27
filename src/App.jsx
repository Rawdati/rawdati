import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Children from './pages/Children'
import Attendance from './pages/Attendance'
import Teachers from './pages/Teachers'
import Fees from './pages/Fees'
import Programs from './pages/Programs'
import Settings from './pages/Settings'
import KindergartenModal from './components/KindergartenModal'

const NAV = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'children', label: 'الأطفال' },
  { id: 'attendance', label: 'حضور الأطفال' },
  { id: 'teachers', label: 'المعلمون' },
  { id: 'fees', label: 'الرسوم' },
  { id: 'programs', label: 'البرامج' },
  { id: 'settings', label: 'الإعدادات' },
]

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [kindergartens, setKindergartens] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [kgModalOpen, setKgModalOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadKindergartens = useCallback(async (userId) => {
    let { data, error } = await supabase.from('kindergartens').select('*').order('created_at')
    if (error) { console.error(error); return }
    if (!data || data.length === 0) {
      const { data: created, error: insErr } = await supabase
        .from('kindergartens')
        .insert({ owner_id: userId, name: 'الروضة الأولى' })
        .select()
        .single()
      if (insErr) { console.error(insErr); return }
      data = [created]
    }
    setKindergartens(data)
    setActiveId((prev) => prev && data.find((k) => k.id === prev) ? prev : data[0].id)
    setReady(true)
  }, [])

  useEffect(() => {
    if (session) loadKindergartens(session.user.id)
  }, [session, loadKindergartens])

  if (session === undefined) return <FullScreenLoader />
  if (!session) return <Login />
  if (!ready) return <FullScreenLoader />

  const activeKg = kindergartens.find((k) => k.id === activeId)

  const pageProps = { kindergartenId: activeId, levelNames: activeKg?.level_names || {} }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--teal-dark)', color: '#fff',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        <button onClick={() => setKgModalOpen(true)} style={{
          background: 'none', border: 'none', color: '#fff', textAlign: 'right',
          display: 'flex', alignItems: 'center', gap: 10, padding: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, color: 'var(--teal-dark)',
          }}>🏫</div>
          <div style={{ minWidth: 0 }}>
            <div className="disp" style={{ fontWeight: 800, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeKg?.name}
            </div>
            <div style={{ fontSize: 12, opacity: .7 }}>تبديل الروضة {kindergartens.length > 1 && `· ${kindergartens.length}`}</div>
          </div>
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              textAlign: 'right', padding: '10px 12px', borderRadius: 10, border: 'none',
              background: tab === n.id ? 'rgba(255,255,255,0.14)' : 'transparent',
              color: tab === n.id ? '#fff' : 'rgba(255,255,255,0.72)', fontWeight: 600, fontSize: 14,
            }}>
              {n.label}
            </button>
          ))}
        </nav>

        <button onClick={() => supabase.auth.signOut()} style={{
          marginTop: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: 13, textAlign: 'right', padding: 0,
        }}>
          تسجيل الخروج
        </button>
      </aside>

      <main style={{ flex: 1, padding: 28, maxWidth: '100%', overflowX: 'hidden' }}>
        {tab === 'dashboard' && <Dashboard {...pageProps} />}
        {tab === 'children' && <Children {...pageProps} />}
        {tab === 'attendance' && <Attendance {...pageProps} />}
        {tab === 'teachers' && <Teachers {...pageProps} />}
        {tab === 'fees' && <Fees {...pageProps} />}
        {tab === 'programs' && <Programs {...pageProps} />}
        {tab === 'settings' && (
          <Settings
            kindergarten={activeKg}
            onUpdated={() => loadKindergartens(session.user.id)}
          />
        )}
      </main>

      {kgModalOpen && (
        <KindergartenModal
          kindergartens={kindergartens}
          activeId={activeId}
          userId={session.user.id}
          onClose={() => setKgModalOpen(false)}
          onSwitch={(id) => { setActiveId(id); setKgModalOpen(false) }}
          onChanged={() => loadKindergartens(session.user.id)}
        />
      )}
    </div>
  )
}

function FullScreenLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div style={{ color: 'var(--teal)', fontWeight: 700 }}>...جارٍ التحميل</div>
    </div>
  )
}
