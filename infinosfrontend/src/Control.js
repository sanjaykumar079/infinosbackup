import "./Control.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "./supabaseClient";
import Navbar from "./components/layout/Navbar";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import LineChart from "./LineChart";

function Control() {
  const [activeTab, setActiveTab] = useState("control");
  const [heating, setHeating] = useState([]);
  const [cooling, setCooling] = useState([]);
  const [battery, setBattery] = useState([]);
  const [device, setDevice] = useState(null);
  const [user, setUser] = useState(null);
  const [heatChartData, setHeatChartData] = useState([]);
  const [coolChartData, setCoolChartData] = useState([]);
  const [batteryChartData, setBatteryChartData] = useState([]);
  const [componentType, setComponentType] = useState("heater");
  const navigate = useNavigate();

  const safeLast = (arr, key, fallback = 0) => {
    if (!Array.isArray(arr) || arr.length === 0) return fallback;
    const last = arr[arr.length - 1];
    if (last == null) return fallback;
    if (!key) return last;
    return last[key] ?? fallback;
  };

  const getData = async () => {
    const deviceId = localStorage.getItem("deviceid");
    if (!deviceId) return;

    try {
      const deviceRes = await axios.get("/device/get_device", {
        params: { device_id: deviceId },
      });
      setDevice(deviceRes.data);

      const heaterIds = deviceRes.data.heating || [];
      const coolerIds = deviceRes.data.cooling || [];
      const batteryIds = deviceRes.data.battery || [];

      if (heaterIds.length > 0) {
        const heatersRes = await axios.get("/device/get_heaters", {
          params: { heater_ids: heaterIds },
        });
        const heaters = Array.isArray(heatersRes.data) ? heatersRes.data : [];
        setHeating(heaters);

        const heatPlots = heaters.map((heater) => {
          const obs = Array.isArray(heater.observed_temp) ? heater.observed_temp : [];
          const vals = [];
          const labels = [];
          let cnt = 0;
          for (let j = obs.length - 1; j >= 0 && cnt < 8; j--) {
            const entry = obs[j] || {};
            vals.push(entry.obs_temp ?? 0);
            labels.push(entry.Date ?? "");
            cnt++;
          }
          vals.reverse();
          labels.reverse();
          return {
            labels,
            datasets: [{ data: vals, label: "Observed Temperature", borderColor: '#FF6B35', backgroundColor: 'rgba(255, 107, 53, 0.1)' }],
          };
        });
        setHeatChartData(heatPlots);
      }

      if (coolerIds.length > 0) {
        const coolersRes = await axios.get("/device/get_coolers", {
          params: { cooler_ids: coolerIds },
        });
        const coolers = Array.isArray(coolersRes.data) ? coolersRes.data : [];
        setCooling(coolers);

        const coolPlots = coolers.map((cooler) => {
          const obs = Array.isArray(cooler.observed_temp) ? cooler.observed_temp : [];
          const vals = [];
          const labels = [];
          let cnt = 0;
          for (let j = obs.length - 1; j >= 0 && cnt < 8; j--) {
            const entry = obs[j] || {};
            vals.push(entry.obs_temp ?? 0);
            labels.push(entry.Date ?? "");
            cnt++;
          }
          vals.reverse();
          labels.reverse();
          return {
            labels,
            datasets: [{ data: vals, label: "Observed Temperature", borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }],
          };
        });
        setCoolChartData(coolPlots);
      }

      if (batteryIds.length > 0) {
        const batteriesRes = await axios.get("/device/get_batteries", {
          params: { battery_ids: batteryIds },
        });
        const batteries = Array.isArray(batteriesRes.data) ? batteriesRes.data : [];
        setBattery(batteries);

        const batPlots = batteries.map((bat) => {
          const obs = Array.isArray(bat.battery_charge_left) ? bat.battery_charge_left : [];
          const vals = [];
          const labels = [];
          let cnt = 0;
          for (let j = obs.length - 1; j >= 0 && cnt < 10; j--) {
            const entry = obs[j] || {};
            vals.push(entry.battery_charge_left ?? 0);
            labels.push(entry.Date ?? "");
            cnt++;
          }
          vals.reverse();
          labels.reverse();
          return {
            labels,
            datasets: [{ data: vals, label: "Battery Charge Left", borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' }],
          };
        });
        setBatteryChartData(batPlots);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const updateHeater = async (index, updates) => {
    if (!heating[index]) return;
    try {
      await axios.post("/device/update_heater", {
        heater_id: heating[index]._id,
        ...updates,
      });
      getData();
    } catch (err) {
      console.error("Error updating heater:", err);
    }
  };

  const updateCooler = async (index, updates) => {
    if (!cooling[index]) return;
    try {
      await axios.post("/device/update_cooler", {
        cooler_id: cooling[index]._id,
        ...updates,
      });
      getData();
    } catch (err) {
      console.error("Error updating cooler:", err);
    }
  };

  const updateBattery = async (index, updates) => {
    if (!battery[index]) return;
    try {
      await axios.post("/device/update_battery", {
        battery_id: battery[index]._id,
        ...updates,
      });
      getData();
    } catch (err) {
      console.error("Error updating battery:", err);
    }
  };

  const addComponent = async () => {
    const deviceId = localStorage.getItem("deviceid");
    if (!deviceId) return;

    const name = window.prompt(`Enter Name of ${componentType}`);
    if (!name) {
      alert(`Name of ${componentType} cannot be empty`);
      return;
    }

    try {
      if (componentType === "heater") {
        if (heating.length > 0) {
          alert("Heater Limit Reached");
          return;
        }
        const newHeater = {
          name,
          desired_temp: 0,
          observed_temp: [],
          continous: true,
          discrete: false,
          fan: false,
          observed_humidity: [],
        };
        const res = await axios.post("/device/add_heater", newHeater);
        await axios.post("/device/ass_heater", {
          device_id: deviceId,
          heater_id: res.data._id,
        });
      } else if (componentType === "cooler") {
        if (cooling.length > 0) {
          alert("Cooler Limit Reached");
          return;
        }
        const newCooler = {
          name,
          desired_temp: 0,
          observed_temp: [],
          continous: true,
          discrete: false,
          fan: false,
          observed_humidity: [],
        };
        const res = await axios.post("/device/add_cooler", newCooler);
        await axios.post("/device/ass_cooler", {
          device_id: deviceId,
          cooler_id: res.data._id,
        });
      } else {
        if (battery.length > 0) {
          alert("Battery Limit Reached");
          return;
        }
        const newBattery = {
          name,
          battery_temp: [],
          battery_charge_left: [],
          fan: false,
          observed_humidity: [],
        };
        const res = await axios.post("/device/add_battery", newBattery);
        await axios.post("/device/ass_battery", {
          device_id: deviceId,
          battery_id: res.data._id,
        });
      }
      getData();
    } catch (err) {
      console.error("Error adding component:", err);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      getData();
      const interval = setInterval(getData, 1000);
      return () => clearInterval(interval);
    }
    init();
  }, []);

  if (localStorage.getItem("open") !== "true") {
    return null;
  }

  return (
    <div className="control-layout">
      <Navbar user={user} />

      <div className="control-content">
        <div className="control-header">
          <div>
            <h1 className="control-title">{device?.name || "Device Control"}</h1>
            <p className="control-subtitle">Monitor and control device components</p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/devices")}>
            Back to Devices
          </Button>
        </div>

        {/* Tabs */}
        <div className="control-tabs">
          <button
            className={`control-tab ${activeTab === "control" ? "control-tab-active" : ""}`}
            onClick={() => setActiveTab("control")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
            </svg>
            Control
          </button>
          <button
            className={`control-tab ${activeTab === "analysis" ? "control-tab-active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Analysis
          </button>
        </div>

        {/* Control Tab */}
        {activeTab === "control" && (
          <div className="control-grid">
            {/* Heater Components */}
            {heating.map((heater, index) => (
              <Card key={heater._id} title={heater.name || "Heater"} className="component-card heater-card">
                <div className="control-group">
                  <label className="control-label">Desired Temperature</label>
                  <input
                    type="number"
                    className="control-input"
                    value={heater.desired_temp ?? 0}
                    onChange={(e) =>
                      updateHeater(index, {
                        desired_temp: Number(e.target.value),
                        cont: heater.continous,
                        disc: heater.discrete,
                        fan: heater.fan,
                      })
                    }
                  />
                </div>

                <div className="toggle-group">
                  <div className="toggle-item">
                    <span className="toggle-label">Continuous</span>
                    <label className="toggle-switch-small">
                      <input
                        type="checkbox"
                        checked={!!heater.continous}
                        onChange={() =>
                          updateHeater(index, {
                            desired_temp: heater.desired_temp,
                            cont: !heater.continous,
                            disc: heater.continous,
                            fan: heater.fan,
                          })
                        }
                      />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <span className="toggle-label">Discrete</span>
                    <label className="toggle-switch-small">
                      <input
                        type="checkbox"
                        checked={!!heater.discrete}
                        onChange={() =>
                          updateHeater(index, {
                            desired_temp: heater.desired_temp,
                            cont: heater.discrete,
                            disc: !heater.discrete,
                            fan: heater.fan,
                          })
                        }
                      />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <span className="toggle-label">Fan</span>
                    <label className="toggle-switch-small">
                      <input
                        type="checkbox"
                        checked={!!heater.fan}
                        onChange={() =>
                          updateHeater(index, {
                            desired_temp: heater.desired_temp,
                            cont: heater.continous,
                            disc: heater.discrete,
                            fan: !heater.fan,
                          })
                        }
                      />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>
                </div>

                <div className="readings-grid">
                  <div className="reading-item">
                    <span className="reading-label">Temperature</span>
                    <span className="reading-value">{safeLast(heater.observed_temp, "obs_temp", 0)}°C</span>
                  </div>
                  <div className="reading-item">
                    <span className="reading-label">Humidity</span>
                    <span className="reading-value">{safeLast(heater.observed_humidity, "obs_humidity", 0)}%</span>
                  </div>
                </div>
              </Card>
            ))}

            {/* Cooler Components */}
            {cooling.map((cooler, index) => (
              <Card key={cooler._id} title={cooler.name || "Cooler"} className="component-card cooler-card">
                <div className="readings-grid">
                  <div className="reading-item">
                    <span className="reading-label">Temperature</span>
                    <span className="reading-value">{safeLast(cooler.observed_temp, "obs_temp", 0)}°C</span>
                  </div>
                  <div className="reading-item">
                    <span className="reading-label">Humidity</span>
                    <span className="reading-value">{safeLast(cooler.observed_humidity, "obs_humidity", 0)}%</span>
                  </div>
                </div>
              </Card>
            ))}

            {/* Battery Components */}
            {battery.map((bat, index) => (
              <Card key={bat._id} title={bat.name || "Battery"} className="component-card battery-card">
                <div className="toggle-group">
                  <div className="toggle-item">
                    <span className="toggle-label">Fan</span>
                    <label className="toggle-switch-small">
                      <input
                        type="checkbox"
                        checked={!!bat.fan}
                        onChange={() => updateBattery(index, { fan: !bat.fan })}
                      />
                      <span className="toggle-slider-small"></span>
                    </label>
                  </div>
                </div>

                <div className="readings-grid">
                  <div className="reading-item">
                    <span className="reading-label">Charge</span>
                    <span className="reading-value">{safeLast(bat.battery_charge_left, "battery_charge_left", 0)}%</span>
                  </div>
                </div>
              </Card>
            ))}

            {/* Safety Component */}
            {device && (
              <Card title="Safety Thresholds" className="component-card safety-card">
                <div className="safety-zones">
                  <div className="safety-zone safety-zone-low">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2v20M8 6l4-4 4 4"/>
                    </svg>
                    <span className="safety-value">{device.safety_low_temp}°C</span>
                    <span className="safety-label">Low</span>
                  </div>
                  <div className="safety-zone safety-zone-bag">
                    <span className="safety-value">{device.bag_temp}°C</span>
                    <span className="safety-label">Target</span>
                  </div>
                  <div className="safety-zone safety-zone-high">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2v20M8 18l4 4 4-4"/>
                    </svg>
                    <span className="safety-value">{device.safety_high_temp}°C</span>
                    <span className="safety-label">High</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Add Component Card */}
            <Card title="Add Component" className="component-card add-component-card">
              <select
                className="component-select"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
              >
                <option value="heater">Heater</option>
                <option value="cooler">Cooler</option>
                <option value="battery">Battery</option>
              </select>
              <Button variant="primary" fullWidth onClick={addComponent}>
                Add {componentType.charAt(0).toUpperCase() + componentType.slice(1)}
              </Button>
            </Card>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === "analysis" && (
          <div className="analysis-grid">
            {heating.map((heater, index) => (
              <Card
                key={heater._id}
                title="Temperature Trend"
                subtitle={heater.name}
                className="chart-card"
              >
                <div className="chart-wrapper">
                  <LineChart chartData={heatChartData[index] || { labels: [], datasets: [] }} />
                </div>
              </Card>
            ))}

            {cooling.map((cooler, index) => (
              <Card
                key={cooler._id}
                title="Temperature Trend"
                subtitle={cooler.name}
                className="chart-card"
              >
                <div className="chart-wrapper">
                  <LineChart chartData={coolChartData[index] || { labels: [], datasets: [] }} />
                </div>
              </Card>
            ))}

            {battery.map((bat, index) => (
              <Card
                key={bat._id}
                title="Battery Charge"
                subtitle={bat.name}
                className="chart-card"
              >
                <div className="chart-wrapper">
                  <LineChart chartData={batteryChartData[index] || { labels: [], datasets: [] }} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Control;