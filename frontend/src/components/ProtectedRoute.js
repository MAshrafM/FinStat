// frontend/src/components/ProtectedRoute.js
import React, {useState} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import DataLoader from './DataLoader';
// Data Context
import { DataProvider } from '../context/DataContext';
import { GoldProvider } from '../context/GoldContext';
import { MFProvider } from '../context/MFContext';
import { CertProvider } from '../context/CertContext';
import { CurrProvider } from '../context/CurrContext';
import { BankProvider } from '../context/BankContext';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const location = useLocation();
    const logRoutes = ['/dashboard','/salary-profile', '/paycheck-log', '/expenditures', '/trades'];
    const logGoldRoutes = '/gold-wallet';
    const logMFRoutes = '/mutual-funds';
    const logCertRoutes = '/certificates';
    const logCurrRoutes = '/currency';
    const needsDataProvider = !logRoutes.includes(location.pathname) && 
                                !location.pathname.startsWith(logGoldRoutes) && 
                                    !location.pathname.startsWith(logMFRoutes) &&
                                        !location.pathname.startsWith(logCertRoutes) &&
                                            !location.pathname.startsWith(logCurrRoutes);
    const needGoldData = location.pathname === '/gold-wallet/summary';
    const needMFData = location.pathname === '/mutual-funds/summary';
    const needCertData = location.pathname === logCertRoutes;
    const needCurrData = location.pathname === logCurrRoutes;
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
                        <MFProvider>
                            <CertProvider>
                                <CurrProvider>
                                    <BankProvider>
                                        <DataLoader>
                                            <Outlet />
                                        </DataLoader>
                                    </BankProvider>
                                </CurrProvider>
                            </CertProvider>
                        </MFProvider>
                    </GoldProvider>
                </DataProvider>
            ) : needGoldData ? (
                <GoldProvider>
                    <Outlet />
                </GoldProvider>
            ): needMFData ? (
                <MFProvider>
                    <Outlet />
                </MFProvider>
            ) : needCertData ? (
                <CertProvider>
                    <Outlet />
                </CertProvider>
            ) : needCurrData ? (
                <CurrProvider>
                    <Outlet />
                </CurrProvider>
            ) :
            (
                <Outlet />
            )}
            </main>
        </div>
    ) : <Navigate to="/" replace />;
};

export default ProtectedRoute;
