// App.jsx (ESM) - FINAL CORRECTED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';

// --- AUTH & COMMON PAGES ---
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import LandingPage from './pages/LandingPage.jsx'; 

// --- LAYOUTS ---
import AdminDashboardLayout from './layouts/AdminDashboardLayout.jsx';
import ResellerLayout from './layouts/ResellerLayout.jsx';

// --- ADMIN PAGES ---
import AdminDashboard from './pages/admin/AdminDashboard.jsx'; 
import ProductsManagement from './pages/admin/ProductsManagement.jsx'; 
import OrdersManagement from './pages/admin/OrdersManagement.jsx'; 
import ReportsPage from './pages/admin/ReportsPage.jsx'; 
import InventoryTracking from './pages/admin/InventoryTracking.jsx'; 
import SiteSettings from './pages/admin/SiteSettings.jsx';
import Invoice from './pages/admin/Invoice.jsx'; // Invoice Page

// --- RESELLER PAGES ---
import ProductCatalog from './pages/reseller/ProductCatalog.jsx'; 
import ProductDetails from './pages/reseller/ProductDetails.jsx'; 
import OrderHistory from './pages/reseller/OrderHistory.jsx';
import CheckoutPage from './pages/reseller/CheckoutPage.jsx';


// ====================================================================
// PRIVATE ROUTE COMPONENT
// ====================================================================

const PrivateRoute = ({ element: Element, allowedRoles, ...rest }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>; 
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />; 
    return <Element {...rest} />;
};


// ====================================================================
// MAIN APPLICATION ROUTES
// ====================================================================

const App = () => {
    return (
        <Routes>
            {/* PUBLIC ENTRY POINTS */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalog" element={<ProductCatalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            
            {/* AUTH PAGES */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PROTECTED ADMIN ROUTES */}
            <Route path="/admin" element={<PrivateRoute element={AdminDashboardLayout} allowedRoles={['admin']} />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<ProductsManagement />} />
                <Route path="inventory" element={<InventoryTracking />} />
                <Route path="orders" element={<OrdersManagement />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SiteSettings />} />
                
                {/* NEW: Invoice Route (Added correctly) */}
                <Route path="invoice/:id" element={<Invoice />} />

                <Route path="" element={<Navigate to="dashboard" replace />} /> 
            </Route>

            {/* PROTECTED RESELLER ROUTES */}
            <Route path="/reseller" element={<PrivateRoute element={ResellerLayout} allowedRoles={['reseller']} />}>
                <Route path="catalog" element={<ProductCatalog />} />
                <Route path="orders" element={<OrderHistory />} />
                <Route path="checkout" element={<CheckoutPage />} /> 
                <Route path="" element={<Navigate to="catalog" replace />} />
            </Route>
            
            <Route path="*" element={<div className="p-10 text-center">404 Not Found</div>} />
        </Routes>
    );
};

export default App;