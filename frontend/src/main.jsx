import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider }    from "./context/ThemeContext.jsx";
import { AuthProvider }     from "./context/AuthContext.jsx";
import { CartProvider }     from "./context/CartContext.jsx";
import { SocketProvider }   from "./context/SocketContext.jsx";
import { FavoriteProvider } from "./context/FavoriteContext.jsx";
import ErrorBoundary        from "./components/ui/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <FavoriteProvider>
                <SocketProvider>
                  <App />
                </SocketProvider>
              </FavoriteProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);