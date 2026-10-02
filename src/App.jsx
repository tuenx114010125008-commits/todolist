import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import en from './translations/en'
import vi from './translations/vi'
import { addDays, dateKey, evaluateGemRewards, getStreakStats } from './utils/streak'
import './App.css'

const readJson = (key, fallback, storage = localStorage) => {
  try {
    return JSON.parse(storage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

export const DEMO_ACCOUNT = {
  id: 'demo',
  username: 'Demo',
  email: 'demo.daymark@gmail.com',
  password: 'daymark',
  securityQuestion: 'Tên thương hiệu của ứng dụng này là gì?',
  securityAnswer: 'daymark',
  gems: 7,
  gemDates: [],
  recoveredDays: ['2026-09-23', '2026-09-24'],
  awardedCycles: [],
}

const DEMO_SEED_VERSION = 'v5_streak_fix'

const createDemoTodos = () => {
  const today = dateKey()
  const todo = (idSuffix, date, title, completed) => ({
    id: `demo-${date}-${idSuffix}`,
    userId: DEMO_ACCOUNT.id,
    title,
    date,
    completed,
  })

  const items = [
    // Day 10 (2026-09-10: Completed 🔥)
    todo('1', '2026-09-10', 'Setup project repository', true),
    todo('2', '2026-09-10', 'Review wireframe designs', true),

    // Day 11 (2026-09-11: Missed ✕ - has incomplete task)
    todo('1', '2026-09-11', 'Setup design system tokens', true),
    todo('2', '2026-09-11', 'Prepare sprint backlog', false),
    todo('3', '2026-09-11', 'Client feedback review', false),

    // Day 12 (2026-09-12: Completed 🔥)
    todo('1', '2026-09-12', 'Update typography scale', true),
    todo('2', '2026-09-12', 'Design color palette tokens', true),

    // Day 13 (2026-09-13: Missed ✕ - has incomplete task)
    todo('1', '2026-09-13', 'Weekly architecture sync', true),
    todo('2', '2026-09-13', 'Update API documentation', false),

    // Day 20 (2026-09-20: Missed ✕ - has incomplete task)
    todo('1', '2026-09-20', 'Archive old project assets', false),
    todo('2', '2026-09-20', 'Review team pull requests', false),

    // Day 21 (2026-09-21: Missed ✕ - has incomplete task so recovering Day 22 gives streak = 6)
    todo('1', '2026-09-21', 'Organize the workspace', true),
    todo('2', '2026-09-21', 'Clean up project dependencies', false),

    // Day 22 (2026-09-22: Missed ✕ - has incomplete task)
    todo('1', '2026-09-22', 'Weekly backup check', true),
    todo('2', '2026-09-22', 'Draft design presentation', false),
    todo('3', '2026-09-22', 'Send follow-up emails', false),

    // Day 25 (2026-09-25: Completed 🔥)
    todo('1', '2026-09-25', 'Take a short walk', true),
    todo('2', '2026-09-25', 'Write code documentation', true),

    // Day 26 (2026-09-26: Completed 🔥)
    todo('1', '2026-09-26', 'Plan tomorrow goals', true),
    todo('2', '2026-09-26', 'Review pull requests', true),

    // Day 27 (2026-09-27: Completed 🔥)
    todo('1', '2026-09-27', 'Review today\'s priorities', true),
    todo('2', '2026-09-27', 'Read for 20 minutes', true),
  ]

  // If today is beyond 2026-09-27, also seed today with active tasks
  if (today > '2026-09-27') {
    items.push(
      todo('1', today, 'Review today\'s priorities', false),
      todo('2', today, 'Read for 20 minutes', false),
    )
  }

  return items
}

function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  const [accounts, setAccounts] = useState(() => {
    const saved = readJson('daymark_accounts', [])
    const index = saved.findIndex(
      (account) => account.id === DEMO_ACCOUNT.id || account.email?.toLowerCase() === DEMO_ACCOUNT.email.toLowerCase(),
    )
    if (index === -1) {
      return [DEMO_ACCOUNT, ...saved]
    }
    const existing = saved[index]
    const updatedDemo = {
      ...DEMO_ACCOUNT,
      ...existing,
      securityQuestion: DEMO_ACCOUNT.securityQuestion,
      securityAnswer: existing.securityAnswer || DEMO_ACCOUNT.securityAnswer,
    }
    const copy = [...saved]
    copy[index] = updatedDemo
    return copy
  })
  const [user, setUser] = useState(() => readJson('daymark_session', null, localStorage) || readJson('daymark_session', null, sessionStorage))
  const [todos, setTodos] = useState(() => readJson('daymark_todos', []))
  const [theme, setTheme] = useState(() => localStorage.getItem('daymark_theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('daymark_language') || 'vi')
  const t = language === 'vi' ? vi : en

  const currentAccount = useMemo(
    () => accounts.find((account) => account.id === user?.id) || user,
    [accounts, user],
  )
  const activeUser = useMemo(
    () =>
      currentAccount
        ? {
          ...currentAccount,
          gems: currentAccount.gems || 0,
          gemDates: currentAccount.gemDates || [],
          recoveredDays: currentAccount.recoveredDays || [],
          awardedCycles: currentAccount.awardedCycles || [],
        }
        : null,
    [currentAccount],
  )
  const userTodos = activeUser ? todos.filter((todo) => todo.userId === activeUser.id) : []

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('daymark_theme', theme)
  }, [theme])

  useEffect(() => localStorage.setItem('daymark_language', language), [language])
  useEffect(() => localStorage.setItem('daymark_accounts', JSON.stringify(accounts)), [accounts])
  useEffect(() => localStorage.setItem('daymark_todos', JSON.stringify(todos)), [todos])

  useEffect(() => {
    if (!activeUser) return
    const storage = localStorage.getItem('daymark_session') ? localStorage : sessionStorage
    storage.setItem('daymark_session', JSON.stringify(activeUser))
  }, [activeUser])

  // One-time versioned seed migration for demo account: guarantees proper todos for Days 10, 11, 12, 13, 20, 21, 22, 25, 26, 27
  // and allows user to delete any todo without it being resurrected!
  useEffect(() => {
    if (activeUser?.id === DEMO_ACCOUNT.id) {
      const currentVersion = localStorage.getItem('daymark_demo_version')
      if (currentVersion !== DEMO_SEED_VERSION) {
        const seeded = createDemoTodos()
        setTodos((prevTodos) => {
          const nonDemoTodos = prevTodos.filter((todo) => todo.userId !== DEMO_ACCOUNT.id)
          return [...nonDemoTodos, ...seeded]
        })
        localStorage.setItem('daymark_demo_version', DEMO_SEED_VERSION)
      }
    }
  }, [activeUser?.id])

  const syncAccount = (nextUser) => {
    setUser(nextUser)
    setAccounts((items) => items.map((item) => (item.id === nextUser.id ? nextUser : item)))
  }

  const login = ({ email, password, remember }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const found = accounts.find(
      (account) =>
        account.email.toLowerCase() === normalizedEmail &&
        (account.password === password || (account.id === DEMO_ACCOUNT.id && password === DEMO_ACCOUNT.password)),
    )
    const demo = normalizedEmail === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password ? DEMO_ACCOUNT : null
    const nextUser = found || demo
    if (!nextUser) return false

    if (nextUser.id === DEMO_ACCOUNT.id) {
      setAccounts((items) => {
        const exists = items.some((account) => account.id === DEMO_ACCOUNT.id)
        return exists ? items : [...items, DEMO_ACCOUNT]
      })
      if (localStorage.getItem('daymark_demo_version') !== DEMO_SEED_VERSION) {
        const seeded = createDemoTodos()
        setTodos((items) => {
          const nonDemo = items.filter((todo) => todo.userId !== DEMO_ACCOUNT.id)
          return [...nonDemo, ...seeded]
        })
        localStorage.setItem('daymark_demo_version', DEMO_SEED_VERSION)
      }
    }

    localStorage.removeItem('daymark_session')
    sessionStorage.removeItem('daymark_session')
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('daymark_session', JSON.stringify(nextUser))
    setUser(nextUser)
    return true
  }

  const signup = (data) => {
    const email = data.email.trim().toLowerCase()
    const username = data.username.trim()
    const exists = accounts.some(
      (account) => account.email.toLowerCase() === email || account.username.toLowerCase() === username.toLowerCase(),
    )
    if (exists) return false

    const next = {
      id: crypto.randomUUID(),
      username,
      email,
      password: data.password,
      securityQuestion: data.securityQuestion.trim(),
      securityAnswer: data.securityAnswer.trim(),
      gems: 0,
      gemDates: [],
      recoveredDays: [],
      awardedCycles: [],
    }
    setAccounts((items) => [...items, next])
    return true
  }

  const logout = () => {
    localStorage.removeItem('daymark_session')
    sessionStorage.removeItem('daymark_session')
    setUser(null)
  }

  const checkAndAwardGems = (nextTodos, account = activeUser) => {
    if (!account) return
    const accountTodos = nextTodos.filter((todo) => todo.userId === account.id)
    const reward = evaluateGemRewards(account, accountTodos)
    if (reward) {
      syncAccount({
        ...account,
        gems: account.gems + reward.newGems,
        awardedCycles: reward.updatedAwardedCycles,
      })
    }
  }

  const addTodo = ({ title, date }) => {
    const today = dateKey()
    if (date !== today) return // Only allow adding todo for current day (cannot add for past days)

    setTodos((items) => [
      ...items,
      { id: crypto.randomUUID(), userId: activeUser.id, title: title.trim(), date, completed: false },
    ])
  }

  const toggleTodo = (id) => {
    const today = dateKey()
    const target = todos.find((item) => item.id === id)
    if (target && target.date < today) return // Prevent modifying past days

    const nextTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    setTodos(nextTodos)
    checkAndAwardGems(nextTodos)
  }

  const deleteTodo = (id) => {
    const today = dateKey()
    const target = todos.find((item) => item.id === id)
    if (target && target.date < today) return // Prevent deleting past days

    const nextTodos = todos.filter((todo) => todo.id !== id)
    setTodos(nextTodos)
  }

  const editTodo = (id, changes) => {
    const today = dateKey()
    const target = todos.find((item) => item.id === id)
    if (target && target.date < today) return // Prevent editing past days

    const nextTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, ...changes, title: (changes.title !== undefined ? changes.title.trim() : todo.title) } : todo,
    )
    setTodos(nextTodos)
    checkAndAwardGems(nextTodos)
  }

  const recoverStreak = (targetDate) => {
    if (!activeUser || activeUser.gems < 1) return
    const stats = getStreakStats(userTodos, activeUser.recoveredDays)
    const dateToRecover = targetDate || stats.recoveryDate
    if (!dateToRecover || activeUser.recoveredDays.includes(dateToRecover) || !stats.missedDays.has(dateToRecover)) return

    const nextRecoveredDays = [...activeUser.recoveredDays, dateToRecover]
    const nextGems = activeUser.gems - 1

    let updatedUser = {
      ...activeUser,
      gems: nextGems,
      recoveredDays: nextRecoveredDays,
    }

    const reward = evaluateGemRewards(updatedUser, userTodos)
    if (reward) {
      updatedUser = {
        ...updatedUser,
        gems: updatedUser.gems + reward.newGems,
        awardedCycles: reward.updatedAwardedCycles,
      }
    }

    syncAccount(updatedUser)
  }

  const resetPassword = (id, password) => {
    setAccounts((items) => {
      const exists = items.some((account) => account.id === id)
      if (!exists && id === DEMO_ACCOUNT.id) {
        return [{ ...DEMO_ACCOUNT, password }, ...items]
      }
      return items.map((account) => (account.id === id ? { ...account, password } : account))
    })
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login onLogin={login} t={t} />} />
        <Route path="/signup" element={<Signup onSignup={signup} t={t} />} />
        <Route path="/forgot-password" element={<ForgotPassword accounts={accounts} t={t} />} />
        <Route path="/reset-password" element={<ResetPassword onReset={resetPassword} t={t} />} />
        <Route
          path="*"
          element={
            <Protected user={activeUser}>
              <Navbar user={activeUser} t={t} onLogout={logout} />
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home
                      user={activeUser}
                      todos={userTodos}
                      onAdd={addTodo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onEdit={editTodo}
                      onRecover={recoverStreak}
                      gems={activeUser?.gems || 0}
                      t={t}
                    />
                  }
                />
                <Route
                  path="/statistics"
                  element={
                    <Statistics
                      todos={userTodos}
                      gems={activeUser?.gems || 0}
                      recoveredDays={activeUser?.recoveredDays || []}
                      onRecover={recoverStreak}
                      t={t}
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      user={activeUser}
                      theme={theme}
                      language={language}
                      onThemeChange={setTheme}
                      onLanguageChange={setLanguage}
                      onLogout={logout}
                      t={t}
                    />
                  }
                />
              </Routes>
            </Protected>
          }
        />
      </Routes>
    </div>
  )
}

export default App
