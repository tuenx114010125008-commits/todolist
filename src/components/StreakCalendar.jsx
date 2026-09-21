import { addDays, dateKey } from '../utils/streak'

export default function StreakCalendar({ completedDays, selectedDate, onSelectDate, t }) {
  const days = Array.from({ length: 28 }, (_, index) => addDays(dateKey(), -27 + index))

  return (
    <section className="calendar-panel">
      <div className="section-heading">
        <h2>{t.calendar}</h2>
        <span>{t.lastFourWeeks}</span>
      </div>
      <div className="calendar-grid">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className={`${completedDays.has(day) ? 'marked' : ''} ${selectedDate === day ? 'selected' : ''}`}
            title={day}
            aria-label={day}
            onClick={() => onSelectDate?.(day)}
          >
            <span>{new Date(`${day}T00:00:00`).getDate()}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
