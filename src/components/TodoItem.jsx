import { Link } from 'react-router-dom'

export default function TodoItem({ todo, onToggle, onDelete, t }) {
  return (
    <article className={`todo-item ${todo.completed ? 'is-complete' : ''}`}>
      <button className="check-button" type="button" aria-label={todo.completed ? t.undo : t.complete} onClick={() => onToggle(todo.id)}>
        <span aria-hidden="true">{todo.completed ? 'ok' : ''}</span>
      </button>
      <Link className="todo-title" to={`/todo/${todo.id}`}>{todo.title}</Link>
      <span className="todo-date">{todo.date}</span>
      <button className="delete-button" type="button" aria-label={t.delete} onClick={() => onDelete(todo.id)}>x</button>
    </article>
  )
}
