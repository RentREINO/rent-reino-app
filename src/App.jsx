import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/UI.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Properties from './pages/Properties.jsx';
import Tenants from './pages/Tenants.jsx';
import Leases from './pages/Leases.jsx';
import Rent from './pages/Rent.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Expenses from './pages/Expenses.jsx';
import Documents from './pages/Documents.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import MyLease from './pages/MyLease.jsx';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><Spinner/></div>;
  if (!user) return <Navigate to="/login" replace/>;
  return <Layout/>;
}

function OwnerRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'tenant' ? <Navigate to="/" replace/> : children;
}

export default function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace/> : <Login/>}/>
    <Route path="/register" element={user ? <Navigate to="/" replace/> : <Register/>}/>
    <Route element={<Protected/>}>
      <Route index element={<Dashboard/>}/>
      <Route path="properties" element={<OwnerRoute><Properties/></OwnerRoute>}/>
      <Route path="tenants" element={<OwnerRoute><Tenants/></OwnerRoute>}/>
      <Route path="leases" element={<OwnerRoute><Leases/></OwnerRoute>}/>
      <Route path="lease" element={<MyLease/>}/>
      <Route path="rent" element={<Rent/>}/>
      <Route path="maintenance" element={<Maintenance/>}/>
      <Route path="expenses" element={<OwnerRoute><Expenses/></OwnerRoute>}/>
      <Route path="documents" element={<Documents/>}/>
      <Route path="reports" element={<OwnerRoute><Reports/></OwnerRoute>}/>
      <Route path="settings" element={<Settings/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
