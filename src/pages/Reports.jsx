
‬ import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { levelInfo, thisMonth } from '../levels'

function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  const start = `${ym}-01`
  const end = new Date(y, m, 0).toISOString().slice(0, 10)
  return { start, end }
}
const monthLabel = (ym) => {
  const names = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const [y, m] = ym.split('-').map(Number)
  return `${names[m - 1]} ${y}`
}
function lastMonths(n) {
  const arr = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return arr
}

export default function Reports({ kindergartenId, levelNames }) {
  const [month, setMonth] = useState(thisMonth())
  const [children, setChildren] = useState([])
  const [attendanceByChild, setAttendanceByChild] = useState({})
  const [feesByChild, setFeesByChild] = useState({})
  const [incomeSeries, setIncomeSeries] = useState([])

  useEffect(() => { if (kindergartenId) loadChildren() }, [kindergartenId])
  useEffect(() => { if (kindergartenId) { loadMonthData(); loadIncomeSeries() } }, [kindergartenId, month])

  const loadChildren = async () => {
    const { data } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId).order('name')
    setChildren(data || [])
  }

  const loadMonthData = async () => {
    const { start, end } = monthRange(month)
    const { data: att } = await supabase
      .from('child_attendance').select('*')
      .eq('kindergarten_id', kindergartenId).gte('date', start).lte('date', end)
    const attMap = {}
    ;(att || []).forEach((r) => {
      if (!attMap[r.child_id]) attMap[r.child_id] = { present: 0, absent: 0, late: 0 }
      attMap[r.child_id][r.status] = (attMap[r.child_id][r.status] || 0) + 1
    })
    setAttendanceByChild(attMap)

    const { data: fees } = await supabase.from('fees').select('*').eq('kindergarten_id', kindergartenId).eq('month', month)
    const feeMap = {}
    ;(fees || []).forEach((f) => { feeMap[f.child_id] = f })
    setFeesByChild(feeMap)
  }

  const loadIncomeSeries = async () => {
    const months = lastMonths(6)
    const { data } = await supabase
      .from('fees').select('month, amount, paid')
      .eq('kindergarten_id', kindergartenId).eq('paid', true).in('month', months)
    const sums = {}
    months.forEach((m) => { sums[m] = 0 })
    ;(data || []).forEach((f) => { sums[f.month] = (sums[f.month] || 0) + Number(f.amount) })
    setIncomeSeries(months.map((m) => ({ month: m, total: sums[m] })))
  }

  const totals = children.reduce((acc, c) => {
    const a = attendanceByChild[c.id] || {}
    acc.present += a.present || 0
    acc.absent += a.absent || 0
    acc.late += a.late || 0
    if (feesByChild[c.id]?.paid) acc.paidCount += 1
    acc.collected += Number(feesByChild[c.id]?.amount || 0) * (feesByChild[c.id]?.paid ? 1 : 0)
    return acc
  }, { present: 0, absent: 0, late: 0, paidCount: 0, collected: 0 })

  const maxIncome = Math.max(1, ...incomeSeries.map((s) => s.total))

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>التقارير والإحصائيات</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 16 }}>ملخص الحضور والرسوم لأي شهر تختاره</p>

      <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 160, marginBottom: 20 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Stat label="مجموع أيام الحضور" value={totals.present} color="#4E9C8F" />
        <Stat label="مجموع أيام الغياب" value={totals.absent} color="#C1524A" />
        <Stat label="مجموع أيام التأخير" value={totals.late} color="var(--gold)" />
        <Stat label="سددوا الرسوم" value={`${totals.paidCount}/${children.length}`} color="var(--teal)" />
        <Stat label="الدخل المحصّل (ر.س)" value={totals.collected} color="var(--teal-dark)" />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>الدخل خلال آخر ٦ أشهر</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
          {incomeSeries.map((s) => (
            <div key={s.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.total}</div>
              <div style={{
                width: '100%', maxWidth: 40, background: 'var(--teal)', borderRadius: '6px 6px 0 0',
                height: `${Math.max(4, (s.total / maxIncome) * 100)}px`,
              }} />
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{monthLabel(s.month).split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--paper)', color: 'var(--muted)' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>الطفل</th>
              <th style={{ textAlign: 'right', padding: 12 }}>المستوى</th>
              <th style={{ textAlign: 'right', padding: 12 }}>حضور</th>
              <th style={{ textAlign: 'right', padding: 12 }}>غياب</th>
              <th style={{ textAlign: 'right', padding: 12 }}>تأخير</th>
              <th style={{ textAlign: 'right', padding: 12 }}>الرسوم</th>
            </tr>
          </thead>
          <tbody>
            {children.map((c) => {
              const lv = levelInfo(c.level, levelNames)
              const a = attendanceByChild[c.id] || {}
              const fee = feesByChild[c.id]
              return (
                <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 12 }}><span className="pill" style={{ background: lv.tint, color: lv.color }}>{lv.name}</span></td>
                  <td style={{ padding: 12 }}>{a.present || 0}</td>
                  <td style={{ padding: 12 }}>{a.absent || 0}</td>
                  <td style={{ padding: 12 }}>{a.late || 0}</td>
                  <td style={{ padding: 12 }}>
                    <span className="pill" style={{ background: fee?.paid ? '#DCEEEA' : '#FCEBEA', color: fee?.paid ? '#4E9C8F' : '#C1524A' }}>
                      {fee?.paid ? 'مسددة' : 'غير مسددة'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {children.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>لا يوجد أطفال.</p>}
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
