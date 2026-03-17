import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/app/login/LoginPage'
import { GuidePage } from '@/app/guide/GuidePage'
import { QuestionnairePage } from '@/app/questionnaire/QuestionnairePage'
import { RoommatesPage } from '@/app/roommates/RoommatesPage'
import { RoommateDetailPage } from '@/app/roommates/RoommateDetailPage'
import { TeamRequestsPage } from '@/app/team/TeamRequestsPage'
import { TeamMyPage } from '@/app/team/TeamMyPage'

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center">加载中...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center">加载中...</div>
  if (isAuthenticated) return <Navigate to="/guide" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/guide" replace />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/questionnaire" element={<QuestionnairePage />} />
            <Route path="/roommates" element={<RoommatesPage />} />
            <Route path="/roommates/:id" element={<RoommateDetailPage />} />
            <Route path="/team/requests" element={<TeamRequestsPage />} />
            <Route path="/team/my" element={<TeamMyPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/guide" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
