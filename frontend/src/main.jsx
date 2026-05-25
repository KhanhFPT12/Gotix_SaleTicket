import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { TicketProvider } from "./context/TicketContext";
import "./styles/global.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <TicketProvider>
            <App />
          </TicketProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
