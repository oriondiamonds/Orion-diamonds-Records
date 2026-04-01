import { createContext, useContext, useState } from 'react'

const SESSION_KEY = 'records_session'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY))
    } catch {
      return null
    }
  })

  function login(userData) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
