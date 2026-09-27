import { useState } from 'react'
import { dateKey } from '../utils/streak'

export default function TodoForm({ onAdd, selectedDate, onGoToToday, t }) {
  const [title, setTitle] = useState('')
  const today = dateKey()
  const isToday = selectedDate === today

  const submit = (event) => {
    event.preventDefault()
    if (!isToday) return
    if (!title.trim() || !selectedDate) return
    onAdd({ title, date: selectedDate })
    setTitle('')
  }

  const formattedDate = (() => {
    try {
      return new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return selectedDate
    }
  })()

  return (
    <form className={`todo-form ${!isToday ? 'is-past-date' : ''}`} onSubmit={submit}>
      <label>
        <span>{t.taskPlaceholder}</span>
        <input
          value={title}
          disabled={!isToday}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={isToday ? t.taskPlaceholder : (t.onlyTodayNotice || 'Chỉ có thể thêm việc cho ngày hôm nay')}
        />
      </label>
      <div className="date-display">
        <span className="date-display-label">{t.date}</span>
        <span className="date-display-value">
          📅 {formattedDate} {isToday ? `(${t.today || 'Hôm nay'})` : ''}
        </span>
      </div>
      <div className="todo-form-actions">
        {isToday ? (
          <button className="primary-button" type="submit">
            {t.addTask}
          </button>
        ) : (
          <button
            className="secondary-button go-today-button"
            type="button"
            onClick={onGoToToday}
            title={t.goToToday || 'Về ngày hôm nay để thêm việc'}
          >
            👉 {t.goToToday || 'Về hôm nay'}
          </button>
        )}
      </div>
      {!isToday && (
        <p className="past-date-notice">
          ⚠️ {t.cannotAddPastDate || 'Không thể thêm việc cho những ngày đã qua. Hãy chọn ngày hôm nay để thêm việc mới.'}
        </p>
      )}
    </form>
  )
}
