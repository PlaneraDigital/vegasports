import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const AUTH_URL = `${API_BASE_URL}/api/auth`

export const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Token Helpers ────────────────────────────────────────────────────────────
export const getAuthToken = () => localStorage.getItem('authToken')

export const saveAuthSession = (token, user) => {
  localStorage.setItem('authToken', token)
  localStorage.setItem('authUser', JSON.stringify(user))
  window.dispatchEvent(new Event('userUpdated'))
}

export const clearAuthSession = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authUser')
  window.dispatchEvent(new Event('userUpdated'))
}

export const getAuthUser = () => {
  const raw = localStorage.getItem('authUser')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ─── Request Interceptor: Attach JWT to every request ────────────────────────
authApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── authApi: NO redirect on 401 ─────────────────────────────────────────────
// Login/register routes legitimately return 401 for wrong credentials.
// We must let the error bubble up so the form can display the message.
authApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)   // just pass the error through — no redirect
)

// ─── Authenticated API instance (for non-auth routes e.g. /api/bookings) ─────
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
