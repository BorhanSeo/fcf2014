import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout, ProtectedRoute } from './components/layout/Layout';
import { lazy, Suspense } from 'react';

// ─── Skeleton fallback ───────────────────────────────────────────
const PageSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-2xl" />)}
    </div>
  </div>
);

// ─── Lazy-loaded pages ───────────────────────────────────────────
const Login            = lazy(() => import('./pages/auth/Login'));
const Dashboard        = lazy(() => import('./pages/user/Dashboard'));
const PaymentHistory   = lazy(() => import('./pages/user/PaymentHistory'));
const DuePayments      = lazy(() => import('./pages/user/DuePayments'));
const Profile          = lazy(() => import('./pages/user/Profile'));

const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement   = lazy(() => import('./pages/admin/UserManagement'));
const UserDetails      = lazy(() => import('./pages/admin/UserDetails'));
const InvestmentManager = lazy(() => import('./pages/admin/InvestmentManager'));
const ExpenseManager   = lazy(() => import('./pages/admin/ExpenseManager'));
const Income           = lazy(() => import('./pages/admin/Income'));
const AssetManager     = lazy(() => import('./pages/admin/AssetManager'));
const ReportsContainer = lazy(() => import('./pages/admin/reports/ReportsContainer'));
const DuesStatus       = lazy(() => import('./pages/admin/DuesStatus'));
const AdminSettings    = lazy(() => import('./pages/admin/AdminSettings'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes (Wrapper) */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              
              {/* User Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/payments" element={<PaymentHistory />} />
              <Route path="/dues" element={<DuePayments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/investments" element={<InvestmentManager />} />
              <Route path="/expenses" element={<ExpenseManager />} />
              <Route path="/incomes" element={<Income />} />
              <Route path="/assets" element={<AssetManager />} />
              <Route path="/reports" element={<ReportsContainer />} />
              
              {/* Admin Routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/users/:id" element={<UserDetails />} />
                <Route path="/admin/investments" element={<InvestmentManager />} />
                <Route path="/admin/expenses" element={<ExpenseManager />} />
                <Route path="/admin/incomes" element={<Income />} />
                <Route path="/admin/assets" element={<AssetManager />} />
                <Route path="/admin/reports" element={<ReportsContainer />} />
                <Route path="/admin/dues-status" element={<DuesStatus />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

            </Route>
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<div className="p-10 text-center">404 Not Found</div>} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
