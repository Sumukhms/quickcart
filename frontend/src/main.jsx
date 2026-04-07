import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider }        from "./context/ThemeContext.jsx";
import { AuthProvider }         from "./context/AuthContext.jsx";
import { CartProvider }         from "./context/CartContext.jsx";
import { SocketProvider }       from "./context/SocketContext.jsx";
import { FavoriteProvider }     from "./context/FavoriteContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";  // NEW
import ErrorBoundary            from "./components/ui/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <FavoriteProvider>
                <SocketProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </SocketProvider>
              </FavoriteProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => console.log("SW registered:", reg.scope))
      .catch((err) => console.error("SW registration failed:", err));
  });
}