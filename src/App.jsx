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
import Backup from './pages/Backup'
import Subscriptions from './pages/Subscriptions'
import KindergartenModal from './components/KindergartenModal'

const NAV = [
  { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
  { id: 'children', label: 'الأطفال', icon: '🧒' },
  { id: 'attendance', label: 'الحضور', icon: '📋' },
  { id: 'teachers', label: 'المعلمون', icon: '👩' },
  { id: 'fees', label: 'الرسوم', icon: '💰' },
  { id: 'subscriptions', label: 'ملخص الاشتراكات', icon: '🗓️' },
  { id: 'programs', label: 'البرامج', icon: '📚' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: '💾' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]

const REMINDER_KEY = 'rawdati_backup_reminder_dismissed_at'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default function App() {
  const [session, setSession] = useState(undefined)
  const [kindergartens, setKindergartens] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [kgModalOpen, setKgModalOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [showBackupReminder, setShowBackupReminder] = useState(false)
  const [childrenLevelFilter, setChildrenLevelFilter] = useState(null)

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

  useEffect(() => {
    if (!ready) return
    try {
      const last = localStorage.getItem(REMINDER_KEY)
      const now = Date.now()
      if (!last || now - parseInt(last, 10) > WEEK_MS) {
        setShowBackupReminder(true)
      }
    } catch (e) {
      setShowBackupReminder(true)
    }
  }, [ready])

  const dismissReminder = () => {
    try { localStorage.setItem(REMINDER_KEY, Date.now().toString()) } catch (e) {}
    setShowBackupReminder(false)
  }

  const goToBackupFromReminder = () => {
    dismissReminder()
    setTab('backup')
  }

  const goToChildrenWithLevel = (levelId) => {
    setChildrenLevelFilter(levelId)
    setTab('children')
  }

  if (session === undefined) return <FullScreenLoader />
  if (!session) return <Login />
  if (!ready) return <FullScreenLoader />

  const activeKg = kindergartens.find((k) => k.id === activeId)
  const pageProps = { kindergartenId: activeId, levelNames: activeKg?.level_names || {} }

  return (
    <div className="app-shell">
      {showBackupReminder && (
        <div style={{
          position: 'fixed', top: 0, insetInline: 0, zIndex: 1000,
          background: '#1F6B5C', color: '#fff', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, flexWrap: 'wrap', fontSize: 13, fontWeight: 600,
        }}>
          <span>💾 تذكير: مرّ أسبوع على آخر مرة — لا تنسَ تصدير نسخة احتياطية من بيانات روضتك.</span>
          <button
            onClick={goToBackupFromReminder}
            style={{ background: '#fff', color: '#1F6B5C', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer' }}
          >
            الذهاب الآن
          </button>
          <button
            onClick={dismissReminder}
            style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
          >
            لاحقاً
          </button>
        </div>
      )}

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
        {tab === 'dashboard' && <Dashboard {...pageProps} onGoToChildren={goToChildrenWithLevel} />}
        {tab === 'children' && <Children {...pageProps} initialLevelFilter={childrenLevelFilter} />}
        {tab === 'attendance' && <Attendance {...pageProps} />}
        {tab === 'teachers' && <Teachers {...pageProps} />}
        {tab === 'fees' && <Fees {...pageProps} />}
        {tab === 'subscriptions' && <Subscriptions {...pageProps} />}
        {tab === 'programs' && <Programs {...pageProps} />}
        {tab === 'reports' && <Reports {...pageProps} />}
        {tab === 'backup' && <Backup kindergartenId={activeId} kindergartenName={activeKg?.name} />}
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
