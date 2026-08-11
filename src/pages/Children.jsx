import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { allLevels, levelInfo, todayISO } from '../levels'

const REGISTRATION_PERIODS = {
  monthly: 'شهري',
  semester: 'فصلي',
  yearly: 'سنوي',
}

const BUS_TYPES = {
  none: 'بدون حافلة',
  one_way: 'خط واحد',
  two_way: 'خطين (ذهاب وعودة)',
}

function emptyChild() {
  return {
    name: '', level: 'nursery', parent_name: '', phone: '', birth_date: '',
    join_date: todayISO(), notes: '',
    registration_period: 'monthly', bus_type: 'none', bus_fee: '',
  }
}

export default function Children({ kindergartenId, levelNames }) {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId).order('name')
    if (!error) setChildren(data)
    setLoading(false)
  }

  useEffect(() => { if (kindergartenId) load() }, [kindergartenId])

  const save = async (form) => {
    const payload = {
      ...form,
      kindergarten_id: kindergartenId,
      bus_fee: form.bus_fee === '' ? 0 : Number(form.bus_fee),
    }
    if (form.id) {
      const { error } = await supabase.from('children').update(payload).eq('id', form.id)
      if (error) return alert(error.message)
    } else {
      const { error } = await supabase.from('children').insert(payload)
      if (error) return alert(error.message)
    }
    setEditing(null)
    load()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('children').delete().eq('id', id)
    if (error) return alert(error.message)
    setConfirmDelete(null)
    load()
  }

  const filtered = children.filter((c) => c.name.includes(query) || (c.parent_name || '').includes(query))
  const levels = allLevels(levelNames)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>الأطفال</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>{children.length} طفلًا مسجّلًا</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(emptyChild())}>+ إضافة طفل</button>
      </div>

      <input className="input" placeholder="بحث بالاسم أو ولي الأمر" value={query}
        onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 280, marginBottom: 16 }} />

      {loading ? <p>...جارٍ التحميل</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map((c) => {
            const lv = levelInfo(c.level, levelNames)
            return (
              <div key={c.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: lv.tint, color: lv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {c.name.trim()[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <span className="pill" style={{ background: lv.tint, color: lv.color }}>{lv.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setEditing(c)} style={{ background: 'none', border: 'none' }}>✎</button>
                    <button onClick={() => setConfirmDelete(c.id)} style={{ background: 'none', border: 'none', color: '#C1524A' }}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>ولي الأمر: {c.parent_name || '—'}</span>
                  <span>الجوال: {c.phone || '—'}</span>
                  <span>نوع التسجيل: {REGISTRATION_PERIODS[c.registration_period] || 'شهري'}</span>
                  <span>الحافلة: {BUS_TYPES[c.bus_type] || 'بدون حافلة'}{c.bus_type && c.bus_type !== 'none' && c.bus_fee ? ` · ${c.bus_fee} ريال` : ''}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <p style={{ color: 'var(--muted)' }}>لا يوجد أطفال.</p>}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <ChildForm child={editing} levels={levels} onCancel={() => setEditing(null)} onSave={save} />
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontWeight: 600 }}>هل تريد حذف بيانات هذا الطفل؟</p>
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

function ChildForm({ child, levels, onCancel, onSave }) {
  const [form, setForm] = useState({ ...emptyDefaults(), ...child })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3 className="disp" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{form.id ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'}</h3>
      <label style={{ fontSize: 13, fontWeight: 600 }}>اسم الطفل
        <input className="input" value={form.name} onChange={set('name')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>المستوى
        <select className="input" value={form.level} onChange={set('level')} style={{ marginTop: 4 }}>
          {levels.map((lv) => <option key={lv.id} value={lv.id}>{lv.name}</option>)}
        </select>
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>اسم ولي الأمر
        <input className="input" value={form.parent_name} onChange={set('parent_name')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>رقم الجوال
        <input className="input" value={form.phone} onChange={set('phone')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>تاريخ الميلاد
        <input className="input" type="date" value={form.birth_date || ''} onChange={set('birth_date')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>تاريخ الالتحاق
        <input className="input" type="date" value={form.join_date || ''} onChange={set('join_date')} style={{ marginTop: 4 }} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>نوع التسجيل
        <select className="input" value={form.registration_period} onChange={set('registration_period')} style={{ marginTop: 4 }}>
          {Object.entries(REGISTRATION_PERIODS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {form.registration_period === 'monthly' && (
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
            سيُحسب تاريخ انتهاء الاشتراك تلقائيًا بعد 30 يومًا من تاريخ الالتحاق.
          </span>
        )}
      </label>
      <label style={{ fontSize: 13, fontWeight: 600 }}>الحافلة
        <select className="input" value={form.bus_type} onChange={set('bus_type')} style={{ marginTop: 4 }}>
          {Object.entries(BUS_TYPES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>
      {form.bus_type !== 'none' && (
        <label style={{ fontSize: 13, fontWeight: 600 }}>رسوم الحافلة
          <input className="input" type="number" min="0" value={form.bus_fee} onChange={set('bus_fee')} style={{ marginTop: 4 }} />
        </label>
      )}
      <label style={{ fontSize: 13, fontWeight: 600 }}>ملاحظات
        <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} style={{ marginTop: 4 }} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-primary" onClick={() => form.name.trim() && onSave(form)}>حفظ</button>
      </div>
    </div>
  )
}

function emptyDefaults() {
  return { registration_period: 'monthly', bus_type: 'none', bus_fee: '' }
}
