import { useState } from 'react'

export default function TodoForm({ onAdd, selectedDate, onDateChange, t }) {
  const [title, setTitle] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!title.trim() || !selectedDate) return
    onAdd({ title, date: selectedDate })
    setTitle('')
  }

  return (
    <form className="todo-form" onSubmit={submit}>
      <label>
        <span>{t.taskPlaceholder}</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.taskPlaceholder} />
      </label>
      <label>
        <span>{t.date}</span>
        <input type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} />
      </label>
      <button className="primary-button" type="submit">{t.addTask}</button>
    </form>
  )
}
