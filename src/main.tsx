import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { NotificationProvider } from "./components/NotificationCenter.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx"; // ✅ ADD THIS
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </AuthProvider>
);
