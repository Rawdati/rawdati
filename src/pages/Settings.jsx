import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { LEVELS, DEFAULT_LEVEL_NAMES, LEVEL_PROMOTION, levelInfo } from '../levels'

export default function Settings({ kindergarten, onUpdated }) {
  const [name, setName] = useState(kindergarten?.name || '')
  const [levelNames, setLevelNames] = useState(kindergarten?.level_names || DEFAULT_LEVEL_NAMES)
  const [saved, setSaved] = useState(false)
  const [archives, setArchives] = useState([])
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [viewingArchive, setViewingArchive] = useState(null)
  const [children, setChildren] = useState([])

  useEffect(() => {
    setName(kindergarten?.name || '')
    setLevelNames(kindergarten?.level_names || DEFAULT_LEVEL_NAMES)
  }, [kindergarten])

  useEffect(() => { if (kindergarten?.id) loadExtra() }, [kindergarten?.id])

  const loadExtra = async () => {
    const { data: a } = await supabase.from('year_archives').select('*').eq('kindergarten_id', kindergarten.id).order('archived_at', { ascending: false })
    setArchives(a || [])
    const { data: c } = await supabase.from('children').select('*').eq('kindergarten_id', kindergarten.id).order('name')
    setChildren(c || [])
  }

  const handleSave = async () => {
    await supabase.from('kindergartens').update({ name: name.trim() || kindergarten.name, level_names: levelNames }).eq('id', kindergarten.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onUpdated()
  }

  const doArchive = async (label, continuingChildren) => {
    const kgId = kindergarten.id
    const [{ data: attendance }, { data: fees }, { data: programs }, { data: teachers }, { data: teacherAttendance }] = await Promise.all([
      supabase.from('child_attendance').select('*').eq('kindergarten_id', kgId),
      supabase.from('fees').select('*').eq('kindergarten_id', kgId),
      supabase.from('programs').select('*').eq('kindergarten_id', kgId),
      supabase.from('teachers').select('*').eq('kindergarten_id', kgId),
      supabase.from('teacher_attendance').select('*').eq('kindergarten_id', kgId),
    ])
    const snapshot = { children, attendance, fees, programs, teachers, teacherAttendance }
    await supabase.from('year_archives').insert({
      kindergarten_id: kgId, label, snapshot, child_count: children.length, teacher_count: (teachers || []).length,
    })

    // wipe current-year working tables (attendance, fees, programs, child_attendance)
    await Promise.all([
      supabase.from('child_attendance').delete().eq('kindergarten_id', kgId),
      supabase.from('fees').delete().eq('kindergarten_id', kgId),
      supabase.from('program_enrollments').delete().in('program_id', (programs || []).map((p) => p.id)),
      supabase.from('programs').delete().eq('kindergarten_id', kgId),
      supabase.from('teacher_attendance').delete().eq('kindergarten_id', kgId),
    ])
    // delete children not continuing, update levels for continuing ones
    const continuingIds = continuingChildren.map((c) => c.id)
    const toDelete = children.filter((c) => !continuingIds.includes(c.id)).map((c) => c.id)
    if (toDelete.length) await supabase.from('children').delete().in('id', toDelete)
    for (const c of continuingChildren) {
      await supabase.from('children').update({ level: c.level }).eq('id', c.id)
    }

    setArchiveModalOpen(false)
    loadExtra()
  }

  if (!kindergarten) return null

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>الإعدادات</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>تخصيص اسم الروضة وأسماء المراحل</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>اسم الروضة</h3>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>أسماء المراحل</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEVELS.map((lv) => (
              <input key={lv.id} className="input" value={levelNames[lv.id] || ''}
                onChange={(e) => setLevelNames({ ...levelNames, [lv.id]: e.target.value })}
                placeholder={DEFAULT_LEVEL_NAMES[lv.id]} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn btn-primary" onClick={handleSave}>حفظ التغييرات</button>
        {saved && <span className="pill" style={{ background: '#DCEEEA', color: 'var(--teal-dark)' }}>تم الحفظ</span>}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ marginTop: 0 }}>أرشفة السنة الدراسية</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 460 }}>
              احفظ بيانات السنة الحالية كأرشيف، وابدأ سجلًا جديدًا. المعلمون يبقون كما هم.
            </p>
          </div>
          <button className="btn btn-gold" onClick={() => setArchiveModalOpen(true)}>أرشفة السنة الحالية</button>
        </div>

        {archives.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {archives.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 12, background: 'var(--paper)', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.archived_at} — {a.child_count} طفلًا</div>
                </div>
                <button className="btn btn-ghost" onClick={() => setViewingArchive(a)}>عرض</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {archiveModalOpen && (
        <div className="modal-overlay" onClick={() => setArchiveModalOpen(false)}>
          <ArchiveForm children={children} levelNames={levelNames} onCancel={() => setArchiveModalOpen(false)} onConfirm={doArchive} />
        </div>
      )}

      {viewingArchive && (
        <div className="modal-overlay" onClick={() => setViewingArchive(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>{viewingArchive.label}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>أُرشفت بتاريخ {viewingArchive.archived_at}</p>
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(viewingArchive.snapshot.children || []).map((c) => (
                <div key={c.id} style={{ fontSize: 13, padding: 8, borderRadius: 8, background: 'var(--paper)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted)' }}>{c.parent_name}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setViewingArchive(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ArchiveForm({ children, levelNames, onCancel, onConfirm }) {
  const defaultLabel = `العام الدراسي ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
  const [label, setLabel] = useState(defaultLabel)
  const [promote, setPromote] = useState(true)
  const [continuing, setContinuing] = useState(() => {
    const init = {}
    children.forEach((c) => { init[c.id] = c.level !== 'kg3' })
    return init
  })
  const toggle = (id) => setContinuing((s) => ({ ...s, [id]: !s[id] }))
  const setAll = (val) => { const n = {}; children.forEach((c) => { n[c.id] = val }); setContinuing(n) }

  const handleConfirm = () => {
    const list = children.filter((c) => continuing[c.id]).map((c) => ({ ...c, level: promote ? (LEVEL_PROMOTION[c.level] || c.level) : c.level }))
    onConfirm(label, list)
  }

  return (
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3 style={{ margin: 0 }}>أرشفة السنة الحالية</h3>
      <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
        <input type="checkbox" checked={promote} onChange={(e) => setPromote(e.target.checked)} />
        ترقية المستمرين تلقائيًا للمستوى التالي
      </label>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>الأطفال المستمرون</span>
          <span>
            <button onClick={() => setAll(true)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 12 }}>تحديد الكل</button>
            {' '}
            <button onClick={() => setAll(false)} style={{ background: 'none', border: 'none', color: '#C1524A', fontSize: 12 }}>إلغاء الكل</button>
          </span>
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {children.map((c) => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: 'var(--paper)', fontSize: 13 }}>
              <input type="checkbox" checked={!!continuing[c.id]} onChange={() => toggle(c.id)} />
              <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: 'var(--muted)' }}>{levelInfo(c.level, levelNames).name}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-gold" onClick={handleConfirm}>أرشفة وبدء سنة جديدة</button>
      </div>
    </div>
  )
}
