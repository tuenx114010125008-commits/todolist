const MS_PER_DAY = 86400000

export const dateKey = (date = new Date()) => {
  const value = new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDays = (key, amount) => {
  const date = new Date(`${key}T00:00:00`)
  date.setDate(date.getDate() + amount)
  return dateKey(date)
}

const dayDistance = (from, to) =>
  Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / MS_PER_DAY)

export const getTodoDayMap = (todos) =>
  todos.reduce((days, todo) => {
    if (!days[todo.date]) days[todo.date] = { total: 0, completed: 0 }
    days[todo.date].total += 1
    if (todo.completed) days[todo.date].completed += 1
    return days
  }, {})

export const getCompletedDays = (todos, recoveredDays = []) => {
  const grouped = getTodoDayMap(todos)
  const completedDays = new Set(
    Object.entries(grouped)
      .filter(([, value]) => value.total > 0 && value.total === value.completed)
      .map(([date]) => date),
  )

  recoveredDays.forEach((date) => completedDays.add(date))
  return completedDays
}

export const getStreakStats = (todos, recoveredDays = []) => {
  const completedDays = getCompletedDays(todos, recoveredDays)
  const dates = [...completedDays].sort()
  const today = dateKey()
  const yesterday = addDays(today, -1)
  let longestStreak = 0
  let run = 0
  let previous

  dates.forEach((date) => {
    run = previous && dayDistance(previous, date) === 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
    previous = date
  })

  const anchor = completedDays.has(today) ? today : completedDays.has(yesterday) ? yesterday : null
  let currentStreak = 0
  if (anchor) {
    let cursor = anchor
    while (completedDays.has(cursor)) {
      currentStreak += 1
      cursor = addDays(cursor, -1)
    }
  }

  const latestCompletedDay = dates.at(-1) || null
  const isStreakLost = Boolean(latestCompletedDay && currentStreak === 0)
  const recoveryDate = isStreakLost ? yesterday : null

  return {
    completedDays,
    currentStreak,
    longestStreak,
    isStreakLost,
    recoveryDate,
    latestCompletedDay,
  }
}
