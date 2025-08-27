// frontend/src/components/ProtectedRoute.js
import React, {useState} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import DataLoader from './DataLoader';
import Dashboard from '../pages/Dashboard';
import { DataProvider } from '../context/DataContext';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const location = useLocation();
    const logRoutes = ['/dashboard','/salary-profile', '/paycheck-log', '/expenditures', '/trades'];
    const needsDataProvider = !logRoutes.some(route => location.pathname.startsWith(route));
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
                    <DataLoader>
                        <Outlet />
                    </DataLoader>
                </DataProvider>
            ) : (
                <Outlet />
            )}
            </main>
        </div>
    ) : <Navigate to="/" replace />;
};

export default ProtectedRoute;
