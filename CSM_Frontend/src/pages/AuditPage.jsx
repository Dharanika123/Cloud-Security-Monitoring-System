import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, Eye, RefreshCw, X, Lock, Filter } from 'lucide-react';

export const AuditPage = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Activities' },
    { id: 'Authentication', label: 'Authentication' },
    { id: 'User & Access Management', label: 'User & Access' },
    { id: 'Asset Management', label: 'Asset Management' },
    { id: 'Incident', label: 'Incidents' },
    { id: 'Vulnerability Management', label: 'Vulnerabilities' },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/audit/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  const filteredLogs = selectedCategory === 'ALL'
    ? logs
    : logs.filter((log) => log.resource === selectedCategory);

  if (loading) return <CustomLoader message="Loading Security Audit Log Trail..." />;

  // Restrict access if not ADMIN
  if (user?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Lock size={48} color="#f5222d" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#fff' }}>Access Restricted</h2>
        <p style={{ color: '#8c9ba5' }}>Only System Administrators have authorization to inspect Audit Trail records.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="var(--CSMS-blue)" />
          <h2 style={{ color: '#fff', margin: 0 }}>System Activity Audit Trail</h2>
        </div>
        <button className="btn-primary" onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={15} /> Refresh Logs
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-title">Total Audit Log Entries</div>
          <div className="stat-value">{logs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Log Retention Policy</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-green)' }}>7 Years</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Integrity Status</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-blue)' }}>Immutable</div>
        </div>
      </div>

      {/* STYLED CATEGORY TAB BUTTONS */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '12px', 
          overflowX: 'auto', 
          marginBottom: '24px', 
          paddingTop: '10px',
          paddingBottom: '10px',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8c9ba5', fontSize: '0.85rem', fontWeight: 600, paddingRight: '8px' }}>
          <Filter size={16} /> Filter:
        </div>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '10px 18px',
                fontSize: '0.92rem',
                fontWeight: 600,
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '0.02em',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.35) 0%, rgba(24, 144, 255, 0.15) 100%)' 
                  : 'rgba(27, 30, 36, 0.75)',
                border: isActive 
                  ? '1px solid #1890ff' 
                  : '1px solid rgba(255, 255, 255, 0.12)',
                color: isActive ? '#ffffff' : '#a0aec0',
                boxShadow: isActive 
                  ? '0 0 12px rgba(24, 201, 255, 0.76), inset 0 0 8px rgba(24, 144, 255, 0.2)' 
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#a0aec0';
                  e.currentTarget.style.background = 'rgba(27, 30, 36, 0.75)';
                }
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="table-panel">
        <h4 style={{ padding: '16px', color: 'var(--CSMS-text-muted)', margin: 0 }}>
          {selectedCategory === 'ALL' ? 'All Activity Logs' : `${selectedCategory} Events`}
        </h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Action Performed</th>
              <th>Affected Target Name</th>
              <th>Module / Category</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <tr key={log.id || idx}>
                  <td style={{ fontFamily: 'monospace', color: '#1890ff' }}>{log.userEmail}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{log.action}</td>
                  <td style={{ fontWeight: 600, color: 'var(--CSMS-orange)' }}>{log.affectedEntityName || 'N/A'}</td>
                  <td>{log.resource}</td>
                  <td style={{ fontFamily: 'monospace', color: '#8c9ba5' }}>{log.ipAddress}</td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: '#8c9ba5' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                  </td>
                  <td>
                    <button
                      className="btn-glass btn-blue"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleViewLog(log)}
                      title="View Log Details"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#8c9ba5', padding: '20px' }}>
                  No audit logs found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW SINGLE LOG MODAL */}
      {isViewModalOpen && selectedLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="form-panel" style={{ width: '520px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Audit Event Details</h3>
              <X size={20} color="#a0aec0" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>AUDIT RECORD ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{selectedLog.id}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>USER EMAIL</span>
                  <span style={{ fontFamily: 'monospace', color: '#1890ff', fontWeight: 600 }}>{selectedLog.userEmail}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>IP ADDRESS</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress}</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>ACTION PERFORMED</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{selectedLog.action}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>AFFECTED TARGET NAME</span>
                <span style={{ fontWeight: 600, color: 'var(--CSMS-orange)' }}>{selectedLog.affectedEntityName || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>TARGET UUID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#a0aec0' }}>{selectedLog.affectedEntityId || 'N/A'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>MODULE SCOPE</span>
                  <span>{selectedLog.resource}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>STATUS</span>
                  <StatusBadge status={selectedLog.status} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>TIMESTAMP</span>
                <span>{selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <button
              className="btn-glass btn-blue"
              style={{flex:1, background: "transparent", marginTop: '24px', width: '100%' }}
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};