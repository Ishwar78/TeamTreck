const API_BASE = "https://mbbsgyan.com";

let token = localStorage.getItem("auth_token");
let deviceId = localStorage.getItem("device_id");
let isTracking = false;
let isPaused = false;

let lastActivityTime = Date.now();
let isIdle = false;
const IDLE_LIMIT = 3 * 60 * 1000;

if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem("device_id", deviceId);
}

const loginBtn = document.getElementById("loginBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const pauseBtn = document.getElementById("pauseBtn");
const logoutBtn = document.getElementById("logoutBtn");

const statusText = document.getElementById("statusText");
const timerDisplay = document.getElementById("sessionTimer");
const liveIndicator = document.getElementById("liveIndicator");
const dot = document.querySelector(".dot");
const deviceText = document.getElementById("deviceText");
const activityStatus = document.getElementById("activityStatus");




deviceText.innerText = deviceId;

/* ================= STATUS ================= */

function setStatus(text, type = "info") {
  statusText.innerText = text;
  const colors = {
    info: "#ffffff",
    success: "#28c76f",
    error: "#ea5455",
    active: "#00f5d4"
  };
  statusText.style.color = colors[type] || "#ffffff";
}

/* ================= TIMER ================= */

let seconds = 0;
let timerInterval = null;

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  timerDisplay.innerText = `${hrs}:${mins}:${secs}`;
}

/* ================= IDLE TRACKING ================= */

function markActivity() {
  if (!isTracking || isPaused) return;

  lastActivityTime = Date.now();

  if (isIdle) {
    isIdle = false;
    activityStatus.classList.remove("idle");
    activityStatus.innerText = "Active";
    setStatus("User Active ✔", "success");
  }
}

window.addEventListener("mousemove", markActivity);
window.addEventListener("keydown", markActivity);

setInterval(() => {
  if (!isTracking || isPaused) return;

  const now = Date.now();
  const idleTime = now - lastActivityTime;

  if (idleTime >= IDLE_LIMIT && !isIdle) {
    isIdle = true;
    activityStatus.classList.add("idle");
    activityStatus.innerText = "Idle";
    setStatus("Idle detected ⚠ (3 min)", "error");
    // setStatus("Idle detected ⚠ (1 min)", "error");
  }
}, 2000);

/* ================= AUTO LOGIN ================= */

if (token) {
  loginBtn.innerHTML = "✔ Logged In";
  loginBtn.style.background = "#28c76f";
  startBtn.disabled = false;
  setStatus("Session Restored ✔", "success");

  // AUTO-START RESTORED SESSION
  // We should ideally check if session was active. For now, let's trigger start.
  // In a real app, main process would tell us the status.
  // Assuming if we have token, we might be active.
  // Let's just enable buttons. Auto-start on fresh login is key.
}

/* ================= LOGIN ================= */

loginBtn.onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setStatus("Enter email & password", "error");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = "⏳ Authenticating...";

  try {
    // const res = await fetch("http://localhost:5000/api/auth/login", {

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, device_id: deviceId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error();

    token = data.token;
    localStorage.setItem("auth_token", token);

    loginBtn.innerHTML = "✔ Logged In";
    loginBtn.style.background = "#28c76f";
    startBtn.disabled = false;

    setStatus("Login successful ✔", "success");

    // AUTO-START SESSION
    startBtn.onclick();
  } catch {
    setStatus("Login failed", "error");
    loginBtn.disabled = false;
    loginBtn.innerHTML = "Login";
  }
};

/* ================= START SESSION ================= */

startBtn.onclick = () => {
  // Use local time as start if not provided
  // In real implementation, backend/main should provide the server start time
  // to avoid drift. For now, we use Date.now() but persist it.

  if (!localStorage.getItem('sessionStartTime')) {
    localStorage.setItem('sessionStartTime', String(Date.now()));
  }

  const startTime = parseInt(localStorage.getItem('sessionStartTime'));

  // Calculate seconds based on elapsed time
  seconds = Math.floor((Date.now() - startTime) / 1000);

  window.agentAPI.startSession({ token, deviceId });

  isTracking = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  pauseBtn.disabled = false;

  dot.classList.add("active");
  liveIndicator.lastChild.textContent = " Tracking Active";

  startTimer();
  setStatus("Tracking started 🚀", "active");
};

/* ================= PAUSE / RESUME ================= */

pauseBtn.onclick = () => {
  if (!isTracking) return;

  if (!isPaused) {
    isPaused = true;
    window.agentAPI.pauseSession();
    stopTimer();
    dot.classList.remove("active");
    liveIndicator.lastChild.textContent = " Paused";
    pauseBtn.innerText = "▶ Resume Tracking";
    setStatus("Tracking paused ⏸", "error");
  } else {
    isPaused = false;
    window.agentAPI.resumeSession();
    lastActivityTime = Date.now();
    dot.classList.add("active");
    liveIndicator.lastChild.textContent = " Tracking Active";
    pauseBtn.innerText = "⏸ Pause Tracking";
    startTimer();
    setStatus("Tracking resumed ▶", "success");
  }
};

/* ================= STOP SESSION ================= */

stopBtn.onclick = () => {
  window.agentAPI.endSession();

  isTracking = false;
  isPaused = false;

  stopBtn.disabled = true;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.innerText = "⏸ Pause Tracking";

  dot.classList.remove("active");
  liveIndicator.lastChild.textContent = " Not Tracking";

  stopTimer();
  // seconds = 0; // User wants to see the time even after stop/pause
  // updateTimerDisplay(); // Keep the last time displayed

  // Clear start time
  localStorage.removeItem('sessionStartTime');

  setStatus("Tracking stopped ⏹", "error");
};

/* ================= SEND ACTIVITY ================= */

// REMOVED REPEATED INTERVAL THAT CAUSED CRASH

setInterval(() => {
  if (!isTracking || isPaused) return;

  window.agentAPI.sendActivityState({
    idle: isIdle,
    activity_score: isIdle ? 0 : 100
  });
}, 5000);

/* ================= LOGOUT ================= */

logoutBtn.onclick = async () => {
  try {

    if (isTracking) {
      window.agentAPI.endSession();
      stopTimer();
    }

    window.agentAPI.logout();

    localStorage.removeItem("auth_token");
    token = null;

    loginBtn.innerHTML = "Login";
    loginBtn.style.background = "#00f5d4";
    loginBtn.disabled = false;

    startBtn.disabled = true;
    stopBtn.disabled = true;
    pauseBtn.disabled = true;

    dot.classList.remove("active");
    liveIndicator.lastChild.textContent = " Not Tracking";

    seconds = 0;
    updateTimerDisplay();

    activityStatus.innerText = "Inactive";
    activityStatus.classList.remove("idle");

    setStatus("Logged out successfully ✔", "info");

  } catch (err) {
    setStatus("Logout failed", "error");
  }
};