import { useEffect, useState } from 'react'

export default function TodoItem({ todo, onToggle, onDelete, onEdit, isReadOnly = false, t }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)

  useEffect(() => {
    setEditTitle(todo.title)
  }, [todo.title])

  const saveEdit = () => {
    if (isReadOnly) return
    const trimmed = editTitle.trim()
    if (!trimmed) return
    onEdit(todo.id, { title: trimmed })
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditTitle(todo.title)
    setEditing(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') saveEdit()
    if (event.key === 'Escape') cancelEdit()
  }

  return (
    <article className={`todo-item ${todo.completed ? 'done' : ''} ${isReadOnly ? 'is-readonly' : ''}`}>
      <input
        type="checkbox"
        className="todo-check"
        checked={todo.completed}
        disabled={isReadOnly}
        onChange={() => !isReadOnly && onToggle(todo.id)}
        aria-label={todo.completed ? t.undo : t.complete}
        title={isReadOnly ? (t.cannotModifyPastDate || 'Không thể tích hoàn thành công việc ngày đã qua') : undefined}
      />
      {editing && !isReadOnly ? (
        <div className="todo-edit-inline">
          <input
            className="todo-edit-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="todo-edit-actions">
            <button className="save-btn" type="button" onClick={saveEdit}>{t.save}</button>
            <button className="cancel-btn" type="button" onClick={cancelEdit}>{t.cancel}</button>
          </div>
        </div>
      ) : (
        <>
          <span className="todo-title" title={todo.title}>{todo.title}</span>
          <span className="todo-date">{todo.date}</span>
          {!isReadOnly && (
            <div className="todo-actions">
              <button className="edit-button" type="button" aria-label={t.edit} title={t.edit} onClick={() => setEditing(true)}>✏️</button>
              <button className="delete-button" type="button" aria-label={t.delete} title={t.delete} onClick={() => onDelete(todo.id)}>✕</button>
            </div>
          )}
        </>
      )}
    </article>
  )
}
