import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function KindergartenModal({ kindergartens, activeId, userId, onClose, onSwitch, onChanged }) {
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [busy, setBusy] = useState(false)

  const addKindergarten = async () => {
    if (!newName.trim()) return
    setBusy(true)
    const { error } = await supabase.from('kindergartens').insert({ owner_id: userId, name: newName.trim() })
    setBusy(false)
    if (error) { alert(error.message); return }
    setNewName('')
    onChanged()
  }

  const renameKindergarten = async (id, name) => {
    if (!name.trim()) return
    const { error } = await supabase.from('kindergartens').update({ name: name.trim() }).eq('id', id)
    if (error) { alert(error.message); return }
    setRenamingId(null)
    onChanged()
  }

  const deleteKindergarten = async (id) => {
    const { error } = await supabase.from('kindergartens').delete().eq('id', id)
    if (error) { alert(error.message); return }
    setConfirmDeleteId(null)
    onChanged()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="disp" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>روضاتي</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          كل روضة لها بياناتها المستقلة تمامًا، محمية على مستوى قاعدة البيانات.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {kindergartens.map((k) => (
            <div key={k.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12,
              background: k.id === activeId ? '#DCEEEA' : 'var(--paper)',
              border: `1.5px solid ${k.id === activeId ? 'var(--teal)' : 'var(--line)'}`,
            }}>
              {renamingId === k.id ? (
                <input className="input" autoFocus value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && renameKindergarten(k.id, renameValue)}
                  style={{ flex: 1 }} />
              ) : (
                <button onClick={() => onSwitch(k.id)} style={{
                  flex: 1, textAlign: 'right', background: 'none', border: 'none', fontWeight: 700, fontSize: 14,
                }}>
                  {k.id === activeId ? '✓ ' : ''}{k.name}
                </button>
              )}
              {renamingId === k.id ? (
                <button onClick={() => renameKindergarten(k.id, renameValue)} style={{ background: 'none', border: 'none', color: 'var(--teal)' }}>✓</button>
              ) : (
                <button onClick={() => { setRenamingId(k.id); setRenameValue(k.name) }} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>✎</button>
              )}
              <button onClick={() => setConfirmDeleteId(k.id)} style={{ background: 'none', border: 'none', color: '#C1524A' }}>🗑</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
          <input className="input" placeholder="اسم روضة جديدة" value={newName}
            onChange={(e) => setNewName(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" disabled={busy} onClick={addKindergarten}>+ إضافة</button>
        </div>

        {confirmDeleteId && (
          <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="modal-box" style={{ maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
              <p style={{ fontWeight: 600 }}>سيتم حذف هذه الروضة وكل بياناتها نهائيًا. هل تريد المتابعة؟</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)}>إلغاء</button>
                <button className="btn btn-danger" onClick={() => deleteKindergarten(confirmDeleteId)}>حذف</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
