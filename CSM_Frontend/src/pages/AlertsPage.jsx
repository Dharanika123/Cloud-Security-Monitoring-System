import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { Bell, ShieldAlert, Eye, X } from 'lucide-react';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States for Viewing Single Alert
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchAlerts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await API.get('/api/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(false);
    const interval = setInterval(() => fetchAlerts(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Loading Real-Time SOC Alerts..." />;

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const mediumOrLowCount = alerts.length - criticalCount - highCount;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Bell size={24} color="#fa8c16" />
        <h2 style={{ color: '#fff', margin: 0 }}>Active Infrastructure Alerts</h2>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-title">Total Active Alerts</div>
          <div className="stat-value" style={{ color: '#fa8c16' }}>{alerts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Critical Severity</div>
          <div className="stat-value" style={{ color: '#f5222d' }}>{criticalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">High Priority</div>
          <div className="stat-value" style={{ color: '#fa8c16' }}>{highCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Medium / Low</div>
          <div className="stat-value" style={{ color: '#10B981' }}>{mediumOrLowCount}</div>
        </div>
      </div>

      <div className="table-panel">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Server / Asset Name</th>
              <th>Metric Violation</th>
              <th>Violation Value</th>
              <th>Severity</th>
              <th>Recommended Remediation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((alt, idx) => (
                <tr key={alt.alertId || idx}>
                  <td style={{ fontFamily: 'monospace' }}>{alt.alertId ? alt.alertId.substring(0, 8) + '...' : `ALT-${idx + 100}`}</td>
                  <td style={{ fontWeight: 600 }}>{alt.assetName || alt.serverName || 'DB-SRV-12'}</td>
                  <td>{alt.metricName}</td>
                  <td style={{ color: 'var(--CSMS-orange)', fontWeight: 600 }}>{alt.metricValue}%</td>
                  <td><StatusBadge status={alt.severity} /></td>
                  <td>{alt.solution || 'Auto-scaling policy executed'}</td>
                  <td>
                    <button
                      className="btn-glass btn-blue"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onClick={() => handleViewAlert(alt)}
                      title="View Details"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#8c9ba5', padding: '20px' }}>
                  No active infrastructure alerts recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW SINGLE ALERT MODAL */}
      {isViewModalOpen && selectedAlert && (
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
          <div className="form-panel" style={{ width: '480px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Alert Overview</h3>
              <X size={20} color="#a0aec0" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>ALERT ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedAlert.alertId || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>SERVER / ASSET NAME</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{selectedAlert.assetName || selectedAlert.serverName || 'DB-SRV-12'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>METRIC VIOLATION</span>
                <span>{selectedAlert.metricName} ({selectedAlert.metricValue}%)</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>SEVERITY</span>
                <StatusBadge status={selectedAlert.severity} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block', marginBottom: '4px' }}>RECOMMENDED REMEDIATION</span>
                <span>{selectedAlert.solution || 'Auto-scaling policy executed'}</span>
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