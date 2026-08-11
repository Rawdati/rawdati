import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient'

export default function Subscriptions({ kindergartenId, levelNames }) {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('all')

  useEffect(() => {
    if (!kindergartenId) return
    setLoading(true)
    supabase
      .from('children')
      .select('id, name, level, join_date, subscription_end_date')
      .eq('kindergarten_id', kindergartenId)
      .order('subscription_end_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setChildren(data || [])
        setLoading(false)
      })
  }, [kindergartenId])

  const levels = useMemo(() => {
    const set = new Set(children.map((c) => c.level).filter(Boolean))
    return Array.from(set)
  }, [children])

  const filtered = useMemo(() => {
    if (levelFilter === 'all') return children
    return children.filter((c) => c.level === levelFilter)
  }, [children, levelFilter])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getStatus = (endDateStr) => {
    if (!endDateStr) return { label: 'بدون تاريخ', color: '#6B7280', bg: '#F3F4F6' }
    const endDate = new Date(endDateStr)
    endDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((endDate - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { label: `منتهي منذ ${Math.abs(diffDays)} يوم`, color: '#C1524A', bg: '#FBE4E2' }
    if (diffDays <= 3) return { label: diffDays === 0 ? 'ينتهي اليوم' : `باقي ${diffDays} يوم`, color: '#B45309', bg: '#FEF3C7' }
    return { label: `باقي ${diffDays} يوم`, color: '#1F6B5C', bg: '#DCEEEA' }
  }

  const expiredCount = children.filter((c) => {
    if (!c.subscription_end_date) return false
    const d = new Date(c.subscription_end_date)
    d.setHours(0, 0, 0, 0)
    return d < today
  }).length

  const soonCount = children.filter((c) => {
    if (!c.subscription_end_date) return false
    const d = new Date(c.subscription_end_date)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 3
  }).length

  const fmt = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  const levelLabel = (lv) => levelNames?.[lv] || lv

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>ملخص الاشتراكات</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
        نظرة سريعة على تواريخ التسجيل وانتهاء الاشتراك لكل طفل.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 14, flex: '1 1 140px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{children.length}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>إجمالي الأطفال</div>
        </div>
        <div className="card" style={{ padding: 14, flex: '1 1 140px', textAlign: 'center', background: '#FBE4E2' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#C1524A' }}>{expiredCount}</div>
          <div style={{ fontSize: 12, color: '#C1524A' }}>اشتراك منتهي</div>
        </div>
        <div className="card" style={{ padding: 14, flex: '1 1 140px', textAlign: 'center', background: '#FEF3C7' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#B45309' }}>{soonCount}</div>
          <div style={{ fontSize: 12, color: '#B45309' }}>ينتهي خلال 3 أيام</div>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>المرحلة:</span>
        <button
          onClick={() => setLevelFilter('all')}
          className="btn"
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
            background: levelFilter === 'all' ? 'var(--teal)' : '#F3F4F6',
            color: levelFilter === 'all' ? '#fff' : '#374151',
            border: 'none',
          }}
        >
          الكل
        </button>
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setLevelFilter(lv)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: levelFilter === lv ? 'var(--teal)' : '#F3F4F6',
              color: levelFilter === lv ? '#fff' : '#374151',
              border: 'none',
            }}
          >
            {levelLabel(lv)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>...جارٍ التحميل</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>لا يوجد أطفال</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((c) => {
            const status = getStatus(c.subscription_end_date)
            return (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, flexWrap: 'wrap', borderInlineStart: `4px solid ${status.color}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {levelLabel(c.level)} · التسجيل: {fmt(c.join_date)} · الانتهاء: {fmt(c.subscription_end_date)}
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: status.bg, color: status.color, whiteSpace: 'nowrap',
                  }}
                >
                  {status.label}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
