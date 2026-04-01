import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'

const EnquiriesPage = lazy(() => import('./modules/enquiries/EnquiriesPage.jsx'))
const EnquiryForm = lazy(() => import('./modules/enquiries/EnquiryForm.jsx'))
const EnquiryDetailPage = lazy(() => import('./modules/enquiries/EnquiryDetailPage.jsx'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-32 text-[var(--color-text-muted)] text-sm animate-pulse">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <EnquiriesPage />
                </Suspense>
              }
            />
            <Route
              path="enquiries/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EnquiryForm />
                </Suspense>
              }
            />
            <Route
              path="enquiries/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EnquiryDetailPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
