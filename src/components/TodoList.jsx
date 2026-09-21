import TodoItem from './TodoItem'

export default function TodoList({ todos, onToggle, onDelete, t }) {
  if (!todos.length) {
    return (
      <div className="empty-state">
        <span aria-hidden="true">0</span>
        <strong>{t.noTasks}</strong>
        <p>{t.noTasksHint}</p>
      </div>
    )
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} t={t} />
      ))}
    </div>
  )
}
