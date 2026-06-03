import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout, ProtectedRoute } from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/user/Dashboard';
import PaymentHistory from './pages/user/PaymentHistory';
import DuePayments from './pages/user/DuePayments';
import Profile from './pages/user/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import UserDetails from './pages/admin/UserDetails';
import InvestmentManager from './pages/admin/InvestmentManager';
import ExpenseManager from './pages/admin/ExpenseManager';
import Income from './pages/admin/Income';
import AssetManager from './pages/admin/AssetManager';
import ReportsContainer from './pages/admin/reports/ReportsContainer';
import DuesStatus from './pages/admin/DuesStatus';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            </Route>

          </Route>
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<div className="p-10 text-center">404 Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
