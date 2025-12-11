// FILE: infinosfrontend/src/AdminDashboard.js

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "./contexts/AdminAuthContext";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { logoutAdmin } = useAdminAuth();

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all devices from backend (you may need to create a new endpoint)
      const devicesRes = await axios.get("/device/all-devices");
      const allDevices = devicesRes.data || [];
      
      // Group devices by owner
      const customerMap = new Map();
      allDevices.forEach(device => {
        if (device.ownerId) {
          if (!customerMap.has(device.ownerId)) {
            customerMap.set(device.ownerId, {
              userId: device.ownerId,
              userName: device.name?.split("'s")[0] || "Unknown",
              email: "user@example.com", // You'll need to fetch this from Supabase
              devices: [],
              totalDevices: 0,
              onlineDevices: 0,
              dualZoneBags: 0,
              heatingOnlyBags: 0,
            });
          }
          
          const customer = customerMap.get(device.ownerId);
          customer.devices.push(device);
          customer.totalDevices++;
          if (device.status) customer.onlineDevices++;
          if (device.bagType === 'dual-zone') customer.dualZoneBags++;
          if (device.bagType === 'heating-only') customer.heatingOnlyBags++;
        }
      });
      
      const customerList = Array.from(customerMap.values());
      
      // Calculate overall stats
      const totalDevices = allDevices.length;
      const onlineDevices = allDevices.filter(d => d.status).length;
      const dualZone = allDevices.filter(d => d.bagType === 'dual-zone').length;
      const heatingOnly = allDevices.filter(d => d.bagType === 'heating-only').length;
      const totalCustomers = customerList.length;
      
      setStats({
        totalCustomers,
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        dualZoneBags: dualZone,
        heatingOnlyBags: heatingOnly,
        activeRate: totalDevices > 0 ? ((onlineDevices / totalDevices) * 100).toFixed(1) : 0,
      });
      
      setCustomers(customerList);
      setDevices(allDevices);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard-layout">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-brand">
            <div className="admin-header-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2"/>
                <path d="M2 17l10 5 10-5" strokeWidth="2"/>
                <path d="M2 12l10 5 10-5" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="admin-header-title">INFINOS Admin</h1>
              <p className="admin-header-subtitle">System Overview Dashboard</p>
            </div>
          </div>
          
          <button className="admin-logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2"/>
              <polyline points="16 17 21 12 16 7" strokeWidth="2"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card admin-stat-primary">
            <div className="admin-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Customers</p>
              <h2 className="admin-stat-value">{stats.totalCustomers}</h2>
              <p className="admin-stat-description">Active users</p>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-devices">
            <div className="admin-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2"/>
                <path d="M12 18h.01" strokeWidth="2"/>
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Total Devices</p>
              <h2 className="admin-stat-value">{stats.totalDevices}</h2>
              <p className="admin-stat-description">All bags registered</p>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-success">
            <div className="admin-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2"/>
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Online Devices</p>
              <h2 className="admin-stat-value">{stats.onlineDevices}</h2>
              <p className="admin-stat-description">{stats.activeRate}% active</p>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-warning">
            <div className="admin-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Offline Devices</p>
              <h2 className="admin-stat-value">{stats.offlineDevices}</h2>
              <p className="admin-stat-description">Needs attention</p>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-dual">
            <div className="admin-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v20M2 12h20" strokeWidth="2"/>
                <circle cx="7" cy="7" r="3" fill="#EF4444" stroke="none"/>
                <circle cx="17" cy="17" r="3" fill="#3B82F6" stroke="none"/>
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Dual-Zone Bags</p>
              <h2 className="admin-stat-value">{stats.dualZoneBags}</h2>
              <p className="admin-stat-description">Hot & Cold zones</p>
            </div>
          </div>

          <div className="admin-stat-card admin-stat-heating">
            <div className="admin-stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2v20" strokeWidth="2"/>
                <circle cx="12" cy="12" r="5" fill="#EF4444" stroke="none"/>
              </svg>
            </div>
            <div className="admin-stat-content">
              <p className="admin-stat-label">Heating-Only Bags</p>
              <h2 className="admin-stat-value">{stats.heatingOnlyBags}</h2>
              <p className="admin-stat-description">Hot zone only</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "overview" ? "admin-tab-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
            </svg>
            Overview
          </button>
          <button
            className={`admin-tab ${activeTab === "customers" ? "admin-tab-active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
              <circle cx="9" cy="7" r="4" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2"/>
            </svg>
            Customers ({customers.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "devices" ? "admin-tab-active" : ""}`}
            onClick={() => setActiveTab("devices")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2"/>
              <path d="M12 18h.01" strokeWidth="2"/>
            </svg>
            All Devices ({devices.length})
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="admin-overview">
            <div className="admin-card">
              <h3 className="admin-card-title">System Health</h3>
              <div className="admin-health-grid">
                <div className="admin-health-item">
                  <div className="admin-health-bar">
                    <div 
                      className="admin-health-fill admin-health-success" 
                      style={{ width: `${stats.activeRate}%` }}
                    ></div>
                  </div>
                  <p className="admin-health-label">Device Uptime: {stats.activeRate}%</p>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <h3 className="admin-card-title">Recent Activity</h3>
              <p className="admin-card-text">System monitoring and logs will appear here.</p>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Devices</th>
                  <th>Online</th>
                  <th>Dual-Zone</th>
                  <th>Heating-Only</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="admin-customer-cell">
                        <div className="admin-customer-avatar">
                          {customer.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="admin-customer-name">{customer.userName}</p>
                          <p className="admin-customer-email">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><strong>{customer.totalDevices}</strong></td>
                    <td>
                      <span className="admin-badge admin-badge-success">
                        {customer.onlineDevices} online
                      </span>
                    </td>
                    <td>{customer.dualZoneBags}</td>
                    <td>{customer.heatingOnlyBags}</td>
                    <td>
                      <span className="admin-badge admin-badge-primary">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "devices" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Device Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Battery</th>
                  <th>Hot Zone</th>
                  <th>Cold Zone</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device._id}>
                    <td>
                      <strong>{device.name}</strong>
                      <br />
                      <small style={{ color: 'var(--gray-500)', fontFamily: 'monospace' }}>
                        {device.deviceCode}
                      </small>
                    </td>
                    <td>
                      <span className={`admin-type-badge ${device.bagType === 'dual-zone' ? 'admin-type-dual' : 'admin-type-heating'}`}>
                        {device.bagType === 'dual-zone' ? 'Dual-Zone' : 'Heating-Only'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${device.status ? 'admin-badge-success' : 'admin-badge-error'}`}>
                        {device.status ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>{device.battery?.chargeLevel?.toFixed(0) || 0}%</td>
                    <td>{device.hotZone?.currentTemp?.toFixed(1) || 'N/A'}°C</td>
                    <td>
                      {device.bagType === 'dual-zone' 
                        ? `${device.coldZone?.currentTemp?.toFixed(1) || 'N/A'}°C`
                        : '-'}
                    </td>
                    <td>
                      <small>{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;