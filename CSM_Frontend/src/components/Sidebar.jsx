import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { formatDisplayName } from "../utils/userUtils";
import {
  LayoutDashboard, Server, ShieldAlert, Bug, Activity,
  Bell, Users, ClipboardList, ShieldCheck, FileText, Download,
  Search, Shield, X, ChevronLeft, ChevronRight,PanelLeft
} from 'lucide-react';

export const Sidebar = ({ isOpen = true, onToggle }) => {
  const { user, getInitials } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');

  const mainNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/assets", label: "Asset Inventory", icon: Server },
    { to: "/alerts", label: "Active Alerts", icon: Bell },
    { to: "/incidents", label: "Incidents", icon: ShieldAlert },
    { to: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
    { to: "/metrics", label: "System Metrics", icon: Activity },
    { to: "/requests", label: "Requests & Messages", icon: ClipboardList },
    { to: "/reports", label: "Security Reports", icon: Download },
  ];

  const adminNavItems = [
    ...(user?.role === 'ADMIN' ? [
      { to: "/audit", label: "Audit Trail", icon: ShieldCheck },
      { to: "/compliance", label: "Compliance", icon: FileText },
      { to: "/users", label: "Manage Users", icon: Users },
    ] : [])
  ];

  const filterItems = (items) =>
    items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredMain = filterItems(mainNavItems);
  const filteredAdmin = filterItems(adminNavItems);

  return (
    <aside className="sidebar-container" style={{
      width: isOpen ? '260px' : '70px',
      height: '100vh',
      backgroundColor: '#0a0c10',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      color: '#F5F7FA',
      userSelect: 'none',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 105
    }}>
      {/* BRAND HEADER / TOGGLE HEADER */}
<div style={{ 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: isOpen ? 'space-between' : 'center', 
  padding: isOpen ? '16px 14px 12px 14px' : '16px 8px 12px 8px'
}}>
  {isOpen ? (
    // OPEN STATE: Logo + Name on Left, Panel Toggle on Right
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={22} color="#10B981" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', color: '#FFF', whiteSpace: 'nowrap' }}>
          CSMS
        </span>
      </div>
      <button
        onClick={onToggle}
        title="Collapse Sidebar"
        style={{
          background: '#171B22',
          border: '1px solid #242933',
          borderRadius: '6px',
          color: '#8B93A3',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5px',
          outline: 'none'
        }}
      >
        <PanelLeft size={16} />
      </button>
    </>
  ) : (
    // CLOSED STATE: Shield Logo + Chevron Arrow side-by-side inside a single clickable trigger
    <button
      onClick={onToggle}
      title="Expand Sidebar"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px',
        outline: 'none'
      }}
    >
      <Shield size={22} color="#10B981" style={{ flexShrink: 0 }} />
      
    </button>
  )}
</div>

      {/* EMBEDDED SEARCH BAR */}
      {isOpen && (
        <div style={{ padding: '0 14px 10px 14px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="#8B93A3" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input 
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#171B22',
                border: '1px solid #242933',
                borderRadius: '8px',
                color: '#FFF',
                padding: '8px 30px 8px 34px',
                fontSize: '0.82rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10B981'}
              onBlur={(e) => e.target.style.borderColor = '#242933'}
            />
            {searchTerm && (
              <X size={14} color="#8B93A3" onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', cursor: 'pointer' }} />
            )}
          </div>
        </div>
      )}

      {/* NAVIGATION LIST */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px 10px' }}>
        {isOpen && (
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#5B6472', textTransform: 'uppercase', padding: '12px 10px 4px 10px', letterSpacing: '0.05em' }}>
            Platform Navigation
          </div>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
          {filteredMain.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.to} style={{ marginBottom: '2px' }}>
                <NavLink 
                  to={item.to} 
                  title={!isOpen ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: isActive ? '#FFF' : '#8B93A3',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500
                  })}
                >
                  <IconComponent size={18} style={{ flexShrink: 0 }} /> 
                  {isOpen && <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {filteredAdmin.length > 0 && (
          <>
            {isOpen && (
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#5B6472', textTransform: 'uppercase', padding: '8px 10px 4px 10px', letterSpacing: '0.05em' }}>
                Administration
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredAdmin.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.to} style={{ marginBottom: '2px' }}>
                    <NavLink 
                      to={item.to} 
                      title={!isOpen ? item.label : undefined}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isOpen ? 'flex-start' : 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        color: isActive ? '#FFF' : '#8B93A3',
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 500
                      })}
                    >
                      <IconComponent size={18} style={{ flexShrink: 0 }} /> 
                      {isOpen && <span style={{ lineHeight: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* USER FOOTER */}
      {user && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid #1C212B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'flex-start' : 'center',
          gap: '10px',
          backgroundColor: '#0A0C10'
        }}>
          <div className="user-profile-btn" style={{ flexShrink: 0 }}>
            {getInitials(user.username)}
          </div>
          {isOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {formatDisplayName(user.username)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#8B93A3' }}>
                {user.role}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};