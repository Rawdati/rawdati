import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { allLevels } from '../levels'

function emptyProgram() { return { name: '', description: '', schedule: '', levels: [] } }

export default function Programs({ kindergartenId, levelNames }) {
  const [programs, setPrograms] = useState([])
  const [children, setChildren] = useState([])
  const [enrollments, setEnrollments] = useState([]) // {program_id, child_id}
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const levels = allLevels(levelNames)

  useEffect(() => { if (kindergartenId) load() }, [kindergartenId])

  const load = async () => {
    const { data: p } = await supabase.from('programs').select('*').eq('kindergarten_id', kindergartenId)
    setPrograms(p || [])
    const { data: c } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId).order('name')
    setChildren(c || [])
    const ids = (p || []).map((x) => x.id)
    if (ids.length) {
      const { data: e } = await supabase.from('program_enrollments').select('*').in('program_id', ids)
      setEnrollments(e || [])
    } else setEnrollments([])
  }

  const save = async (form, enrolledChildIds) => {
    let programId = form.id
    if (programId) {
      await supabase.from('programs').update({ name: form.name, description: form.description, schedule: form.schedule, levels: form.levels }).eq('id', programId)
      await supabase.from('program_enrollments').delete().eq('program_id', programId)
    } else {
      const { data } = await supabase.from('programs').insert({
        kindergarten_id: kindergartenId, name: form.name, description: form.description, schedule: form.schedule, levels: form.levels,
      }).select().single()
      programId = data.id
    }
    if (enrolledChildIds.length) {
      await supabase.from('program_enrollments').insert(enrolledChildIds.map((cid) => ({ program_id: programId, child_id: cid })))
    }
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    await supabase.from('programs').delete().eq('id', id)
    setConfirmDelete(null)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>البرامج المقدمة</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>الأنشطة والبرامج التعليمية</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ form: emptyProgram(), enrolled: [] })}>+ إضافة برنامج</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {programs.map((p) => {
          const count = enrollments.filter((e) => e.program_id === p.id).length
          return (
            <div key={p.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEditing({ form: p, enrolled: enrollments.filter((e) => e.program_id === p.id).map((e) => e.child_id) })} style={{ background: 'none', border: 'none' }}>✎</button>
                  <button onClick={() => setConfirmDelete(p.id)} style={{ background: 'none', border: 'none', color: '#C1524A' }}>🗑</button>
                </div>
              </div>
              {p.schedule && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.schedule}</div>}
              {p.description && <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{p.description}</p>}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{count} طفل مسجّل</div>
            </div>
          )
        })}
        {programs.length === 0 && <p style={{ color: 'var(--muted)' }}>لا توجد برامج بعد.</p>}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <ProgramForm data={editing} levels={levels} children={children}
            onCancel={() => setEditing(null)} onSave={save} />
        </div>
      )}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontWeight: 600 }}>هل تريد حذف هذا البرنامج؟</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={() => remove(confirmDelete)}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProgramForm({ data, levels, children, onCancel, onSave }) {
  const [form, setForm] = useState(data.form)
  const [enrolled, setEnrolled] = useState(data.enrolled)
  const toggleLevel = (id) => setForm((f) => ({ ...f, levels: f.levels.includes(id) ? f.levels.filter((x) => x !== id) : [...f.levels, id] }))
  const toggleChild = (id) => setEnrolled((e) => e.includes(id) ? e.filter((x) => x !== id) : [...e, id])
  return (
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3 className="disp" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{form.id ? 'تعديل البرنامج' : 'إضافة برنامج جديد'}</h3>
      <label style={{ fontSize: 13, fontWeight: 600 }}>اسم البرنامج
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>الوصف
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>الموعد
        <input className="input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} style={{ marginTop: 4 }} />
      </label>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>المستويات المستهدفة</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {levels.map((lv) => (
            <button key={lv.id} type="button" onClick={() => toggleLevel(lv.id)} className="pill" style={{
              background: form.levels.includes(lv.id) ? lv.color : lv.tint, color: form.levels.includes(lv.id) ? '#fff' : lv.color, border: 'none', cursor: 'pointer',
            }}>{lv.name}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>الأطفال المسجّلون</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 140, overflowY: 'auto' }}>
          {children.map((c) => (
            <button key={c.id} type="button" onClick={() => toggleChild(c.id)} className="pill" style={{
              background: enrolled.includes(c.id) ? 'var(--teal)' : '#fff', color: enrolled.includes(c.id) ? '#fff' : 'var(--ink)', border: '1.5px solid var(--line)', cursor: 'pointer',
            }}>{c.name}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-primary" onClick={() => form.name.trim() && onSave(form, enrolled)}>حفظ</button>
      </div>
    </div>
  )
}
