import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Rmas from './pages/Rmas';
import Users from './pages/Users';
import Pages from './pages/Pages';
import Theme from './pages/Theme';
import AIAssistant from './pages/AIAssistant';
import PageBuilder from './pages/PageBuilder';
import EmailSettings from './pages/EmailSettings';
import Dealers from './pages/Dealers';
import Snelstart from './pages/Snelstart';
import DiscountCodes from './pages/DiscountCodes';
import PasswordWall from './components/PasswordWall';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" />;

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="rmas" element={<AdminRoute><Rmas /></AdminRoute>} />
        <Route path="pages" element={<AdminRoute><Pages /></AdminRoute>} />
        <Route path="dealers" element={<AdminRoute><Dealers /></AdminRoute>} />
        <Route path="theme" element={<AdminRoute><Theme /></AdminRoute>} />
        <Route path="ai" element={<AdminRoute><AIAssistant /></AdminRoute>} />
        <Route path="builder" element={<AdminRoute><PageBuilder /></AdminRoute>} />
        <Route path="email" element={<AdminRoute><EmailSettings /></AdminRoute>} />
        <Route path="snelstart" element={<AdminRoute><Snelstart /></AdminRoute>} />
        <Route path="discounts" element={<AdminRoute><DiscountCodes /></AdminRoute>} />
        <Route
          path="users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PasswordWall>
          <AppRoutes />
        </PasswordWall>
      </BrowserRouter>
    </AuthProvider>
  );
}
