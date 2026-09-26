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

export const dayDistance = (from, to) =>
  Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / MS_PER_DAY)

export const getTodoDayMap = (todos) =>
  todos.reduce((days, todo) => {
    if (!days[todo.date]) days[todo.date] = { total: 0, completed: 0 }
    days[todo.date].total += 1
    if (todo.completed) days[todo.date].completed += 1
    return days
  }, {})

export const getFullyCompletedDays = (todos) => {
  const grouped = getTodoDayMap(todos)
  return new Set(
    Object.entries(grouped)
      .filter(([, value]) => value.total > 0 && value.total === value.completed)
      .map(([date]) => date),
  )
}

export const getCompletedDays = (todos, recoveredDays = []) => {
  const completedDays = getFullyCompletedDays(todos)
  recoveredDays.forEach((date) => completedDays.add(date))
  return completedDays
}

export const getMissedDays = (todos, recoveredDays = []) => {
  const grouped = getTodoDayMap(todos)
  const recoveredSet = new Set(recoveredDays)
  const fullyCompleted = getFullyCompletedDays(todos)
  const allStreakDays = new Set([...fullyCompleted, ...recoveredSet])
  const today = dateKey()
  const missedDays = new Set()

  // 1. Days with todos where not all todos are completed and not recovered
  Object.entries(grouped).forEach(([date, value]) => {
    if (date < today && !recoveredSet.has(date) && value.total > 0 && value.total !== value.completed) {
      missedDays.add(date)
    }
  })

  // 2. Gap days in the past 28-day window that broke a streak
  for (let offset = -28; offset < 0; offset++) {
    const day = addDays(today, offset)
    if (!allStreakDays.has(day) && !recoveredSet.has(day)) {
      const prev = addDays(day, -1)
      const next = addDays(day, 1)
      // If previous day was completed/recovered or next day is completed/recovered
      if (allStreakDays.has(prev) || allStreakDays.has(next)) {
        missedDays.add(day)
      }
    }
  }

  return missedDays
}

export const calculateAwardableGemCycles = (todos, recoveredDays = []) => {
  const fullyCompleted = getFullyCompletedDays(todos)
  const streakSet = new Set([...fullyCompleted, ...recoveredDays])
  const sorted = [...streakSet].sort()
  if (sorted.length < 7) return []

  const runs = []
  let currentRun = []

  sorted.forEach((date) => {
    if (currentRun.length === 0) {
      currentRun.push(date)
    } else {
      const prev = currentRun[currentRun.length - 1]
      if (dayDistance(prev, date) === 1) {
        currentRun.push(date)
      } else {
        runs.push(currentRun)
        currentRun = [date]
      }
    }
  })
  if (currentRun.length > 0) {
    runs.push(currentRun)
  }

  const cycles = []
  runs.forEach((run) => {
    const cycleCount = Math.floor(run.length / 7)
    for (let i = 0; i < cycleCount; i++) {
      const start = run[i * 7]
      const end = run[i * 7 + 6]
      cycles.push(`${start}_${end}`)
    }
  })

  return cycles
}

export const evaluateGemRewards = (account, todos) => {
  if (!account) return null
  const allCycles = calculateAwardableGemCycles(todos, account.recoveredDays || [])
  const awarded = new Set(account.awardedCycles || [])
  const newCycles = allCycles.filter((cycle) => !awarded.has(cycle))

  if (newCycles.length === 0) return null

  return {
    newGems: newCycles.length,
    updatedAwardedCycles: [...(account.awardedCycles || []), ...newCycles],
    newCycles,
  }
}

export const getStreakStats = (todos, recoveredDays = []) => {
  const recoveredSet = new Set(recoveredDays)
  const fullyCompletedDays = getFullyCompletedDays(todos)
  const allStreakDays = new Set([...fullyCompletedDays, ...recoveredSet])
  const missedDays = getMissedDays(todos, recoveredDays)

  const sortedDates = [...allStreakDays].sort()
  const today = dateKey()
  const yesterday = addDays(today, -1)

  // Longest streak
  let longestStreak = 0
  let run = 0
  let previous = null

  sortedDates.forEach((date) => {
    run = previous && dayDistance(previous, date) === 1 ? run + 1 : 1
    longestStreak = Math.max(longestStreak, run)
    previous = date
  })

  // Current streak
  const anchor = allStreakDays.has(today) ? today : allStreakDays.has(yesterday) ? yesterday : null
  let currentStreak = 0
  let startOfCurrentStreak = anchor

  if (anchor) {
    let cursor = anchor
    while (allStreakDays.has(cursor)) {
      currentStreak += 1
      startOfCurrentStreak = cursor
      cursor = addDays(cursor, -1)
    }
  }

  // Gem progress towards next 7-day milestone
  const gemProgress = currentStreak % 7

  // Identify recovery date
  let isStreakLost = false
  let recoveryDate = null

  if (currentStreak === 0) {
    const latestStreakDay = sortedDates.at(-1) || null
    if (latestStreakDay) {
      isStreakLost = true
      const breakDay = addDays(latestStreakDay, 1)
      if (breakDay <= yesterday && (missedDays.has(breakDay) || !allStreakDays.has(breakDay))) {
        recoveryDate = breakDay
      } else if (missedDays.has(yesterday) || !allStreakDays.has(yesterday)) {
        recoveryDate = yesterday
      }
    }
  } else if (startOfCurrentStreak) {
    // Current streak is active; check if the day right before this streak can be recovered
    const dayBeforeStreak = addDays(startOfCurrentStreak, -1)
    if (missedDays.has(dayBeforeStreak) || (allStreakDays.has(addDays(dayBeforeStreak, -1)) && !allStreakDays.has(dayBeforeStreak))) {
      recoveryDate = dayBeforeStreak
    }
  }

  return {
    completedDays: fullyCompletedDays,
    recoveredDays: recoveredSet,
    allStreakDays,
    missedDays,
    currentStreak,
    longestStreak,
    gemProgress,
    isStreakLost,
    recoveryDate,
  }
}
