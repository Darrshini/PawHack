import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingPage } from '../common'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingPage label="Checking session…" />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
