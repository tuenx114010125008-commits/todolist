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
  const today = dateKey()
  const missedDays = new Set()

  // Only past days with recorded todos where not all todos were completed
  Object.entries(grouped).forEach(([date, value]) => {
    if (date < today && !recoveredSet.has(date) && value.total > 0 && value.total !== value.completed) {
      missedDays.add(date)
    }
  })

  return missedDays
}

// Rule: 7 ngày hoàn thành todo liên tiếp = 1 Gem
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

  // Find all consecutive streak runs
  const runs = []
  let currentRun = []

  sortedDates.forEach((date) => {
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

  // Longest streak
  let longestStreak = 0
  runs.forEach((r) => {
    longestStreak = Math.max(longestStreak, r.length)
  })

  // Current streak calculation:
  // 1. If a run contains today, that's active.
  // 2. Else if a run contains yesterday, that's active.
  // 3. Otherwise, use the latest streak run in history (allowing continuous recovery).
  let currentStreak = 0
  let activeRun = null

  if (runs.length > 0) {
    const todayRun = runs.find((r) => r.includes(today))
    const yesterdayRun = runs.find((r) => r.includes(yesterday))

    if (todayRun) {
      activeRun = todayRun
    } else if (yesterdayRun) {
      activeRun = yesterdayRun
    } else {
      activeRun = runs[runs.length - 1]
    }
    currentStreak = activeRun.length
  }

  // Gem progress: progress towards next 7-day milestone
  const gemProgress = currentStreak % 7

  // Identify candidate recovery date (ONLY from days that had tasks and were missed):
  // First priority: Extend active run backward (e.g. Day before start of run if it was missed)
  // Second priority: Extend active run forward (e.g. Day after end of run if it was missed)
  // Third priority: Most recent missed day
  let recoveryDate = null
  let isStreakLost = false

  if (activeRun && activeRun.length > 0) {
    const dayBefore = addDays(activeRun[0], -1)
    const dayAfter = addDays(activeRun[activeRun.length - 1], 1)

    if (dayBefore && missedDays.has(dayBefore)) {
      recoveryDate = dayBefore
    } else if (dayAfter && missedDays.has(dayAfter)) {
      recoveryDate = dayAfter
    } else {
      const sortedMissed = [...missedDays].sort()
      if (sortedMissed.length > 0) {
        recoveryDate = sortedMissed[sortedMissed.length - 1]
      }
    }
  } else {
    const sortedMissed = [...missedDays].sort()
    if (sortedMissed.length > 0) {
      recoveryDate = sortedMissed[sortedMissed.length - 1]
    }
  }

  if (activeRun && !activeRun.includes(today) && !activeRun.includes(yesterday)) {
    isStreakLost = true
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
