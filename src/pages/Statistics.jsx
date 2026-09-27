import StreakCalendar from '../components/StreakCalendar'
import { getStreakStats } from '../utils/streak'

export default function Statistics({ todos, gems, recoveredDays, onRecover, t }) {
  const stats = getStreakStats(todos, recoveredDays)
  const completed = todos.filter((todo) => todo.completed).length
  const values = [
    [t.totalTasks, todos.length],
    [t.completedTasks, completed],
    [t.activeTasks, todos.length - completed],
    [t.completionRate, `${todos.length ? Math.round((completed / todos.length) * 100) : 0}%`],
    [t.currentStreak, `${stats.currentStreak} ${t.days}`],
    [t.longestStreak, `${stats.longestStreak} ${t.days}`],
    [t.gemProgress, `${stats.gemProgress}/7`],
    [t.gems, `💎 ${gems}`],
  ]

  const todoDays = new Set(todos.map((todo) => todo.dueDate).filter(Boolean))

  return (
    <main className="page-shell statistics-page">
      <div className="simple-heading">
        <h1>{t.nav.statistics}</h1>
      </div>
      <div className="stats-grid">
        {values.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <StreakCalendar
        completedDays={stats.completedDays}
        missedDays={stats.missedDays}
        recoveredDays={stats.recoveredDays}
        todoDays={todoDays}
        onRecoverDay={onRecover}
        gems={gems}
        t={t}
      />
    </main>
  )
}
