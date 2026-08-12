import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { allLevels, levelInfo, todayISO } from '../levels'

const REGISTRATION_PERIODS = {
  monthly: 'شهري',
  semester: 'فصلي',
  yearly: 'سنوي',
}

const REGISTRATION_TYPES = {
  personal: 'شخصي',
  qurrah: 'قرة',
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
    registration_period: 'monthly', registration_type: 'personal',
    bus_type: 'none', bus_fee: '',
  }
}

export default function Children({ kindergartenId, levelNames }) {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId).order('name')
    if (!error) setChildren(data)
    setLoading(false)
  }

  useEffect(() => { if (kindergartenId) load() }, [kindergartenId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const save = async (form) => {
    const payload = {
      ...form,
      kindergarten_id: kindergartenId,
      bus_fee: form.bus_fee === '' ? 0 : Number(form.bus_fee),
      registration_type: form.registration_period === 'monthly' ? form.registration_type : null,
    }
    if (form.id) {
      const { error } = await supabase.from('children').update(payload).eq('id', form.id)
      if (error) return alert(error.message)
    } else {
      const { error } = await supabase.from('children').insert(payload)
      if (error) return alert(error.message)
    }
    setEditing(null)
    setToast(form.id ? 'تم حفظ التعديلات بنجاح' : 'تم إضافة الطفل بنجاح')
    load()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('children').delete().eq('id', id)
    if (error) return alert(error.message)
    setConfirmDelete(null)
    setToast('تم حذف الطفل')
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
                  <span>
                    مدة التسجيل: {REGISTRATION_PERIODS[c.registration_period] || 'شهري'}
                    {c.registration_period === 'monthly' && c.registration_type ? ` · ${REGISTRATION_TYPES[c.registration_type]}` : ''}
                  </span>
                  <span>الحافلة: {BUS_TYPES[c.bus_type] || 'بدون حافلة'}{c.bus_type && c.bus_type !== 'none' && c.bus_fee ? ` · ${c.bus_fee} ريال` : ''}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <p style={{ color: 'var(--muted)' }}>لا يوجد أطفال.</p>}
        </div>
      )}

      {editing && (
        <div className="modal-overlay">
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

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, insetInlineStart: '50%', transform: 'translateX(-50%)',
          background: '#1F6B5C', color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 700, zIndex: 200, boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

function Field({ label, hint, full, error, children }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, gridColumn: full ? '1 / -1' : 'auto' }}>
      <span style={{ color: error ? '#C1524A' : 'inherit' }}>
        {label}{error && ' *'}
      </span>
      {children}
      {error ? (
        <span style={{ fontSize: 11.5, color: '#C1524A', fontWeight: 600 }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>{hint}</span>
      ) : null}
    </label>
  )
}

function ChildForm({ child, levels, onCancel, onSave }) {
  const [form, setForm] = useState({ ...emptyDefaults(), ...child })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: null })
  }

  const handleSave = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'اسم الطفل مطلوب'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSave(form)
  }

  const inputStyle = (field) => errors[field] ? { borderColor: '#C1524A', background: '#FCEBEA' } : {}

  return (
    <div className="modal-box" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="disp" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          {form.id ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'}
        </h3>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>الحقول المطلوبة فقط: الاسم</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <Field label="اسم الطفل" full error={errors.name}>
          <input className="input" value={form.name} onChange={set('name')} placeholder="مثال: أحمد محمد" style={inputStyle('name')} />
        </Field>

        <Field label="المستوى">
          <select className="input" value={form.level} onChange={set('level')}>
            {levels.map((lv) => <option key={lv.id} value={lv.id}>{lv.name}</option>)}
          </select>
        </Field>

        <Field label="تاريخ الميلاد">
          <input className="input" type="date" value={form.birth_date || ''} onChange={set('birth_date')} />
        </Field>

        <Field label="اسم ولي الأمر">
          <input className="input" value={form.parent_name} onChange={set('parent_name')} placeholder="اسم ولي الأمر" />
        </Field>

        <Field label="رقم الجوال">
          <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" />
        </Field>

        <div style={{ gridColumn: '1 / -1', height: 1, background: 'var(--line)', margin: '4px 0' }} />

        <Field label="تاريخ الالتحاق">
          <input className="input" type="date" value={form.join_date || ''} onChange={set('join_date')} />
        </Field>

        <Field
          label="مدة التسجيل"
          hint={form.registration_period === 'monthly' ? 'سيُحسب تاريخ انتهاء الاشتراك تلقائيًا بعد 30 يومًا من تاريخ الالتحاق.' : null}
        >
          <select className="input" value={form.registration_period} onChange={set('registration_period')}>
            {Object.entries(REGISTRATION_PERIODS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>

        {form.registration_period === 'monthly' && (
          <Field label="نوع التسجيل (شخصي / قرة)">
            <select className="input" value={form.registration_type} onChange={set('registration_type')}>
              {Object.entries(REGISTRATION_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="الحافلة">
          <select className="input" value={form.bus_type} onChange={set('bus_type')}>
            {Object.entries(BUS_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>

        {form.bus_type !== 'none' && (
          <Field label="رسوم الحافلة">
            <input className="input" type="number" min="0" placeholder="0" value={form.bus_fee} onChange={set('bus_fee')} />
          </Field>
        )}

        <Field label="ملاحظات" full>
          <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} placeholder="أي ملاحظات إضافية (اختياري)" />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-primary" onClick={handleSave}>حفظ</button>
      </div>
    </div>
  )
}

function emptyDefaults() {
  return { registration_period: 'monthly', registration_type: 'personal', bus_type: 'none', bus_fee: '' }
}
