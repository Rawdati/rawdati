import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { allLevels, todayISO, thisMonth } from '../levels'

export default function Dashboard({ kindergartenId, levelNames }) {
  const [children, setChildren] = useState([])
  const [presentToday, setPresentToday] = useState(0)
  const [unpaid, setUnpaid] = useState(0)
  const levels = allLevels(levelNames)

  useEffect(() => { if (kindergartenId) load() }, [kindergartenId])

  const load = async () => {
    const { data: c } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId)
    setChildren(c || [])

    const { data: att } = await supabase.from('child_attendance').select('*').eq('kindergarten_id', kindergartenId).eq('date', todayISO()).eq('status', 'present')
    setPresentToday((att || []).length)

    const { data: fees } = await supabase.from('fees').select('*').eq('kindergarten_id', kindergartenId).eq('month', thisMonth())
    const paidIds = new Set((fees || []).filter((f) => f.paid).map((f) => f.child_id))
    setUnpaid((c || []).filter((ch) => !paidIds.has(ch.id)).length)
  }

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>لوحة التحكم</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>نظرة عامة على الروضة اليوم</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard label="إجمالي الأطفال" value={children.length} color="var(--teal)" />
        <StatCard label="حضروا اليوم" value={presentToday} color="#4E9C8F" />
        <StatCard label="رسوم غير مسددة" value={unpaid} color="var(--gold)" />
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>توزيع المستويات</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {levels.map((lv) => {
            const count = children.filter((c) => c.level === lv.id).length
            const pct = children.length ? (count / children.length) * 100 : 0
            return (
              <div key={lv.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{lv.name}</span>
                  <span style={{ color: 'var(--muted)' }}>{count}</span>
                </div>
                <div style={{ height: 8, borderRadius: 8, background: lv.tint, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: lv.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
