import { useState } from 'react'
import { supabase } from '../supabaseClient'

const TABLES = [
  'children',
  'child_attendance',
  'fees',
  'programs',
  'program_enrollments',
  'teachers',
  'teacher_attendance',
  'year_archives',
]

export default function Backup({ kindergartenId, kindergartenName }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const exportBackup = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const result = { kindergarten_id: kindergartenId, kindergarten_name: kindergartenName, exported_at: new Date().toISOString(), data: {} }

      const { data: programs } = await supabase.from('programs').select('id').eq('kindergarten_id', kindergartenId)
      const programIds = (programs || []).map((p) => p.id)

      for (const table of TABLES) {
        let query = supabase.from(table).select('*')
        if (table === 'program_enrollments') {
          if (programIds.length === 0) { result.data[table] = []; continue }
          query = query.in('program_id', programIds)
        } else {
          query = query.eq('kindergarten_id', kindergartenId)
        }
        const { data, error } = await query
        if (error) throw error
        result.data[table] = data || []
      }

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `rawdati-backup-${dateStamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'تم تصدير النسخة الاحتياطية بنجاح.' })
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء التصدير: ' + err.message })
    }
    setBusy(false)
  }

  const restoreBackup = async (file) => {
    if (!file) return
    if (!window.confirm('سيتم استبدال البيانات الحالية بالبيانات الموجودة في الملف. هل تريد المتابعة؟')) return

    setBusy(true)
    setMessage(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      if (!parsed.data) throw new Error('ملف النسخة الاحتياطية غير صالح.')

      const order = ['programs', 'children', 'teachers', 'child_attendance', 'teacher_attendance', 'fees', 'program_enrollments', 'year_archives']

      for (const table of order) {
        const rows = parsed.data[table]
        if (!rows || rows.length === 0) continue
        const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
        if (error) throw new Error(`خطأ في استعادة جدول ${table}: ${error.message}`)
      }

      setMessage({ type: 'success', text: 'تمت استعادة البيانات بنجاح. يفضّل تحديث الصفحة الآن.' })
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الاستعادة: ' + err.message })
    }
    setBusy(false)
  }

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>النسخ الاحتياطي</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
        احفظ نسخة من بيانات روضتك، أو استعدها عند الحاجة.
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>تصدير نسخة احتياطية</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          ينزّل ملفًا يحتوي كل بيانات هذه الروضة (الأطفال، الحضور، الرسوم، المعلمون، البرامج).
        </p>
        <button className="btn btn-primary" disabled={busy} onClick={exportBackup}>
          {busy ? 'جارٍ التصدير...' : '⬇ تصدير نسخة احتياطية'}
        </button>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>استعادة نسخة احتياطية</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          اختر ملف نسخة احتياطية سابق لإعادة بياناته. سيتم استبدال أي بيانات متطابقة.
        </p>
        <input
          type="file"
          accept="application/json"
          disabled={busy}
          onChange={(e) => restoreBackup(e.target.files[0])}
          style={{ display: 'block', marginTop: 8 }}
        />
      </div>

      {message && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 10,
          background: message.type === 'success' ? '#DCEEEA' : '#FBE4E2',
          color: message.type === 'success' ? '#1F6B5C' : '#C1524A',
          fontSize: 13, fontWeight: 600,
        }}>
          {message.text}
        </div>
      )}
    </div>
  )
}
