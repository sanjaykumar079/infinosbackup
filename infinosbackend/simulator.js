// simulator.js
const axios = require("axios");

const BASE_URL = "http://localhost:4000/device";

// 🔁 replace with real IDs from your DB
const HEATER_ID = null;                         // e.g. "64f0c3..." when you have one
const COOLER_ID = "692df292defcbf4fe430393e";   // from your DB
const BATTERY_ID = null;                        // later, when created

function rand(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

// --- COOLER SIMULATION ---
async function sendCoolerReadings() {
  if (!COOLER_ID) return;

  const temp = rand(-5, 10);      // -5°C to 10°C
  const humidity = rand(40, 80);  // 40%–80%

  try {
    await axios.post(`${BASE_URL}/update_cooler_temp`, {
      cooler_id: COOLER_ID,
      obs_temp: temp,
    });

    await axios.post(`${BASE_URL}/update_cooler_humidity`, {
      cooler_id: COOLER_ID,
      obs_humidity: humidity,
    });

    console.log(`[COOLER] temp=${temp}°C  humidity=${humidity}%`);
  } catch (err) {
    console.error("Cooler error:", err.message);
  }
}

// --- HEATER SIMULATION ---
async function sendHeaterReadings() {
  if (!HEATER_ID) return;

  const temp = rand(20, 45);
  const humidity = rand(20, 60);

  try {
    await axios.post(`${BASE_URL}/update_heater_temp`, {
      heater_id: HEATER_ID,
      obs_temp: temp,
    });

    await axios.post(`${BASE_URL}/update_heater_humidity`, {
      heater_id: HEATER_ID,
      obs_humidity: humidity,
    });

    console.log(`[HEATER] temp=${temp}°C  humidity=${humidity}%`);
  } catch (err) {
    console.error("Heater error:", err.message);
  }
}

// --- BATTERY SIMULATION ---
async function sendBatteryReadings() {
  if (!BATTERY_ID) return;

  const charge = rand(20, 100); // battery %
  try {
    await axios.post(`${BASE_URL}/update_battery_charge`, {
      battery_id: BATTERY_ID,
      charge,
    });

    console.log(`[BATTERY] charge=${charge}%`);
  } catch (err) {
    console.error("Battery error:", err.message);
  }
}

async function tick() {
  await sendCoolerReadings();
  await sendHeaterReadings();
  await sendBatteryReadings();
}

console.log("🔌 Virtual device started – sending data every 5 seconds...");
setInterval(tick, 5000);
