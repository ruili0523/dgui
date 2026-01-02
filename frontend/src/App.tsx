import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'

import { ThemeProvider } from '@/components/theme-provider'
import { useAuthStore } from '@/store/auth'
import { LoginPage } from '@/components/LoginPage'
import { Header } from '@/components/Header'
import { ImageBrowser } from '@/components/ImageBrowser'
import { RegistryManager } from '@/components/RegistryManager'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // 保存当前位置，登录后可以跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// 布局组件
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated, checkAuth } = useAuthStore()

  // 检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* 登录页 */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } 
      />
      
      {/* 受保护的路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <ImageBrowser />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/images"
        element={
          <ProtectedRoute>
            <Layout>
              <ImageBrowser />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/registries"
        element={
          <ProtectedRoute>
            <Layout>
              <RegistryManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* 默认重定向到首页 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="dgui-theme">
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
