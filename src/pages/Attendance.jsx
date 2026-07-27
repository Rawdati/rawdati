import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { allLevels, levelInfo, todayISO } from '../levels'

export default function Attendance({ kindergartenId, levelNames }) {
  const [children, setChildren] = useState([])
  const [date, setDate] = useState(todayISO())
  const [records, setRecords] = useState({}) // child_id -> status
  const [levelFilter, setLevelFilter] = useState('all')
  const levels = allLevels(levelNames)

  useEffect(() => { if (kindergartenId) loadChildren() }, [kindergartenId])
  useEffect(() => { if (kindergartenId) loadAttendance() }, [kindergartenId, date])

  const loadChildren = async () => {
    const { data } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId).order('name')
    setChildren(data || [])
  }

  const loadAttendance = async () => {
    const { data } = await supabase.from('child_attendance').select('*').eq('kindergarten_id', kindergartenId).eq('date', date)
    const map = {}
    ;(data || []).forEach((r) => { map[r.child_id] = r.status })
    setRecords(map)
  }

  const setStatus = async (childId, status) => {
    const newStatus = records[childId] === status ? null : status
    setRecords((r) => ({ ...r, [childId]: newStatus }))
    if (newStatus === null) {
      await supabase.from('child_attendance').delete().eq('kindergarten_id', kindergartenId).eq('child_id', childId).eq('date', date)
    } else {
      await supabase.from('child_attendance').upsert({
        kindergarten_id: kindergartenId, child_id: childId, date, status: newStatus,
      }, { onConflict: 'child_id,date' })
    }
  }

  const filtered = children.filter((c) => levelFilter === 'all' || c.level === levelFilter)
  const STATUS = { present: { label: 'حاضر', color: '#4E9C8F', tint: '#DCEEEA' }, absent: { label: 'غائب', color: '#C1524A', tint: '#FCEBEA' }, late: { label: 'متأخر', color: '#E8A23D', tint: '#FBEBD3' } }

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>حضور الأطفال</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>سجّل حضور وغياب الأطفال يوميًا</p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />
        <button onClick={() => setLevelFilter('all')} className="pill" style={{ background: levelFilter === 'all' ? 'var(--teal)' : '#fff', color: levelFilter === 'all' ? '#fff' : 'var(--ink)', border: '1.5px solid var(--line)', cursor: 'pointer' }}>الكل</button>
        {levels.map((lv) => (
          <button key={lv.id} onClick={() => setLevelFilter(lv.id)} className="pill" style={{ background: levelFilter === lv.id ? lv.color : lv.tint, color: levelFilter === lv.id ? '#fff' : lv.color, border: 'none', cursor: 'pointer' }}>{lv.name}</button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--paper)', color: 'var(--muted)' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>الطفل</th>
              <th style={{ textAlign: 'right', padding: 12 }}>المستوى</th>
              <th style={{ textAlign: 'right', padding: 12 }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const lv = levelInfo(c.level, levelNames)
              const status = records[c.id]
              return (
                <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 12 }}><span className="pill" style={{ background: lv.tint, color: lv.color }}>{lv.name}</span></td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {Object.entries(STATUS).map(([key, meta]) => (
                        <button key={key} onClick={() => setStatus(c.id, key)} className="pill" style={{
                          background: status === key ? meta.color : meta.tint, color: status === key ? '#fff' : meta.color, border: 'none', cursor: 'pointer',
                        }}>{meta.label}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>لا يوجد أطفال.</p>}
      </div>
    </div>
  )
}
