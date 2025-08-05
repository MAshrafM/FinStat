// frontend/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { DataProvider } from '../context/DataContext';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // If there's a token, render the child routes (via <Outlet />).
    // Otherwise, redirect the user to the login page.
    return token ?
    <DataProvider>
        <div className="App">
            <Navbar />
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    </DataProvider >
        : <Navigate to="/" replace />;
};

export default ProtectedRoute;
