(No subject)

omar abduaziz
​You​
import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Children from './pages/Children'
import Attendance from './pages/Attendance'
import Teachers from './pages/Teachers'
import Fees from './pages/Fees'
import Programs from './pages/Programs'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import KindergartenModal from './components/KindergartenModal'

const NAV = [
  { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
  { id: 'children', label: 'الأطفال', icon: '🧒' },
  { id: 'attendance', label: 'الحضور', icon: '📋' },
  { id: 'teachers', label: 'المعلمون', icon: '👩' },
  { id: 'fees', label: 'الرسوم', icon: '💰' },
  { id: 'programs', label: 'البرامج', icon: '📚' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function App() {
  const [session, setSession] = useState(undefined)
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
    <div className="app-shell">
      <aside className="sidebar">
        <button onClick={() => setKgModalOpen(true)} className="sidebar-kg-btn">
          <div className="kg-icon">🏫</div>
          <div style={{ minWidth: 0 }}>
            <div className="disp kg-name">{activeKg?.name}</div>
            <div className="kg-sub">تبديل الروضة {kindergartens.length > 1 && `· ${kindergartens.length}`}</div>
          </div>
        </button>

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)} className={`sidebar-link ${tab === n.id ? 'active' : ''}`}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <button onClick={() => supabase.auth.signOut()} className="sidebar-logout">تسجيل الخروج</button>
      </aside>

      <div className="mobile-topbar">
        <button onClick={() => setKgModalOpen(true)} className="mobile-kg-btn">
          🏫 {activeKg?.name}
        </button>
        <button onClick={() => supabase.auth.signOut()} className="mobile-logout-btn">خروج</button>
      </div>

      <main className="main-content">
        {tab === 'dashboard' && <Dashboard {...pageProps} />}
        {tab === 'children' && <Children {...pageProps} />}
        {tab === 'attendance' && <Attendance {...pageProps} />}
        {tab === 'teachers' && <Teachers {...pageProps} />}
        {tab === 'fees' && <Fees {...pageProps} />}
        {tab === 'programs' && <Programs {...pageProps} />}
        {tab === 'reports' && <Reports {...pageProps} />}
        {tab === 'settings' && (
          <Settings
            kindergarten={activeKg}
            onUpdated={() => loadKindergartens(session.user.id)}
          />
        )}
      </main>

      <nav className="mobile-bottomnav">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} className={`mobile-nav-item ${tab === n.id ? 'active' : ''}`}>
            <span className="mobile-nav-icon">{n.icon}</span>
            <span className="mobile-nav-label">{n.label}</span>
          </button>
        ))}
      </nav>

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
