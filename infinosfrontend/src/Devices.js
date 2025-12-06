// Updated Devices.js with claiming modal
import "./Devices.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "./supabaseClient";
import Navbar from "./components/layout/Navbar";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showClaimModal, setShowClaimModal] = useState(false);

  if (localStorage.getItem("open") === "true") {
    localStorage.setItem("open", "false");
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);

        if (user) {
          const res = await axios.get("/device/my-devices", {
            params: { ownerId: user.id },
          });
          setDevices(res.data);
        }
      } catch (err) {
        console.error("Error fetching devices:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get("/device/my-devices", {
        params: { ownerId: user.id },
      });
      setDevices(res.data);
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  const changeStatus = (index) => async (event) => {
    const device = devices[index];
    const newStatus = !device.status;

    try {
      await axios.post("/device/update_device", {
        device_id: device._id,
        status: newStatus,
      });

      const res = await axios.get("/device/my-devices", {
        params: { ownerId: user.id },
      });
      setDevices(res.data);
    } catch (err) {
      console.error("Error updating device:", err);
    }
  };

  const DownloadLogs = (device) => async (e) => {
    e.stopPropagation();
    
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text(`${device.name} - Device Logs`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

      let yPosition = 35;

      if (device.heating?.length > 0) {
        const heaterRes = await axios.get("/device/get_heaters", {
          params: { heater_ids: device.heating },
        });

        const tempData = [];
        const humidityData = [];

        heaterRes.data.forEach((heater) => {
          heater.observed_temp?.slice(-1000).reverse().forEach((obs) => {
            tempData.push([
              `${device.name} Heater`,
              obs.obs_temp || 0,
              obs.TimeStamp || obs.Date || "",
            ]);
          });

          heater.observed_humidity?.slice(-1000).reverse().forEach((obs) => {
            humidityData.push([
              `${device.name} Heater`,
              obs.obs_humidity || 0,
              obs.TimeStamp || obs.Date || "",
            ]);
          });
        });

        if (tempData.length > 0) {
          doc.autoTable({
            startY: yPosition,
            head: [["Device", "Temperature (°C)", "Timestamp"]],
            body: tempData,
            headStyles: { fillColor: [255, 107, 53] },
          });
          yPosition = doc.lastAutoTable.finalY + 10;
        }

        if (humidityData.length > 0) {
          doc.autoTable({
            startY: yPosition,
            head: [["Device", "Humidity (%)", "Timestamp"]],
            body: humidityData,
            headStyles: { fillColor: [255, 107, 53] },
          });
          yPosition = doc.lastAutoTable.finalY + 10;
        }
      }

      if (device.cooling?.length > 0) {
        const coolerRes = await axios.get("/device/get_coolers", {
          params: { cooler_ids: device.cooling },
        });

        const tempData = [];
        const humidityData = [];

        coolerRes.data.forEach((cooler) => {
          cooler.observed_temp?.slice(-1000).reverse().forEach((obs) => {
            tempData.push([
              `${device.name} Cooler`,
              obs.obs_temp || 0,
              obs.TimeStamp || obs.Date || "",
            ]);
          });

          cooler.observed_humidity?.slice(-1000).reverse().forEach((obs) => {
            humidityData.push([
              `${device.name} Cooler`,
              obs.obs_humidity || 0,
              obs.TimeStamp || obs.Date || "",
            ]);
          });
        });

        if (tempData.length > 0) {
          doc.autoTable({
            startY: yPosition,
            head: [["Device", "Temperature (°C)", "Timestamp"]],
            body: tempData,
            headStyles: { fillColor: [59, 130, 246] },
          });
          yPosition = doc.lastAutoTable.finalY + 10;
        }

        if (humidityData.length > 0) {
          doc.autoTable({
            startY: yPosition,
            head: [["Device", "Humidity (%)", "Timestamp"]],
            body: humidityData,
            headStyles: { fillColor: [59, 130, 246] },
          });
          yPosition = doc.lastAutoTable.finalY + 10;
        }
      }

      if (device.battery?.length > 0) {
        const batteryRes = await axios.get("/device/get_batteries", {
          params: { battery_ids: device.battery },
        });

        const chargeData = [];

        batteryRes.data.forEach((battery) => {
          battery.battery_charge_left?.slice(-1000).reverse().forEach((obs) => {
            chargeData.push([
              `${device.name} Battery`,
              obs.battery_charge_left || 0,
              obs.TimeStamp || obs.Date || "",
            ]);
          });
        });

        if (chargeData.length > 0) {
          doc.autoTable({
            startY: yPosition,
            head: [["Device", "Battery Charge (%)", "Timestamp"]],
            body: chargeData,
            headStyles: { fillColor: [245, 158, 11] },
          });
        }
      }

      doc.save(`${device.name}_Logs.pdf`);
    } catch (err) {
      console.error("Error generating logs:", err);
      alert("Failed to generate logs. Please try again.");
    }
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "online" && device.status) ||
      (filterStatus === "offline" && !device.status);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="devices-layout">
        <Navbar user={user} />
        <div className="devices-loading">
          <div className="loading-spinner"></div>
          <p>Loading your devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="devices-layout">
      <Navbar user={user} />
      <div className="devices-content">
        <div className="devices-header">
          <div>
            <h1 className="devices-title">Your Devices</h1>
            <p className="devices-subtitle">
              Manage and monitor all your IoT devices
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowClaimModal(true)}
            leftIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/>
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
              </svg>
            }
          >
            Claim Device
          </Button>
        </div>

        <div className="devices-filters">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterStatus === "all" ? "filter-btn-active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All ({devices.length})
            </button>
            <button
              className={`filter-btn ${filterStatus === "online" ? "filter-btn-active" : ""}`}
              onClick={() => setFilterStatus("online")}
            >
              Online ({devices.filter(d => d.status).length})
            </button>
            <button
              className={`filter-btn ${filterStatus === "offline" ? "filter-btn-active" : ""}`}
              onClick={() => setFilterStatus("offline")}
            >
              Offline ({devices.filter(d => !d.status).length})
            </button>
          </div>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <path d="M12 18h.01"/>
              </svg>
            </div>
            <h3 className="empty-state-title">
              {searchTerm || filterStatus !== "all" ? "No devices found" : "No devices yet"}
            </h3>
            <p className="empty-state-description">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Claim your first device by entering its code"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button variant="primary" onClick={() => setShowClaimModal(true)}>
                Claim Your First Device
              </Button>
            )}
          </div>
        ) : (
          <div className="devices-grid">
            {filteredDevices.map((device, index) => (
              <Card
                key={device._id}
                className="device-card"
                hoverable
                onClick={() => {
                  if (device.status) {
                    localStorage.setItem("deviceid", device._id);
                    localStorage.setItem("open", "true");
                    navigate("/control");
                  }
                }}
              >
                <div className="device-card-header">
                  <div className="device-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="5" y="2" width="14" height="20" rx="2"/>
                      <path d="M12 18h.01"/>
                    </svg>
                  </div>
                  <span className={`device-status-badge ${device.status ? "status-online" : "status-offline"}`}>
                    <span className="status-dot"></span>
                    {device.status ? "Online" : "Offline"}
                  </span>
                </div>

                <h3 className="device-card-name">{device.name}</h3>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 16px 0', fontFamily: 'monospace' }}>
                  {device.deviceCode}
                </p>

                <div className="device-card-components">
                  {device.heating?.length > 0 && (
                    <div className="component-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M8 2v20M16 2v20M12 2v20"/>
                      </svg>
                      <span>{device.heating.length} Heater{device.heating.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {device.cooling?.length > 0 && (
                    <div className="component-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M2 12h20M12 2v20"/>
                      </svg>
                      <span>{device.cooling.length} Cooler{device.cooling.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {device.battery?.length > 0 && (
                    <div className="component-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="1" y="6" width="18" height="12" rx="2"/>
                        <path d="M23 13v-2"/>
                      </svg>
                      <span>{device.battery.length} Battery</span>
                    </div>
                  )}
                </div>

                <div className="device-card-actions" onClick={(e) => e.stopPropagation()}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={device.status}
                      onChange={changeStatus(index)}
                    />
                    <span className="toggle-slider"></span>
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={DownloadLogs(device)}
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    }
                  >
                    Logs
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Claim Device Modal */}
      {showClaimModal && (
        <ClaimDeviceModal
          user={user}
          onClose={() => setShowClaimModal(false)}
          onDeviceClaimed={fetchDevices}
        />
      )}
    </div>
  );
}

// Claim Device Modal Component
function ClaimDeviceModal({ user, onClose, onDeviceClaimed }) {
  const [step, setStep] = useState(1);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);

  const verifyCode = async () => {
    if (!deviceCode.trim()) {
      setError('Please enter a device code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('http://localhost:4000/device/verify-code', {
        params: { deviceCode: deviceCode.trim().toUpperCase() }
      });

      if (response.data.valid) {
        setDeviceInfo(response.data.device);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid device code');
    } finally {
      setLoading(false);
    }
  };

  const claimDevice = async () => {
    if (!deviceName.trim()) {
      setError('Please enter a device name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:4000/device/claim', {
        deviceCode: deviceCode.trim().toUpperCase(),
        ownerId: user.id,
        deviceName: deviceName.trim()
      });

      if (response.data.device) {
        onDeviceClaimed?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Modal content here - implementation continues... */}
        <div style={{ padding: '24px' }}>
          <h2>Claim Device - Step {step} of 2</h2>
          {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
          
          {step === 1 && (
            <>
              <input
                type="text"
                placeholder="Enter device code (INF-XXXX-XXXX)"
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
              />
              <button onClick={verifyCode} disabled={loading}>
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </>
          )}
          
          {step === 2 && (
            <>
              <p>Device verified: {deviceInfo?.deviceCode}</p>
              <input
                type="text"
                placeholder="Enter device name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
              />
              <button onClick={claimDevice} disabled={loading}>
                {loading ? 'Claiming...' : 'Claim Device'}
              </button>
            </>
          )}
          
          <button onClick={onClose} style={{ marginTop: '16px' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default Devices;

// import "./Devices.css"
// import logo from "./images/logo_black.svg"
// import { Button } from "@mui/material"
// import AddIcon from '@mui/icons-material/Add';
// import { alpha,styled } from "@mui/material/styles";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import { useEffect, useState } from "react";
// import { green } from "@mui/material/colors";
// import Switch from "@mui/material/Switch";
// import { useNavigate } from "react-router-dom";
// import { Fragment } from "react";
// import axios from "axios";
// import { responsiveProperty } from "@mui/material/styles/cssUtils";
// import jsPDF from 'jspdf'
// import autoTable from 'jspdf-autotable'
// import { supabase } from "./supabaseClient";


// const PinkSwitch = styled(Switch)(({ theme }) => ({
//     '& .MuiSwitch-switchBase.Mui-checked': {
//       color: "#76ff03",
//       '&:hover': {
//         backgroundColor: alpha("#76ff03", theme.palette.action.hoverOpacity),
//       },
//     },
//     '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
//       backgroundColor: "#76ff03",
//     },
//   }));


// function Devices(){
//     const navigate = useNavigate() ;
//     const [check,Setcheck] = useState([true,false]) ;
//     const [Devices,setDevices]  = useState([]) ;
//     const [render,Setrender] = useState(false) ;
//     if(localStorage.getItem("open")==="true"){
//         localStorage.setItem("open","false") ;
//     }

//     useEffect(() => {
//       async function fetchDevices() {
//         try {
//           // 1️⃣ Get the currently logged-in user from Supabase
//           const { data: { user }, error } = await supabase.auth.getUser();

//           if (error) {
//             console.error("Error getting Supabase user:", error.message);
//             return;
//           }

//           if (!user) {
//             console.log("No logged-in user found");
//             return;
//           }

//           // 2️⃣ Call backend with this user's id as ownerId
//           const res = await axios.get("/device/my-devices", {
//             params: { ownerId: user.id },   // this becomes ?ownerId=<user.id>
//           });

//           // 3️⃣ Save devices in React state
//           setDevices(res.data);
//           console.log("User devices:", res.data);
//         } catch (err) {
//           console.error("Error fetching user devices:", err);
//         }
//       }

//       fetchDevices();
//     }, []);  // empty dependency array: runs once when component mounts


//     const changeStatus = (index) => (event) => {
//         console.log(index,"hello") ;
//         var val=Devices[index].status ;
//         var request = {
//             device_id:Devices[index]._id ,
//             status:!val
//         } ;
//         axios.post("/device/update_device",request).then(res=>{
//             axios.get("/device/").then(res =>{
//                 setDevices(res.data) ;
//             })                
//         })
//     };

//     async function AddDevice(e) {
//       let name = window.prompt("Enter Name of Device");
//       if (!name) {
//         alert("Name of Device cannot be empty");
//         return;
//       }
  
//       // ✅ Get current logged-in user from Supabase
//       const { data, error } = await supabase.auth.getUser();
  
//       if (error) {
//         console.error("Error getting user from Supabase:", error.message);
//         alert("Could not get logged-in user. Please re-login.");
//         return;
//       }
  
//       const user = data.user;      // ✅ now 'user' is defined here
  
//       if (!user) {
//         alert("No user logged in");
//         return;
//       }
  
//       // ✅ Attach ownerId to device
//       const newDevice = {
//         name: name,
//         status: false,
//         heating: [],
//         cooling: [],
//         battery: [],
//         safety_low_temp: 0,
//         safety_high_temp: 100,
//         bag_temp: 25,
//         ownerId: user.id,          // ✅ this now works
//       };
  
//       try {
//         await axios.post("/device/add_device", newDevice);
    
//         // (optional) refresh device list for this user
//         const res = await axios.get("/device/my-devices", {
//           params: { ownerId: user.id },
//         });
//         setDevices(res.data);
//       } catch (err) {
//         console.error("Error adding device:", err);
//       }
//     }

//       const DownloadLogs = (index) => (e)=>{
//         e.stopPropagation()
//         var heaterId = Devices[index]["heating"]
//         var coolerId = Devices[index]["cooling"]
//         var batteryId = Devices[index]["battery"]
//         const doc = new jsPDF()
//         axios.get("/device/get_heaters",{params:{heater_ids:heaterId}}).then(res=>{
//             var n = res.data.length ;
//             console.log(heaterId,"hello") ;
//             console.log(res,"hello")
//             var jsonData = [] ;
//             var jsonDataHumidity = [] ;
//             for(var i=0;i<n;i++){
//                 var vals=[] ;
//                 var len=res.data[i].observed_temp.length ;
//                 var cnt=0 ;
//                 const labels=[]
//                 for(var j=len-1;j>=0;j--){
//                     jsonData.push([
//                         Devices[index]["name"]+" Heater",
//                         res.data[i].observed_temp[j]["obs_temp"],
//                         (res.data[i].observed_temp[j]["TimeStamp"]!=undefined ? res.data[i].observed_temp[j]["TimeStamp"] :res.data[i].observed_temp[j]["Date"]),
//                     ])                  
//                     cnt=cnt+1 ;
//                     if(cnt>=1000){
//                         break ;
//                     }
//                 }
//             }
//             for(var i=0;i<n;i++){
//                 var vals=[] ;
//                 var len=res.data[i].observed_humidity.length ;
//                 var cnt=0 ;
//                 const labels=[]
//                 for(var j=len-1;j>=0;j--){
//                     jsonDataHumidity.push([
//                         Devices[index]["name"]+" Heater",
//                         res.data[i].observed_humidity[j]["obs_humidity"],
//                         (res.data[i].observed_humidity[j]["TimeStamp"]!=undefined ? res.data[i].observed_humidity[j]["TimeStamp"] :res.data[i].observed_humidity[j]["Date"]),
//                     ])                  
//                     cnt=cnt+1 ;
//                     if(cnt>=1000){
//                         break ;
//                     }
//                 }
//             }            
//             doc.autoTable({
//                 head: [['Device','Temperature','TimeStamp']],
//                 body: jsonData
//             })
//             doc.autoTable({
//                 head: [['Device','Humidity','TimeStamp']],
//                 body: jsonDataHumidity
//             })  

//             axios.get("/device/get_coolers",{params:{cooler_ids:coolerId}}).then(res=>{
//                 var n = res.data.length ;
//                 console.log(coolerId,"hello") ;
//                 console.log(res,"hello")
//                 var jsonData = [] ;
//                 var jsonDataHumidity = [] ;
//                 for(var i=0;i<n;i++){
//                     var vals=[] ;
//                     var len=res.data[i].observed_temp.length ;
//                     var cnt=0 ;
//                     const labels=[]
//                     for(var j=len-1;j>=0;j--){
//                         jsonData.push([
//                             Devices[index]["name"]+" Cooler",
//                             res.data[i].observed_temp[j]["obs_temp"],
//                             (res.data[i].observed_temp[j]["TimeStamp"]!=undefined ? res.data[i].observed_temp[j]["TimeStamp"] :res.data[i].observed_temp[j]["Date"]),
//                         ])                  
//                         cnt=cnt+1 ;
//                         if(cnt>=1000){
//                             break ;
//                         }
//                     }
//                 }
//                 for(var i=0;i<n;i++){
//                     var vals=[] ;
//                     var len=res.data[i].observed_humidity.length ;
//                     var cnt=0 ;
//                     const labels=[]
//                     for(var j=len-1;j>=0;j--){
//                         jsonDataHumidity.push([
//                             Devices[index]["name"]+" Cooler",
//                             res.data[i].observed_humidity[j]["obs_humidity"],
//                             (res.data[i].observed_humidity[j]["TimeStamp"]!=undefined ? res.data[i].observed_humidity[j]["TimeStamp"] :res.data[i].observed_humidity[j]["Date"]),
//                         ])                  
//                         cnt=cnt+1 ;
//                         if(cnt>=1000){
//                             break ;
//                         }
//                     }
//                 }            
//                 doc.autoTable({
//                     head: [['Device','Temperature','TimeStamp']],
//                     body: jsonData
//                 })
//                 doc.autoTable({
//                     head: [['Device','Humidity','TimeStamp']],
//                     body: jsonDataHumidity
//                 })
                
//                 axios.get("/device/get_batteries",{params:{battery_ids:batteryId}}).then(res=>{
//                     var n = res.data.length ;
//                     var jsonData = [] ;
//                     for(var i=0;i<n;i++){
//                         var vals=[] ;
//                         var len=res.data[i].battery_charge_left.length ;
//                         var cnt=0 ;
//                         const labels=[]
//                         for(var j=len-1;j>=0;j--){
//                             jsonData.push([
//                                 Devices[index]["name"]+" Battery",
//                                 res.data[i].battery_charge_left[j]["battery_charge_left"],
//                                 (res.data[i].battery_charge_left[j]["TimeStamp"]!=undefined ? res.data[i].battery_charge_left[j]["TimeStamp"] :res.data[i].battery_charge_left[j]["Date"]),
//                             ])                  
//                             cnt=cnt+1 ;
//                             if(cnt>=1000){
//                                 break ;
//                             }
//                         }
//                     }        
//                     doc.autoTable({
//                         head: [['Device',' Battery Charge Left','TimeStamp']],
//                         body: jsonData
//                     })          
//                     doc.save(Devices[index]["name"]+' Logs.pdf')           
//                 }
//                 ) 
//             }
//             )                              
//         }
//         )
// }

//     const handleChildElementClick = (e) => {
//         e.stopPropagation()
//      }


//     return(
//         <div className="main-header">
//             <img className="logo" src={logo} onClick={()=>{
//                 navigate("/") ;
//             }}></img>
//             <Button className= "Addbtn" onClick={AddDevice} sx={{fontSize:"12px"}} variant="contained" label="Button" labelStyle={{ fontSize: '12px'}}startIcon={<AddIcon />}>Add Device</Button>
//             <br/><br/>
//             <br/>
//             { Devices.map((item,index) =>
//                 <Fragment>
//                 <div onClick={()=>{
//                     if(item.status){
//                         localStorage.setItem("deviceid",item._id) ;
//                         localStorage.setItem("open","true") ;
//                         navigate("/control") ;
//                     }
//                 }} className="devices" style={{float:"left"}}>
//                     <p className="devname">{item.name}</p>
//                     <p style={{marginBottom:"0px",marginTop:"30px",fontSize:"14px",color:"#ffffff"}}>{item.status ? "Connected" : "Disconnected"}</p>
//                     <PinkSwitch onClick={(e) => handleChildElementClick(e)} sx={{width:"60px",marginTop:"0px"}} className="switch" checked={item.status} onChange={changeStatus(index)}/>
//                     <br/>
//                     <Button className= "Addbtn1" onClick={DownloadLogs(index)} sx={{backgroundColor:"grey",fontSize:"10px"}} variant="contained" label="Button" labelStyle={{ fontSize: '12px'}}>Logs</Button>
//                 </div>
//                 </Fragment>
//             )
//             }
//         </div>

//     )
// }
// export default Devices