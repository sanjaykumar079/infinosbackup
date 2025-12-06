// simulator.js - Enhanced with device authentication
const axios = require("axios");

const API_URL = "http://localhost:4000/device";

// ⚠️ REPLACE THESE WITH REAL VALUES FROM YOUR SEEDED DEVICES
// Get these from running seedDevices.js
const DEVICE_CODE = "INF-XXXX-XXXX";  // Replace with actual code
const DEVICE_SECRET = "your_device_secret_here";  // Replace with actual secret

// Component IDs (will be populated after authentication)
let deviceId = null;
let cooler_id = null;
let heater_id = null;
let battery_id = null;

function random(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Authenticate device on startup
async function authenticateDevice() {
  try {
    console.log("🔐 Authenticating device...");
    const response = await axios.post(`${API_URL}/auth`, {
      deviceCode: DEVICE_CODE,
      deviceSecret: DEVICE_SECRET
    });

    if (response.data.authenticated) {
      const device = response.data.device;
      deviceId = device._id;
      
      // Get component IDs
      if (device.heating && device.heating.length > 0) {
        heater_id = device.heating[0];
      }
      if (device.cooling && device.cooling.length > 0) {
        cooler_id = device.cooling[0];
      }
      if (device.battery && device.battery.length > 0) {
        battery_id = device.battery[0];
      }

      console.log("✅ Device authenticated successfully!");
      console.log(`   Device ID: ${deviceId}`);
      console.log(`   Heater ID: ${heater_id || 'Not configured'}`);
      console.log(`   Cooler ID: ${cooler_id || 'Not configured'}`);
      console.log(`   Battery ID: ${battery_id || 'Not configured'}`);
      
      return true;
    }
  } catch (err) {
    console.error("❌ Authentication failed:", err.response?.data || err.message);
    console.log("\n💡 Make sure to:");
    console.log("   1. Run seedDevices.js to create devices");
    console.log("   2. Update DEVICE_CODE and DEVICE_SECRET in this file");
    console.log("   3. Claim the device through the frontend");
    console.log("   4. Add components (heater/cooler/battery) to the device");
    return false;
  }
}

// Send simulated sensor data
async function sendData() {
  try {
    // Update device status to online
    await axios.post(`${API_URL}/update_device`, {
      device_id: deviceId,
      status: true
    });

    // Send cooler data if configured
    if (cooler_id) {
      await axios.post(`${API_URL}/update_cooler_temp`, {
        cooler_id,
        obs_temp: random(0, 10)
      });
      await axios.post(`${API_URL}/update_cooler_humidity`, {
        cooler_id,
        obs_humidity: random(60, 90)
      });
    }

    // Send heater data if configured
    if (heater_id) {
      await axios.post(`${API_URL}/update_heater_temp`, {
        heater_id,
        obs_temp: random(25, 60)
      });
      await axios.post(`${API_URL}/update_heater_humidity`, {
        heater_id,
        obs_humidity: random(30, 70)
      });
    }

    // Send battery data if configured
    if (battery_id) {
      await axios.post(`${API_URL}/update_battery_charge`, {
        battery_id,
        charge: random(20, 100)
      });
    }

    console.log(`📡 [${new Date().toLocaleTimeString()}] Sent simulated data successfully!`);
  } catch (err) {
    console.error("❌ Error sending data:", err.response?.data || err.message);
  }
}

// Main function
async function main() {
  console.log("🚀 Starting Device Simulator...\n");

  // Authenticate device first
  const authenticated = await authenticateDevice();
  
  if (!authenticated) {
    console.error("\n❌ Cannot start simulator without authentication");
    process.exit(1);
  }

  // Check if components are configured
  if (!heater_id && !cooler_id && !battery_id) {
    console.log("\n⚠️  Warning: No components configured for this device");
    console.log("   Add components through the Control Panel in the frontend");
  }

  console.log("\n📊 Starting data transmission (every 5 seconds)...\n");

  // Send data immediately
  await sendData();

  // Then send every 5 seconds
  setInterval(sendData, 5000);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log("\n\n🛑 Shutting down simulator...");
  
  if (deviceId) {
    try {
      await axios.post(`${API_URL}/update_device`, {
        device_id: deviceId,
        status: false
      });
      console.log("✅ Device marked as offline");
    } catch (err) {
      console.error("❌ Error updating device status:", err.message);
    }
  }
  
  console.log("👋 Goodbye!\n");
  process.exit(0);
});

// Start the simulator
main();