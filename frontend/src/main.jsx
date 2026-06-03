import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { TicketProvider } from "./context/TicketContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./styles/global.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE"}>
      <BrowserRouter basename="/Gotix_SaleTicket/">
        <AuthProvider>
          <ChatProvider>
            <TicketProvider>
              <App />
            </TicketProvider>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
