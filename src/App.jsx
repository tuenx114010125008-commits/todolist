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
import { getStreakStats } from './utils/streak'
import './App.css'

const readJson = (key, fallback, storage = localStorage) => {
  try {
    return JSON.parse(storage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
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
    const demo =
      normalizedEmail === 'demo@daymark.app' && password === 'daymark'
        ? { id: 'demo', username: 'Demo', email: normalizedEmail, password, gems: 3, gemDates: [], recoveredDays: [] }
        : null
    const nextUser = found || demo
    if (!nextUser) return false

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
    }
    setAccounts((items) => [...items, next])
    return true
  }

  const logout = () => {
    localStorage.removeItem('daymark_session')
    sessionStorage.removeItem('daymark_session')
    setUser(null)
  }

  const awardGem = (nextTodos, date) => {
    if (!activeUser) return
    const dayTodos = nextTodos.filter((todo) => todo.userId === activeUser.id && todo.date === date)
    if (!dayTodos.length || !dayTodos.every((todo) => todo.completed)) return
    if (activeUser.gemDates.includes(date)) return
    syncAccount({
      ...activeUser,
      gems: activeUser.gems + 1,
      gemDates: [...activeUser.gemDates, date],
    })
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
    const changed = nextTodos.find((todo) => todo.id === id)
    if (changed?.completed) awardGem(nextTodos, changed.date)
  }

  const deleteTodo = (id) => {
    const removed = todos.find((todo) => todo.id === id)
    const nextTodos = todos.filter((todo) => todo.id !== id)
    setTodos(nextTodos)
    if (removed) awardGem(nextTodos, removed.date)
  }

  const editTodo = (id, changes) => {
    const nextTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, ...changes, title: changes.title.trim() } : todo,
    )
    setTodos(nextTodos)
    const changed = nextTodos.find((todo) => todo.id === id)
    if (changed?.completed) awardGem(nextTodos, changed.date)
  }

  const recoverStreak = () => {
    const stats = getStreakStats(userTodos, activeUser.recoveredDays)
    if (!activeUser || activeUser.gems < 5 || !stats.isStreakLost || !stats.recoveryDate) return
    if (activeUser.recoveredDays.includes(stats.recoveryDate)) return

    syncAccount({
      ...activeUser,
      gems: activeUser.gems - 5,
      recoveredDays: [...activeUser.recoveredDays, stats.recoveryDate],
    })
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
