const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("agentAPI", {

  startSession: (data) => ipcRenderer.send("start-session", data),

  pauseSession: () => ipcRenderer.send("pause-session"),

  resumeSession: () => ipcRenderer.send("resume-session"),

  endSession: () => ipcRenderer.send("end-session"),

  sendActivityState: (data) => ipcRenderer.send("activity-state", data),

  logout: () => ipcRenderer.send("agent-logout"),

  // ✅ NEW ADD
  openDashboard: (url) => ipcRenderer.send("open-dashboard", url)

});











// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('agentAPI', {

//   /* ================= SESSION ================= */
//   startSession: (data) => ipcRenderer.send('start-session', data),
//   pauseSession: () => ipcRenderer.send('pause-session'),
//   resumeSession: () => ipcRenderer.send('resume-session'),
//   endSession: () => ipcRenderer.send('end-session'),

//   /* ================= ACTIVITY ================= */
//   sendActivityState: (data) => ipcRenderer.send('activity-state', data),

//   /* ================= LOGOUT ================= */
//   logout: () => ipcRenderer.send('agent-logout')

// });



