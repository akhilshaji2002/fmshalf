import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Training = lazy(() => import('./pages/Training'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Shop = lazy(() => import('./pages/Shop'));
const Security = lazy(() => import('./pages/Security'));
const Login = lazy(() => import('./pages/Login'));

import { Toaster } from 'react-hot-toast';
const Settings = lazy(() => import('./pages/Settings'));
const Coaches = lazy(() => import('./pages/Coaches'));
const Sessions = lazy(() => import('./pages/Sessions'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const PaymentGateway = lazy(() => import('./pages/PaymentGateway'));
const ManageTestimonials = lazy(() => import('./pages/ManageTestimonials'));
const AIProgressPage = lazy(() => import('./pages/AIProgressPage'));
const FoodVision = lazy(() => import('./pages/FoodVision'));
const GymDiscovery = lazy(() => import('./pages/GymDiscovery'));
const GymAssociate = lazy(() => import('./pages/GymAssociate'));
const YourGym = lazy(() => import('./pages/YourGym'));
const GymOwnerDashboard = lazy(() => import('./pages/GymOwnerDashboard'));
const ChatPlatform = lazy(() => import('./pages/ChatPlatform'));
const KinetixDashboard = lazy(() => import('./pages/KinetixDashboard'));

import { getSafeUser } from './utils/auth';

const ProtectedRoute = ({ children }) => {
  const user = getSafeUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const loadingFallback = (
    <div className="min-h-screen bg-background text-gray-300 flex items-center justify-center">
      Loading module...
    </div>
  );
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#333', color: '#fff' }
      }} />
      <Suspense fallback={loadingFallback}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/discovery" element={
            <ProtectedRoute>
              <GymDiscovery />
            </ProtectedRoute>
          } />
          <Route path="/gym-associate/:gymId" element={
            <ProtectedRoute>
              <GymAssociate />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="training" element={<Training />} />
            <Route path="kinetix" element={<KinetixDashboard />} />
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
            <Route path="food-vision" element={<FoodVision />} />
            <Route path="gym-owner" element={<GymOwnerDashboard />} />
            <Route path="your-gym" element={<YourGym />} />
            <Route path="chat" element={<ChatPlatform />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
