// src/main.jsx (FULL RESTORED VERSION)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx'; 
// ✅ UNCOMMENTED THESE TO RESTORE FEATURES
import { CartProvider } from './context/CartContext.jsx'; 
import { ThemeProvider } from './context/ThemeContext.jsx'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Future flags added to silence warnings */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SocketProvider>
           <CartProvider>
              <ThemeProvider>
                  <App />
              </ThemeProvider>
           </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);