import React, { useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Assuming you have a CSS file for styling

const Sidebar = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isCurrentlyExpanded = isMobile ? mobileOpen : isExpanded;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
        }, []);

    const handleMouseEnter = () => {
        if (!isMobile) {
            setIsExpanded(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile) {
            setIsExpanded(false);
        }
    };

    const handleSidebarToggle = () =>{
        if (isMobile){
            setMobileOpen(!mobileOpen);
        }
    }


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
        },
        {
            path: "/gold-wallet",
            icon: "🏅",
            title: "Gold Logs",
            description: "Track gold investments"
        },
        {
            path: "/gold-wallet/summary",
            icon: "📘",
            title: "Gold Summary",
            description: "Gold investment results"
        },
        {
            path: "/certificates",
            icon: "🏛️",
            title: "Bank Certificates",
            description: "Fixed investment"
        },
        {
            path: "/currency",
            icon: "💱",
            title: "Foreign Currency",
            description: "Currency Wallet",
        },
        {
            path: "/credit-cards",
            icon: "💳",
            title: "Credit Cards",
            description: "Manage credit cards"
        }
    ];

    return (
        <>
        <style>
            {`
                .logo-text {
                    font-size: 18px;
                    font-weight: 700;
                    color: #6c7ce7;
                    white-space: nowrap;
                    opacity: ${isExpanded || mobileOpen ? '1' : '0'};
                    transition: opacity 0.3s ease;
                }
                .sidebar-content {
                    display: flex;
                    flex-direction: column;
                    opacity: ${isExpanded || mobileOpen ? '1' : '0'};
                    transition: opacity 0.3s ease;
                    min-width: 0;
                }
            `}
        </style>
        <button 
            className="mobile-toggle"
            onClick={() => handleSidebarToggle()}
        >
            ☰
        </button>
            <div
                className={`sidebar ${isCurrentlyExpanded ? 'expanded' : 'collapsed'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
               
                <div className="sidebar-header">
                    <div className="logo">
                        {!((isMobile && mobileOpen) || (!isMobile && isExpanded)) && <span className="menu-icon">☰</span>}
                        {((isMobile && mobileOpen) || (!isMobile && isExpanded)) && <span className="logo-text">FinanceHub</span>}
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className="sidebar-item"
                            title={!((isMobile && mobileOpen) || (!isMobile && isExpanded)) ? item.title : ''}
                            onClick={() => console.log(`Navigate to ${item.path}`)}
                        >
                            <div className="sidebar-icon">
                                <span className="icon-emoji">{item.icon}</span>
                            </div>
                            {((isMobile && mobileOpen) || (!isMobile && isExpanded)) && (
                                <div className="sidebar-content">
                                    <span className="sidebar-title">{item.title}</span>
                                    <span className="sidebar-description">{item.description}</span>
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            {mobileOpen && (
                <div 
                    className="sidebar-backdrop" 
                    onClick={() => setMobileOpen(false)} 
                />
            )}
        </>
    );
};

export default Sidebar;