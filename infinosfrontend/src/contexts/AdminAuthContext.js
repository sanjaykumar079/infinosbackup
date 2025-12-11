// FILE: infinosfrontend/src/contexts/AdminAuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

// Admin passkey - in production, this should be environment variable
const ADMIN_PASSKEY = "INFINOS2025ADMIN"; // Change this to your secure passkey

export const AdminAuthProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already authenticated in session
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const loginAdmin = (passkey) => {
    if (passkey === ADMIN_PASSKEY) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      return { success: true };
    }
    return { success: false, error: 'Invalid passkey' };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  return (
    <AdminAuthContext.Provider 
      value={{ 
        isAdminAuthenticated, 
        loginAdmin, 
        logoutAdmin, 
        loading 
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;