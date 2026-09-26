import { useMemo, useState } from 'react'
import TodoForm from '../components/TodoForm'
import TodoList from '../components/TodoList'
import StreakCard from '../components/StreakCard'
import StreakCalendar from '../components/StreakCalendar'
import { dateKey, getStreakStats } from '../utils/streak'

export default function Home({ user, todos, onAdd, onToggle, onDelete, onRecover, gems, t }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(dateKey())
  const stats = getStreakStats(todos, user.recoveredDays)
  const visible = useMemo(
    () =>
      todos
        .filter((todo) => todo.date === selectedDate)
        .filter((todo) => filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed))
        .filter((todo) => todo.title.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => Number(a.completed) - Number(b.completed)),
    [todos, selectedDate, filter, search],
  )

  return (
    <main className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>{t.greeting}, {user.username}.</h1>
          <p className="muted">{t.focus}</p>
        </div>
        <StreakCard
          current={stats.currentStreak}
          longest={stats.longestStreak}
          gems={gems}
          gemProgress={stats.gemProgress}
          canRecover={Boolean(stats.recoveryDate && gems >= 1)}
          recoveryDate={stats.recoveryDate}
          onRecover={onRecover}
          t={t}
        />
      </div>

      <section className="content-grid">
        <div className="tasks-panel">
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Task filters">
              {['all', 'active', 'completed'].map((item) => (
                <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>
                  {t[item]}
                </button>
              ))}
            </div>
            <input
              className="search-input"
              aria-label={t.search}
              placeholder={t.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <TodoForm onAdd={onAdd} selectedDate={selectedDate} onDateChange={setSelectedDate} t={t} />
          <TodoList todos={visible} onToggle={onToggle} onDelete={onDelete} t={t} />
        </div>
        <StreakCalendar
          completedDays={stats.completedDays}
          missedDays={stats.missedDays}
          recoveredDays={stats.recoveredDays}
          onRecoverDay={onRecover}
          gems={gems}
          t={t}
        />
      </section>
    </main>
  )
}
