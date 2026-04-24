import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// Admin-specific Axios instance — hits /api/admin/* endpoints
export const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach adminToken on every request
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// On 401 → clear session and redirect to admin login
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// General API for non-admin routes (e.g. GET /api/turfs for listing all turfs)
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
