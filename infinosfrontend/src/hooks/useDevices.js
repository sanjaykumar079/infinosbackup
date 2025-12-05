import { useState, useEffect, useCallback } from 'react';
import { deviceAPI } from '../utils/api';

export const useDevices = (ownerId, autoRefresh = false, interval = 5000) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    if (!ownerId) return;
    
    try {
      setLoading(true);
      const response = await deviceAPI.getMyDevices(ownerId);
      setDevices(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchDevices();

    if (autoRefresh) {
      const intervalId = setInterval(fetchDevices, interval);
      return () => clearInterval(intervalId);
    }
  }, [fetchDevices, autoRefresh, interval]);

  const addDevice = async (deviceData) => {
    try {
      await deviceAPI.addDevice({ ...deviceData, ownerId });
      await fetchDevices();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateDevice = async (deviceId, status) => {
    try {
      await deviceAPI.updateDevice(deviceId, status);
      await fetchDevices();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteDevice = async (deviceId) => {
    // Implement if backend supports deletion
    try {
      // await deviceAPI.deleteDevice(deviceId);
      await fetchDevices();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  };
};

export default useDevices;