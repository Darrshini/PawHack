import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PetProvider } from './contexts/PetContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/common/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PetsPage from './pages/PetsPage'
import MealPlannerPage from './pages/MealPlannerPage'
import HealthPage from './pages/HealthPage'
import ActivityPage from './pages/ActivityPage'
import RemindersPage from './pages/RemindersPage'
import DevicesPage from './pages/DevicesPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'

import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <PetProvider>
          <HashRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected – wrapped in AppShell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard"    element={<DashboardPage />} />
                <Route path="/pets"         element={<PetsPage />} />
                <Route path="/meal-planner" element={<MealPlannerPage />} />
                <Route path="/health"       element={<HealthPage />} />
                <Route path="/activity"     element={<ActivityPage />} />
                <Route path="/reminders"    element={<RemindersPage />} />
                <Route path="/devices"      element={<DevicesPage />} />
                <Route path="/alerts"       element={<AlertsPage />} />
                <Route path="/settings"     element={<SettingsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HashRouter>
        </PetProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
