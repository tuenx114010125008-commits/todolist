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

export const createDemoAccount = () => {
  const today = dateKey()
  return {
    id: 'demo',
    username: 'Demo',
    email: 'demo.daymark@gmail.com',
    password: 'daymark',
    securityQuestion: 'Tên thương hiệu của ứng dụng này là gì?',
    securityAnswer: 'daymark',
    gems: 7,
    gemDates: [],
    recoveredDays: [addDays(today, -5), addDays(today, -4)],
    awardedCycles: [],
  }
}

export const DEMO_ACCOUNT = createDemoAccount()

const DEMO_SEED_VERSION = 'v8_perfect_relative_streak'

const createDemoTodos = () => {
  const today = dateKey()
  const d = (offset) => addDays(today, -offset)
  const todo = (idSuffix, date, title, completed) => ({
    id: `demo-${date}-${idSuffix}`,
    userId: DEMO_ACCOUNT.id,
    title,
    date,
    completed,
  })

  return [
    // Today (d0)
    todo('1', d(0), 'Xem lại danh sách mục tiêu trong ngày', false),
    todo('2', d(0), 'Đọc tài liệu chuyên ngành 20 phút', false),

    // d1 (Yesterday: Completed 🔥)
    todo('1', d(1), 'Thiết kế giao diện component Todo', true),
    todo('2', d(1), 'Kiểm tra độ tương phản màu sắc', true),

    // d2 (Completed 🔥)
    todo('1', d(2), 'Đồng bộ hệ thống Design Tokens', true),
    todo('2', d(2), 'Viết hướng dẫn sử dụng tính năng', true),

    // d3 (Completed 🔥)
    todo('1', d(3), 'Tối ưu hiệu năng ứng dụng React', true),
    todo('2', d(3), 'Kiểm thử luồng khôi phục mật khẩu', true),

    // Note: d4 and d5 are in DEMO_ACCOUNT.recoveredDays (💎) -> together with d3, d2, d1, this forms an active 5-day streak!

    // d6 (Missed ✕ - has incomplete task -> Bridge day to recover!)
    todo('1', d(6), 'Họp định hướng sản phẩm cùng nhóm', true),
    todo('2', d(6), 'Cập nhật backlog sprint tiếp theo', false),

    // d7 (Completed 🔥)
    todo('1', d(7), 'Đánh giá pull request của thành viên', true),
    todo('2', d(7), 'Cập nhật tài liệu kỹ thuật', true),

    // d8 (Completed 🔥)
    todo('1', d(8), 'Khởi tạo cấu trúc dự án Vite + React', true),
    todo('2', d(8), 'Thiết lập cấu hình ESLint và Oxlint', true),

    // d9 (Missed ✕)
    todo('1', d(9), 'Dọn dẹp các thư viện không sử dụng', true),
    todo('2', d(9), 'Kiểm tra sao lưu cơ sở dữ liệu', false),

    // d13 (Missed ✕)
    todo('1', d(13), 'Lập dàn ý thiết kế chức năng Streak', false),
    todo('2', d(13), 'Thu thập phản hồi từ người dùng', true),

    // d14 (Completed 🔥)
    todo('1', d(14), 'Xây dựng layout Streak Card', true),
    todo('2', d(14), 'Tích hợp bộ màu Dark/Light mode', true),

    // d15 (Completed 🔥)
    todo('1', d(15), 'Nghiên cứu thư viện React Router', true),
    todo('2', d(15), 'Xây dựng sơ đồ luồng điều hướng', true),

    // d18 (Completed 🔥)
    todo('1', d(18), 'Đọc sách chuyên môn 30 phút', true),
    todo('2', d(18), 'Đi bộ thư giãn buổi chiều', true),

    // d19 (Missed ✕)
    todo('1', d(19), 'Gửi email tổng kết tiến độ', false),
    todo('2', d(19), 'Sắp xếp lại thư mục làm việc', true),
  ]
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

  // One-time versioned seed migration for demo account: dynamically seeds relative to current date
  useEffect(() => {
    if (activeUser?.id === DEMO_ACCOUNT.id) {
      const currentVersion = localStorage.getItem('daymark_demo_version')
      if (currentVersion !== DEMO_SEED_VERSION) {
        const freshDemo = createDemoAccount()
        const seeded = createDemoTodos()
        setTodos((prevTodos) => {
          const nonDemoTodos = prevTodos.filter((todo) => todo.userId !== DEMO_ACCOUNT.id)
          return [...nonDemoTodos, ...seeded]
        })
        setAccounts((prevAccounts) =>
          prevAccounts.map((acc) => (acc.id === DEMO_ACCOUNT.id ? { ...acc, ...freshDemo } : acc)),
        )
        syncAccount(freshDemo)
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
    let nextUser = found || demo
    if (!nextUser) return false

    if (nextUser.id === DEMO_ACCOUNT.id) {
      const freshDemo = createDemoAccount()
      setAccounts((items) => {
        const exists = items.some((account) => account.id === DEMO_ACCOUNT.id)
        return exists ? items.map((a) => (a.id === DEMO_ACCOUNT.id ? { ...a, ...freshDemo } : a)) : [...items, freshDemo]
      })
      if (localStorage.getItem('daymark_demo_version') !== DEMO_SEED_VERSION) {
        const seeded = createDemoTodos()
        setTodos((items) => {
          const nonDemo = items.filter((todo) => todo.userId !== DEMO_ACCOUNT.id)
          return [...nonDemo, ...seeded]
        })
        localStorage.setItem('daymark_demo_version', DEMO_SEED_VERSION)
      }
      nextUser = { ...nextUser, ...freshDemo }
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
    // Chỉ cho phép khôi phục đối với những ngày có task nhưng bị lỡ (nằm trong missedDays)
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
