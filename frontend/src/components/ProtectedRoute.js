// frontend/src/components/ProtectedRoute.js
import React, {useState} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import DataLoader from './DataLoader';
import Dashboard from '../pages/Dashboard';
import { DataProvider } from '../context/DataContext';
import { GoldProvider } from '../context/GoldContext';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const location = useLocation();
    const logRoutes = ['/dashboard','/salary-profile', '/paycheck-log', '/expenditures', '/trades'];
    const logGoldRoutes = '/gold-wallet';
    const needsDataProvider = !logRoutes.includes(location.pathname) && !location.pathname.startsWith(logGoldRoutes);
    const needGoldData = location.pathname === '/gold-wallet/summary';
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const handleSidebarToggle = () => setSidebarOpen(open => !open);

    // If there's a token, render the child routes (via <Outlet />).
    // Otherwise, redirect the user to the login page.
    return token ? (
        <div className="App">
            <Navbar onSidebarToggle={handleSidebarToggle}/>
            <Sidebar/>
            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
                {needsDataProvider ? (
                <DataProvider>
                    <GoldProvider>
                        <DataLoader>
                            <Outlet />
                        </DataLoader>
                    </GoldProvider>
                </DataProvider>
            ) : needGoldData ? (
                <GoldProvider>
                    <Outlet />
                </GoldProvider>
            ):
            (
                <Outlet />
            )}
            </main>
        </div>
    ) : <Navigate to="/" replace />;
};

export default ProtectedRoute;
