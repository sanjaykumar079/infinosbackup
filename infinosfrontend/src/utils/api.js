import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Device API calls
export const deviceAPI = {
  // Get all devices for a user
  getMyDevices: (ownerId) => api.get('/device/my-devices', { params: { ownerId } }),
  
  // Get device summary
  getSummary: (ownerId) => api.get('/device/summary', { params: { ownerId } }),
  
  // Get specific device
  getDevice: (deviceId) => api.get('/device/get_device', { params: { device_id: deviceId } }),
  
  // Add new device
  addDevice: (deviceData) => api.post('/device/add_device', deviceData),
  
  // Update device status
  updateDevice: (deviceId, status) => api.post('/device/update_device', { device_id: deviceId, status }),
  
  // Heater operations
  getHeaters: (heaterIds) => api.get('/device/get_heaters', { params: { heater_ids: heaterIds } }),
  addHeater: (heaterData) => api.post('/device/add_heater', heaterData),
  associateHeater: (deviceId, heaterId) => api.post('/device/ass_heater', { device_id: deviceId, heater_id: heaterId }),
  updateHeater: (heaterId, data) => api.post('/device/update_heater', { heater_id: heaterId, ...data }),
  updateHeaterTemp: (heaterId, temp) => api.post('/device/update_heater_temp', { heater_id: heaterId, obs_temp: temp }),
  updateHeaterHumidity: (heaterId, humidity) => api.post('/device/update_heater_humidity', { heater_id: heaterId, obs_humidity: humidity }),
  
  // Cooler operations
  getCoolers: (coolerIds) => api.get('/device/get_coolers', { params: { cooler_ids: coolerIds } }),
  addCooler: (coolerData) => api.post('/device/add_cooler', coolerData),
  associateCooler: (deviceId, coolerId) => api.post('/device/ass_cooler', { device_id: deviceId, cooler_id: coolerId }),
  updateCooler: (coolerId, data) => api.post('/device/update_cooler', { cooler_id: coolerId, ...data }),
  updateCoolerTemp: (coolerId, temp) => api.post('/device/update_cooler_temp', { cooler_id: coolerId, obs_temp: temp }),
  updateCoolerHumidity: (coolerId, humidity) => api.post('/device/update_cooler_humidity', { cooler_id: coolerId, obs_humidity: humidity }),
  
  // Battery operations
  getBatteries: (batteryIds) => api.get('/device/get_batteries', { params: { battery_ids: batteryIds } }),
  addBattery: (batteryData) => api.post('/device/add_battery', batteryData),
  associateBattery: (deviceId, batteryId) => api.post('/device/ass_battery', { device_id: deviceId, battery_id: batteryId }),
  updateBattery: (batteryId, data) => api.post('/device/update_battery', { battery_id: batteryId, ...data }),
  updateBatteryCharge: (batteryId, charge) => api.post('/device/update_battery_charge', { battery_id: batteryId, charge }),
};

export default api;