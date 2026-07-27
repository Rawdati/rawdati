import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { todayISO } from '../levels'

function emptyTeacher() {
  return { name: '', role: '', phone: '', pin: '', join_date: todayISO(), notes: '' }
}
const nowTime = () => new Date().toTimeString().slice(0, 5)

export default function Teachers({ kindergartenId }) {
  const [section, setSection] = useState('kiosk')
  const [teachers, setTeachers] = useState([])
  const [date] = useState(todayISO())
  const [records, setRecords] = useState({}) // teacher_id -> {check_in, check_out}
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [pinTeacher, setPinTeacher] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [flash, setFlash] = useState(null)

  useEffect(() => { if (kindergartenId) load() }, [kindergartenId])

  const load = async () => {
    const { data: t } = await supabase.from('teachers').select('*').eq('kindergarten_id', kindergartenId).order('name')
    setTeachers(t || [])
    const { data: a } = await supabase.from('teacher_attendance').select('*').eq('kindergarten_id', kindergartenId).eq('date', date)
    const map = {}
    ;(a || []).forEach((r) => { map[r.teacher_id] = r })
    setRecords(map)
  }

  const upsertRecord = async (teacherId, patch) => {
    const existing = records[teacherId] || {}
    const next = { ...existing, ...patch }
    setRecords((r) => ({ ...r, [teacherId]: next }))
    await supabase.from('teacher_attendance').upsert({
      kindergarten_id: kindergartenId, teacher_id: teacherId, date, ...next,
    }, { onConflict: 'teacher_id,date' })
  }

  const showFlash = (text) => { setFlash(text); setTimeout(() => setFlash(null), 2600) }

  const performAction = (t) => {
    const rec = records[t.id] || {}
    if (!rec.check_in) {
      upsertRecord(t.id, { check_in: nowTime() })
      showFlash(`تم تسجيل حضورك يا ${t.name} الساعة ${nowTime()} ✅`)
    } else if (!rec.check_out) {
      upsertRecord(t.id, { check_out: nowTime() })
      showFlash(`تم تسجيل انصرافك يا ${t.name} الساعة ${nowTime()} 👋`)
    } else {
      showFlash(`تم تسجيل حضورك وانصرافك مسبقًا اليوم يا ${t.name}.`)
    }
  }

  const handleTap = (t) => {
    if (t.pin) { setPinTeacher(t); setPinInput(''); setPinError(false) }
    else performAction(t)
  }
  const submitPin = () => {
    if (pinInput === pinTeacher.pin) { performAction(pinTeacher); setPinTeacher(null) }
    else { setPinError(true); setPinInput('') }
  }

  const save = async (form) => {
    const payload = { ...form, kindergarten_id: kindergartenId }
    if (form.id) await supabase.from('teachers').update(payload).eq('id', form.id)
    else await supabase.from('teachers').insert(payload)
    setEditing(null)
    load()
  }
  const remove = async (id) => {
    await supabase.from('teachers').delete().eq('id', id)
    setConfirmDelete(null)
    load()
  }

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>المعلمون</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 16 }}>تسجيل ذاتي لحضور وانصراف المعلمات</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => setSection('kiosk')} style={{ background: section === 'kiosk' ? 'var(--teal)' : '#fff', color: section === 'kiosk' ? '#fff' : 'var(--ink)', border: '1.5px solid var(--line)' }}>تسجيل الحضور الذاتي</button>
        <button className="btn" onClick={() => setSection('list')} style={{ background: section === 'list' ? 'var(--teal)' : '#fff', color: section === 'list' ? '#fff' : 'var(--ink)', border: '1.5px solid var(--line)' }}>قائمة المعلمين</button>
        {section === 'list' && <button className="btn btn-primary" onClick={() => setEditing(emptyTeacher())} style={{ marginRight: 'auto' }}>+ إضافة معلمة</button>}
      </div>

      {flash && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: '#DCEEEA', color: 'var(--teal-dark)', fontWeight: 600, textAlign: 'center' }}>{flash}</div>
      )}

      {section === 'kiosk' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {teachers.map((t) => {
            const rec = records[t.id] || {}
            const state = !rec.check_in ? 'pending' : !rec.check_out ? 'in' : 'done'
            const meta = {
              pending: { label: 'لم تسجّل بعد', bg: '#fff', border: 'var(--line)' },
              in: { label: `حاضرة منذ ${rec.check_in}`, bg: '#F3F9F7', border: '#BFE2DA' },
              done: { label: `انصرفت ${rec.check_out}`, bg: '#FBEBD3', border: '#F0D8A8' },
            }[state]
            return (
              <button key={t.id} onClick={() => handleTap(t)} className="card" style={{
                padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: meta.bg, borderColor: meta.border, cursor: 'pointer',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#DCE7F2', color: '#4C7FB0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>{t.name.trim()[0]}</div>
                <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{meta.label}</div>
              </button>
            )
          })}
          {teachers.length === 0 && <p style={{ color: 'var(--muted)' }}>لا يوجد معلمون بعد.</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {teachers.map((t) => (
            <div key={t.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  {t.role && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.role}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setEditing(t)} style={{ background: 'none', border: 'none' }}>✎</button>
                  <button onClick={() => setConfirmDelete(t.id)} style={{ background: 'none', border: 'none', color: '#C1524A' }}>🗑</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>الجوال: {t.phone || '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>رمز الدخول: {t.pin ? '•'.repeat(t.pin.length) : 'غير مفعّل'}</div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <TeacherForm teacher={editing} onCancel={() => setEditing(null)} onSave={save} />
        </div>
      )}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontWeight: 600 }}>هل تريد حذف بيانات هذه المعلمة؟</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={() => remove(confirmDelete)}>حذف</button>
            </div>
          </div>
        </div>
      )}
      {pinTeacher && (
        <div className="modal-overlay" onClick={() => setPinTeacher(null)}>
          <div className="modal-box" style={{ maxWidth: 320, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>رمز الدخول — {pinTeacher.name}</h3>
            <input className="input" type="password" inputMode="numeric" maxLength={6} value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && submitPin()}
              style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6, maxWidth: 160 }} autoFocus />
            {pinError && <p style={{ color: '#C1524A', fontSize: 13 }}>الرمز غير صحيح</p>}
            <button className="btn btn-primary" onClick={submitPin}>تأكيد</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TeacherForm({ teacher, onCancel, onSave }) {
  const [form, setForm] = useState(teacher)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3 className="disp" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{form.id ? 'تعديل بيانات المعلمة' : 'إضافة معلمة جديدة'}</h3>
      <label style={{ fontSize: 13, fontWeight: 600 }}>اسم المعلمة
        <input className="input" value={form.name} onChange={set('name')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>الوظيفة
        <input className="input" value={form.role} onChange={set('role')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>رقم الجوال
        <input className="input" value={form.phone} onChange={set('phone')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>رمز دخول للتسجيل الذاتي (اختياري)
        <input className="input" inputMode="numeric" maxLength={6} value={form.pin}
          onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })} style={{ marginTop: 4 }} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-primary" onClick={() => form.name.trim() && onSave(form)}>حفظ</button>
      </div>
    </div>
  )
}
