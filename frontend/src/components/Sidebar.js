import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Import the CSS for styling

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const menuItems = [
        {
            path: "/",
            icon: "📊",
            title: "Dashboard",
            description: "Main overview"
        },
        {
            path: "/salary-profile",
            icon: "👔",
            title: "Salary Profile",
            description: "Track salary information"
        },
        {
            path: "/paycheck-log",
            icon: "📋",
            title: "Paycheck Log",
            description: "Manage paycheck entries"
        },
        {
            path: "/expenditures",
            icon: "💰",
            title: "Expenditure Log",
            description: "Track transactions"
        },
        {
            path: "/analysis/calendar",
            icon: "📅",
            title: "Calendar Analysis",
            description: "Jan-Dec income analysis"
        },
        {
            path: "/analysis/fiscal",
            icon: "📈",
            title: "Fiscal Analysis",
            description: "July-June fiscal cycle"
        },
        {
            path: "/expenditure-analysis",
            icon: "🥧",
            title: "Expenditure Analysis",
            description: "Spending visualizations"
        },
        {
            path: "/social-insurance",
            icon: "🛡️",
            title: "Social Insurance",
            description: "Insurance tracking"
        },
        {
            path: "/taxes",
            icon: "🧾",
            title: "Taxes",
            description: "Tax management"
        },
        {
            path: "/trades",
            icon: "📊",
            title: "Stock Trading",
            description: "Trade logging"
        },
        {
            path: "/trade-summary",
            icon: "📖",
            title: "Trade Summary",
            description: "Trading results"
        },
        {
            path: "/mutual-funds",
            icon: "🏢",
            title: "Mutual Funds",
            description: "Fund investments"
        },
        {
            path: "/mutual-funds/summary",
            icon: "📚",
            title: "Fund Summary",
            description: "Investment results"
        }
    ];

    return (
        <div
            className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="sidebar-header">
                <div className="logo">
                    <span className="menu-icon">☰</span>
                    {isExpanded ? <span className="logo-text">FinanceHub</span> : null}
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => {
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className="sidebar-item"
                            title={!isExpanded ? item.title : ''}
                        >
                            <div className="sidebar-icon">
                                <span className="icon-emoji">{item.icon}</span>
                            </div>
                            {isExpanded ? 
                            <div className="sidebar-content">
                                <span className="sidebar-title">{item.title}</span>
                                <span className="sidebar-description">{item.description}</span>
                                </div>
                                : null}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;