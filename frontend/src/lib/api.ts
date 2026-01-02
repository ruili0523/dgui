import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，登出
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

// User 类型定义
export interface User {
  id: number
  username: string
  is_admin: boolean
}

export interface LoginResponse {
  token: string
  expires_at: number
  user: User
}

// Registry 类型定义
export interface Registry {
  id: number
  created_at: string
  updated_at: string
  name: string
  url: string
  username: string
  is_active: boolean
  is_default: boolean
}

export interface RegistryCreate {
  name: string
  url: string
  username?: string
  password?: string
}

export interface RepositoryInfo {
  name: string
  tags: string[]
  tag_count: number
}

export interface ManifestConfig {
  mediaType: string
  size: number
  digest: string
}

export interface ManifestLayer {
  mediaType: string
  size: number
  digest: string
}

export interface ImageManifest {
  schemaVersion: number
  mediaType: string
  config: ManifestConfig
  layers: ManifestLayer[]
  digest: string
  totalSize: number
}

export interface ContainerConfig {
  Hostname: string
  User: string
  ExposedPorts: Record<string, object>
  Env: string[]
  Cmd: string[]
  WorkingDir: string
  Entrypoint: string[]
  Labels: Record<string, string>
}

export interface HistoryEntry {
  created: string
  created_by: string
  empty_layer: boolean
  comment: string
}

export interface RootFS {
  type: string
  diff_ids: string[]
}

export interface ImageConfig {
  architecture: string
  os: string
  created: string
  author: string
  docker_version: string
  config: ContainerConfig
  history: HistoryEntry[]
  rootfs: RootFS
}

export interface ImageInfo {
  name: string
  tag: string
  digest: string
  manifest: ImageManifest
  config: ImageConfig
  total_size: number
  layer_count: number
}

export interface RegistryTags {
  name: string
  tags: string[]
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 分页参数
export interface PaginationParams {
  page?: number
  page_size?: number
  search?: string
}

// Registry API
export const registryApi = {
  getAll: () => api.get<Registry[]>('/registries'),
  getActive: () => api.get<Registry>('/registries/active'),
  getById: (id: number) => api.get<Registry>('/registries/detail', { params: { id } }),
  create: (data: RegistryCreate) => api.post<Registry>('/registries', data),
  update: (id: number, data: Partial<RegistryCreate>) => api.put<Registry>('/registries', data, { params: { id } }),
  delete: (id: number) => api.delete('/registries', { params: { id } }),
  activate: (id: number) => api.post<Registry>('/registries/activate', null, { params: { id } }),
  testConnection: (id: number) => api.get<{ connected: boolean; message?: string; error?: string }>('/registries/test', { params: { id } }),
}

// Image API
export const imageApi = {
  getCatalog: () => api.get<{ repositories: string[] }>('/images/catalog'),
  getRepositories: (params?: PaginationParams) => 
    api.get<PaginatedResponse<RepositoryInfo[]>>('/images/repositories', { params }),
  getTags: (repository: string, params?: PaginationParams) => 
    api.get<PaginatedResponse<{ name: string; tags: string[] }>>('/images/tags', { 
      params: { repo: repository, ...params } 
    }),
  getManifest: (repository: string, reference: string) => 
    api.get<ImageManifest>('/images/manifest', { params: { repo: repository, ref: reference } }),
  getImageInfo: (repository: string, tag: string) => 
    api.get<ImageInfo>('/images/info', { params: { repo: repository, tag } }),
  deleteImage: (repository: string, reference: string) => 
    api.delete('/images/delete', { params: { repo: repository, ref: reference } }),
}

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    api.post<LoginResponse>('/login', { username, password }),
  getCurrentUser: () => api.get<User>('/user/me'),
  changePassword: (oldPassword: string, newPassword: string) => 
    api.post('/user/password', { old_password: oldPassword, new_password: newPassword }),
}

export default api
