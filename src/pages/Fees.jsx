import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { levelInfo, thisMonth, todayISO } from '../levels'

export default function Fees({ kindergartenId, levelNames }) {
  const [children, setChildren] = useState([])
  const [fees, setFees] = useState([])
  const [month, setMonth] = useState(thisMonth())
  const [amountModal, setAmountModal] = useState(null)

  useEffect(() => { if (kindergartenId) load() }, [kindergartenId, month])

  const load = async () => {
    const { data: c } = await supabase.from('children').select('*').eq('kindergarten_id', kindergartenId).order('name')
    setChildren(c || [])
    const { data: f } = await supabase.from('fees').select('*').eq('kindergarten_id', kindergartenId).eq('month', month)
    setFees(f || [])
  }

  const getRec = (childId) => fees.find((f) => f.child_id === childId)

  const togglePaid = async (child) => {
    const rec = getRec(child.id)
    if (rec) {
      await supabase.from('fees').update({ paid: !rec.paid, paid_date: !rec.paid ? todayISO() : null }).eq('id', rec.id)
      load()
    } else {
      setAmountModal(child)
    }
  }

  const confirmNewFee = async (child, amount) => {
    await supabase.from('fees').insert({
      kindergarten_id: kindergartenId, child_id: child.id, month, amount: Number(amount) || 0, paid: true, paid_date: todayISO(),
    })
    setAmountModal(null)
    load()
  }

  const paidCount = children.filter((c) => getRec(c.id)?.paid).length
  const total = fees.filter((f) => f.paid).reduce((s, f) => s + Number(f.amount), 0)

  return (
    <div>
      <h1 className="disp" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>الرسوم الدراسية</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0, marginBottom: 16 }}>متابعة سداد الرسوم الشهرية</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 160 }} />
        <span className="pill" style={{ background: '#DCEEEA', color: 'var(--teal-dark)' }}>{paidCount}/{children.length} سددوا</span>
        <span className="pill" style={{ background: '#FBEBD3', color: '#7A5311' }}>الإجمالي: {total} ر.س</span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--paper)', color: 'var(--muted)' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>الطفل</th>
              <th style={{ textAlign: 'right', padding: 12 }}>المستوى</th>
              <th style={{ textAlign: 'right', padding: 12 }}>المبلغ</th>
              <th style={{ textAlign: 'right', padding: 12 }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {children.map((c) => {
              const lv = levelInfo(c.level, levelNames)
              const rec = getRec(c.id)
              return (
                <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: 12 }}><span className="pill" style={{ background: lv.tint, color: lv.color }}>{lv.name}</span></td>
                  <td style={{ padding: 12, color: 'var(--muted)' }}>{rec ? `${rec.amount} ر.س` : '—'}</td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => togglePaid(c)} className="pill" style={{
                      background: rec?.paid ? '#DCEEEA' : '#FCEBEA', color: rec?.paid ? '#4E9C8F' : '#C1524A', border: 'none', cursor: 'pointer',
                    }}>{rec?.paid ? `مسددة بتاريخ ${rec.paid_date}` : 'غير مسددة'}</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {amountModal && (
        <div className="modal-overlay" onClick={() => setAmountModal(null)}>
          <AmountForm child={amountModal} onCancel={() => setAmountModal(null)} onConfirm={(amt) => confirmNewFee(amountModal, amt)} />
        </div>
      )}
    </div>
  )
}

function AmountForm({ child, onCancel, onConfirm }) {
  const [amount, setAmount] = useState('')
  return (
    <div className="modal-box" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
      <h3 style={{ margin: 0 }}>تسجيل سداد — {child.name}</h3>
      <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="المبلغ بالريال" autoFocus />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-primary" onClick={() => amount && onConfirm(amount)}>تأكيد</button>
      </div>
    </div>
  )
}
