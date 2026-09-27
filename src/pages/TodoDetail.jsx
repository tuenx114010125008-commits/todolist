import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { dateKey } from '../utils/streak'

export default function TodoDetail({ todos, onToggle, onDelete, onEdit, t }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const todo = todos.find((item) => item.id === id)
  const isPastDate = Boolean(todo && todo.date < dateKey())
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(todo ? { title: todo.title, date: todo.date } : { title: '', date: '' })

  if (!todo) {
    return (
      <main className="page-shell narrow">
        <h1>{t.detailNotFound}</h1>
        <Link className="back-link" to="/">{t.nav.today}</Link>
      </main>
    )
  }

  const save = (event) => {
    event.preventDefault()
    if (isPastDate) return
    if (!form.title.trim() || !form.date) return
    onEdit(todo.id, form)
    setEditing(false)
  }

  const remove = () => {
    if (isPastDate) return
    onDelete(todo.id)
    navigate('/')
  }

  return (
    <main className="page-shell narrow">
      <Link className="back-link" to="/">{t.nav.today}</Link>
      <div className="detail-card">
        {isPastDate && (
          <p className="past-date-notice" style={{ marginBottom: 16 }}>
            ⚠️ {t.cannotModifyPastDate || 'Không thể tích hoàn thành, sửa hoặc xóa công việc của những ngày đã qua.'}
          </p>
        )}
        {editing && !isPastDate ? (
          <form className="stack-form" onSubmit={save}>
            <label>{t.taskPlaceholder}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>{t.date}<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
            <div className="detail-actions">
              <button className="primary-button" type="submit">{t.save}</button>
              <button className="text-button" type="button" onClick={() => setEditing(false)}>{t.cancel}</button>
            </div>
          </form>
        ) : (
          <>
            <p className="eyebrow">{todo.date} {isPastDate ? `• ${t.readOnlyDay || 'Chỉ xem'}` : ''}</p>
            <h1>{todo.title}</h1>
            <p className="muted">{todo.completed ? t.completed : t.active}</p>
            {!isPastDate ? (
              <div className="detail-actions">
                <button className="primary-button" type="button" onClick={() => onToggle(todo.id)}>{todo.completed ? t.undo : t.complete}</button>
                <button className="choice" type="button" onClick={() => setEditing(true)}>{t.edit}</button>
                <button className="text-button danger" type="button" onClick={remove}>{t.delete}</button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}
