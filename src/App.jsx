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
import TodoDetail from './pages/TodoDetail'
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

const DEMO_ACCOUNT = {
  id: 'demo',
  username: 'Demo',
  email: 'demo@daymark.app',
  password: 'daymark',
  securityQuestion: 'Demo account',
  securityAnswer: 'daymark',
  gems: 3,
  gemDates: [],
  recoveredDays: [],
  awardedCycles: [],
}

const createDemoTodos = () => {
  const today = dateKey()
  const day = (offset) => addDays(today, offset)
  const todo = (offset, title, completed) => ({
    id: `demo-${offset}-${title.toLowerCase().replaceAll(' ', '-')}`,
    userId: DEMO_ACCOUNT.id,
    title,
    date: day(offset),
    completed,
  })

  return [
    todo(0, 'Review today\'s priorities', true),
    todo(0, 'Read for 20 minutes', true),
    todo(-1, 'Plan tomorrow', true),
    todo(-2, 'Take a short walk', true),
    todo(-3, 'Write a daily reflection', true),
    todo(-4, 'Finish weekly report', false),
    todo(-6, 'Organize the workspace', true),
  ]
}

function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  const [accounts, setAccounts] = useState(() => readJson('daymark_accounts', []))
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

  const syncAccount = (nextUser) => {
    setUser(nextUser)
    setAccounts((items) => items.map((item) => (item.id === nextUser.id ? nextUser : item)))
  }

  const login = ({ email, password, remember }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const found = accounts.find(
      (account) => account.email.toLowerCase() === normalizedEmail && account.password === password,
    )
    const demo = normalizedEmail === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password ? DEMO_ACCOUNT : null
    const nextUser = found || demo
    if (!nextUser) return false

    if (demo) {
      setAccounts((items) => {
        const exists = items.some((account) => account.id === DEMO_ACCOUNT.id)
        return exists ? items : [...items, DEMO_ACCOUNT]
      })
      setTodos((items) => {
        const seeded = createDemoTodos()
        const existingIds = new Set(items.map((todo) => todo.id))
        return [...items, ...seeded.filter((todo) => !existingIds.has(todo.id))]
      })
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
        gemDates: [...(account.gemDates || []), dateKey()],
      })
    }
  }

  const addTodo = ({ title, date }) => {
    setTodos((items) => [
      ...items,
      { id: crypto.randomUUID(), userId: activeUser.id, title: title.trim(), date, completed: false },
    ])
  }

  const toggleTodo = (id) => {
    const nextTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    setTodos(nextTodos)
    checkAndAwardGems(nextTodos)
  }

  const deleteTodo = (id) => {
    const nextTodos = todos.filter((todo) => todo.id !== id)
    setTodos(nextTodos)
  }

  const editTodo = (id, changes) => {
    const nextTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, ...changes, title: changes.title.trim() } : todo,
    )
    setTodos(nextTodos)
    checkAndAwardGems(nextTodos)
  }

  const recoverStreak = (targetDate) => {
    if (!activeUser || activeUser.gems < 1) return
    const stats = getStreakStats(userTodos, activeUser.recoveredDays)
    const dateToRecover = targetDate || stats.recoveryDate
    if (!dateToRecover || activeUser.recoveredDays.includes(dateToRecover)) return

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
        gemDates: [...(updatedUser.gemDates || []), dateKey()],
      }
    }

    syncAccount(updatedUser)
  }

  const resetPassword = (id, password) => {
    setAccounts((items) => items.map((account) => (account.id === id ? { ...account, password } : account)))
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
                <Route
                  path="/todo/:id"
                  element={<TodoDetail todos={userTodos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} t={t} />}
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
