import { useMemo, useState } from 'react'
import TodoForm from '../components/TodoForm'
import TodoList from '../components/TodoList'
import StreakCard from '../components/StreakCard'
import StreakCalendar from '../components/StreakCalendar'
import { dateKey, getStreakStats, getTodoDayMap } from '../utils/streak'

export default function Home({ user, todos, onAdd, onToggle, onDelete, onEdit, onRecover, gems, t }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(dateKey())
  const stats = getStreakStats(todos, user.recoveredDays)

  // Build a Set of all dates that have at least one todo (any status: completed or not)
  const todoDays = useMemo(() => {
    const dayMap = getTodoDayMap(todos)
    return new Set(Object.keys(dayMap))
  }, [todos])

  const visible = useMemo(
    () =>
      todos
        .filter((todo) => todo.date === selectedDate)
        .filter((todo) => filter === 'all' || (filter === 'completed' ? todo.completed : !todo.completed))
        .filter((todo) => todo.title.toLowerCase().includes(search.trim().toLowerCase()))
        .sort((a, b) => Number(a.completed) - Number(b.completed)),
    [todos, selectedDate, filter, search],
  )

  const today = dateKey()
  const isPastDate = selectedDate < today

  return (
    <main className="page-shell">
      <div className="home-layout">

        {/* ── Left column: Streak Card & Calendar on the left ── */}
        <div className="home-left">
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
          <StreakCalendar
            completedDays={stats.completedDays}
            missedDays={stats.missedDays}
            recoveredDays={stats.recoveredDays}
            todoDays={todoDays}
            selectedDate={selectedDate}
            onRecoverDay={onRecover}
            onSelectDay={setSelectedDate}
            gems={gems}
            t={t}
          />
        </div>

        {/* ── Right column: Greeting & Tasks Panel ── */}
        <div className="home-right">
          <div className="home-greeting">
            <p className="eyebrow">
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </p>
            <h1>{t.greeting}, {user.username}.</h1>
          </div>

          <div className="tasks-panel">
            <div className="toolbar">
              <div className="segmented" role="group" aria-label="Task filters">
                {['all', 'active', 'completed'].map((item) => (
                  <button
                    key={item}
                    className={filter === item ? 'selected' : ''}
                    onClick={() => setFilter(item)}
                  >
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
            <TodoForm
              onAdd={onAdd}
              selectedDate={selectedDate}
              onGoToToday={() => setSelectedDate(dateKey())}
              t={t}
            />
            <TodoList
              todos={visible}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              isReadOnly={isPastDate}
              t={t}
            />
          </div>
        </div>

      </div>
    </main>
  )
}
