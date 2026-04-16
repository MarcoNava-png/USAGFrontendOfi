import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

let lastRedirectAt = 0
const REDIRECT_DEBOUNCE_MS = 3000

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    return !payload.exp || Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Strict; Secure'
  }
}

function redirectToLogin() {
  const now = Date.now()
  if (now - lastRedirectAt < REDIRECT_DEBOUNCE_MS) return
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
    lastRedirectAt = now
    clearSession()
    window.dispatchEvent(new CustomEvent('session-expired'))
  }
}

axiosInstance.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')

      if (token != null && token != undefined) {
        if (isTokenExpired(token)) {
          redirectToLogin()
          return Promise.reject(new Error('Token expirado'))
        }

        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      redirectToLogin()
    }
    return Promise.reject(error)
  }
)

export const rawAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

export default axiosInstance
