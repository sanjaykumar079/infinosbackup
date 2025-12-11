// FILE: infinosfrontend/src/App.js
// REPLACE THE ENTIRE FILE WITH THIS

import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";

import "./App.css";

// Pages
import Home from "./Home";
import Devices from "./Devices";
import BagControl from "./BagControl";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

// Admin Protected Route Component
function AdminProtectedRoute({ children }) {
  const { isAdminAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      setLoadingUser(false);
    }
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loadingUser) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />

        {/* User Routes */}
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/bag-control" element={<BagControl />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/logout" element={<Logout setUser={setUser} />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

function Logout({ setUser }) {
  useEffect(() => {
    async function logout() {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/";
    }
    logout();
  }, [setUser]);

  return <div>Logging out...</div>;
}

function App() {
  return (
    <div className="App">
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </div>
  );
}

export default App;