import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { OfflineProvider } from "./context/OfflineContext.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineProvider>
          <AuthProvider>
            <CartProvider>
              <OfflineBanner />
              <App />
            </CartProvider>
          </AuthProvider>
        </OfflineProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
