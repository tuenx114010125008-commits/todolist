import { addDays, dateKey } from '../utils/streak'

export default function StreakCalendar({
  completedDays = new Set(),
  missedDays = new Set(),
  recoveredDays = new Set(),
  todoDays = new Set(),
  selectedDate,
  onRecoverDay,
  onSelectDay,
  gems = 0,
  t,
}) {
  const today = dateKey()
  const days = Array.from({ length: 28 }, (_, index) => addDays(today, -27 + index))

  const windowCompleted = days.filter((day) => completedDays.has(day) && !recoveredDays.has(day)).length
  const windowRecovered = days.filter((day) => recoveredDays.has(day)).length
  const windowMissed = days.filter((day) => missedDays.has(day) && !recoveredDays.has(day)).length

  const handleDayClick = (day) => {
    // When clicking any clickable day (including missed days), only select it to view its details
    if (onSelectDay) {
      onSelectDay(day)
    }
  }

  return (
    <section className="calendar-panel">
      <div className="section-heading">
        <h2>{t.calendar}</h2>
        <span>{t.lastFourWeeks}</span>
      </div>
      <div className="calendar-grid" role="list">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
          <span key={d} className="calendar-weekday">{d}</span>
        ))}
        {days.map((day) => {
          const isRecovered = recoveredDays.has(day)
          const isCompleted = completedDays.has(day) && !isRecovered
          const isMissed = missedDays.has(day) && !isRecovered
          const hasTodos = todoDays.has(day)
          const isToday = day === today
          const isSelected = selectedDate === day
          const isClickable = true

          let statusClass = ''
          let badge = null
          let tooltip = day

          if (isRecovered) {
            statusClass = 'recovered'
            badge = '💎'
            tooltip = `${day}: ${t.recovered || 'Đã khôi phục'}`
          } else if (isCompleted) {
            statusClass = 'completed marked'
            badge = '🔥'
            tooltip = `${day}: ${t.completedDay || 'Đã hoàn thành (100%)'}`
          } else if (isMissed) {
            statusClass = 'missed'
            badge = '✕'
            tooltip = `${day}: ${t.missed || 'Bị lỡ'}`
          } else if (hasTodos) {
            statusClass = 'has-todos'
            tooltip = `${day}: ${t.activeTasks || 'Có việc cần làm'}`
          }

          if (isToday) {
            statusClass += ' is-today'
            tooltip += ` (${t.today || 'Hôm nay'})`
          }

          if (isSelected) {
            statusClass += ' selected'
          }

          if (!onSelectDay) {
            statusClass += ' display-only'
          }

          return (
            <button
              type="button"
              key={day}
              className={`calendar-day ${statusClass}`}
              title={tooltip}
              aria-label={tooltip}
              onClick={() => handleDayClick(day)}
              disabled={onSelectDay ? !isClickable : false}
              tabIndex={onSelectDay && !isClickable ? -1 : 0}
            >
              <span className="calendar-day-num">{new Date(`${day}T00:00:00`).getDate()}</span>
              {badge && (
                <span className="calendar-day-badge" aria-hidden="true">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="calendar-legend">
        <span className="legend-item legend-item-completed" title={`${windowCompleted} ${t.completedDay || 'ngày hoàn thành 100%'}`}>
          <span className="legend-icon flame" aria-hidden="true">🔥</span>
          <span className="legend-label">{t.completedDay || 'Đã hoàn thành'}</span>
          <span className="legend-count">({windowCompleted})</span>
        </span>
        <span className="legend-item legend-item-recovered" title={`${windowRecovered} ${t.recovered || 'ngày đã khôi phục'}`}>
          <span className="legend-icon gem" aria-hidden="true">💎</span>
          <span className="legend-label">{t.recovered || 'Đã khôi phục'}</span>
          <span className="legend-count">({windowRecovered})</span>
        </span>
        <span className="legend-item legend-item-missed" title={`${windowMissed} ${t.missed || 'ngày bị lỡ'}`}>
          <span className="legend-icon missed" aria-hidden="true">✕</span>
          <span className="legend-label">{t.missed || 'Bị lỡ'}</span>
          <span className="legend-count">({windowMissed})</span>
        </span>
      </div>
    </section>
  )
}
