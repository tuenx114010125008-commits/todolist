import { addDays, dateKey } from '../utils/streak'

export default function StreakCalendar({
  completedDays = new Set(),
  missedDays = new Set(),
  recoveredDays = new Set(),
  onRecoverDay,
  gems = 0,
  t,
}) {
  const days = Array.from({ length: 28 }, (_, index) => addDays(dateKey(), -27 + index))

  const handleDayClick = (day, isMissed) => {
    if (!isMissed || !onRecoverDay) return
    if (gems < 1) {
      alert(t.needMoreGems || 'You need at least 1 Gem to recover this day.')
      return
    }
    const message = (t.confirmRecover || 'Spend 1 Gem to recover streak on {date}?').replace('{date}', day)
    if (window.confirm(message)) {
      onRecoverDay(day)
    }
  }

  return (
    <section className="calendar-panel">
      <div className="section-heading">
        <h2>{t.calendar}</h2>
        <span>{t.lastFourWeeks}</span>
      </div>
      <div className="calendar-grid" role="list">
        {days.map((day) => {
          const isRecovered = recoveredDays.has(day)
          const isCompleted = completedDays.has(day) && !isRecovered
          const isMissed = missedDays.has(day) && !isRecovered

          let statusClass = ''
          let badge = null
          let tooltip = day

          if (isRecovered) {
            statusClass = 'recovered'
            badge = '💎'
            tooltip = `${day}: ${t.recovered || 'Recovered'}`
          } else if (isCompleted) {
            statusClass = 'completed marked'
            badge = '🔥'
            tooltip = `${day}: ${t.completedDay || 'Completed (100%)'}`
          } else if (isMissed) {
            statusClass = 'missed'
            badge = '✕'
            tooltip = `${day}: ${t.missed || 'Missed'}${gems >= 1 ? ` • ${t.clickToRecover || 'Click to recover (1 Gem)'}` : ''}`
          }

          return (
            <button
              type="button"
              key={day}
              className={`calendar-day ${statusClass}`}
              title={tooltip}
              aria-label={tooltip}
              onClick={() => handleDayClick(day, isMissed)}
              disabled={!isMissed}
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
        <span className="legend-item">
          <span className="legend-icon flame" aria-hidden="true">🔥</span> {t.completedDay || 'Completed'}
        </span>
        <span className="legend-item">
          <span className="legend-icon gem" aria-hidden="true">💎</span> {t.recovered || 'Recovered'}
        </span>
        <span className="legend-item">
          <span className="legend-icon missed" aria-hidden="true">✕</span> {t.missed || 'Missed'}
        </span>
      </div>
    </section>
  )
}
