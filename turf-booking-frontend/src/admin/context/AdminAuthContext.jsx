import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'))
  const [adminUser, setAdminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUser')) } catch { return null }
  })

  const adminLogin = (token, user) => {
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminUser', JSON.stringify(user))
    setAdminToken(token)
    setAdminUser(user)
  }

  const adminLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setAdminToken(null)
    setAdminUser(null)
  }

  return (
    <AdminAuthContext.Provider value={{
      adminToken,
      adminUser,
      adminLogin,
      adminLogout,
      isAdminAuthenticated: Boolean(adminToken),
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return ctx
}
