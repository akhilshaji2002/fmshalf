import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Training from './pages/Training';
import Inventory from './pages/Inventory';
import Shop from './pages/Shop';
import Security from './pages/Security';
import Login from './pages/Login';

import { Toaster } from 'react-hot-toast';
import Settings from './pages/Settings';
import Coaches from './pages/Coaches';
import Sessions from './pages/Sessions';
import AdminUsers from './pages/AdminUsers';
import PaymentGateway from './pages/PaymentGateway';
import ManageTestimonials from './pages/ManageTestimonials';
import AIProgressPage from './pages/AIProgressPage';

import { getSafeUser } from './utils/auth';

const ProtectedRoute = ({ children }) => {
  const user = getSafeUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#333', color: '#fff' }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="training" element={<Training />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="shop" element={<Shop />} />
          <Route path="coaches" element={<Coaches />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="security" element={<Security />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/testimonials" element={<ManageTestimonials />} />
          <Route path="payment-gateway" element={<PaymentGateway />} />
          <Route path="ai-progress" element={<AIProgressPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
