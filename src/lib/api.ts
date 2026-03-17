import axios, { type AxiosError } from 'axios'
import { getToken, setToken } from './auth'
import type { ApiResponse } from '@/types/api'

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/student`
  : '/api/student'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['refresh-access-token']
    if (newToken) setToken(newToken)
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    const msg =
      (error.response?.data as ApiResponse | undefined)?.msg ||
      error.message ||
      '请求失败'
    if (error.response?.status === 401) {
      setToken(null)
      window.location.href = '/login'
    }
    return Promise.reject(new Error(msg))
  }
)

export function getData<T>(res: { data: ApiResponse<T> }): T {
  const d = res.data
  if (d.code !== 200) throw new Error(d.msg || '请求失败')
  return d.data
}
