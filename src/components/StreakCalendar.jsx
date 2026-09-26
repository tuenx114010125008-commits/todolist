import { addDays, dateKey } from '../utils/streak'

export default function StreakCalendar({ completedDays, missedDays = new Set(), t }) {
  const days = Array.from({ length: 28 }, (_, index) => addDays(dateKey(), -27 + index))

  return (
    <section className="calendar-panel">
      <div className="section-heading">
        <h2>{t.calendar}</h2>
        <span>{t.lastFourWeeks}</span>
      </div>
      <div className="calendar-grid" role="list">
        {days.map((day) => {
          const isStreakDay = completedDays.has(day)
          const isMissedDay = missedDays.has(day)

          return (
            <div
              key={day}
              className={`calendar-day ${isStreakDay ? 'marked' : ''} ${isMissedDay ? 'missed' : ''}`}
              title={day}
              aria-label={day}
              role="listitem"
            >
              <span>{new Date(`${day}T00:00:00`).getDate()}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
