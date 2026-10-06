import React, { useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldAlert, History, Clock, UserCheck, CheckCircle2, Lock, RefreshCw, Eye, X, AlertCircle } from 'lucide-react';

export const IncidentsPage = () => {
  const { user } = useContext(AuthContext);
  const [criticalIncidents, setCriticalIncidents] = useState([]);
  const [historyIncidents, setHistoryIncidents] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [updateError, setUpdateError] = useState("");

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const canManageIncidents = user?.role === 'ADMIN' || user?.role === 'SECURITY_ANALYST';

  const fetchIncidents = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const critRes = await API.get('/api/incidents/critical');
      setCriticalIncidents(critRes.data);

      const allRes = await API.get('/api/incidents');
      setHistoryIncidents(allRes.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching real-time incidents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents(false);
    const interval = setInterval(() => {
      fetchIncidents(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleViewIncident = (inc) => {
    setSelectedIncident(inc);
    setIsViewModalOpen(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdateError("");
    if (!canManageIncidents) return;
    
    try {
      await API.put(`/api/incidents/${id}/status?status=${newStatus}`);
      fetchIncidents(true);
    } catch (err) {
      setUpdateError("Failed to update incident status.");
    }
  };

  if (loading) return <CustomLoader message="Connecting to Real-Time Incident Stream..." />;

  const activeCount = historyIncidents.filter((i) => i.status !== 'RESOLVED').length;
  const resolvedCount = historyIncidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="page-container">
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#f5222d" />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Security Incidents Stream</h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <RefreshCw size={11} className="soc-spinner" style={{ animationDuration: '3s', width: '11px', height: '11px' }} />
            Live sync active • Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <button 
          className="btn-glass btn-purple"
          onClick={() => setShowHistory(!showHistory)}
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <History size={14} /> {showHistory ? 'Hide Incident History' : 'View Incident History'}
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-title">Active Incidents</div>
          <div className="stat-value" style={{ color: activeCount > 0 ? '#f5222d' : '#10B981' }}>{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Critical Severity</div>
          <div className="stat-value" style={{ color: criticalIncidents.length > 0 ? '#f5222d' : '#10B981' }}>{criticalIncidents.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Resolved Incidents</div>
          <div className="stat-value" style={{ color: '#10B981' }}>{resolvedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Registered</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-blue)' }}>{historyIncidents.length}</div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {updateError && (
        <div
          className="form-panel"
          style={{
            marginBottom: "16px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderLeft: "3px solid #f5222d",
            backgroundColor: "rgba(245, 34, 45, 0.1)",
          }}
        >
          <AlertCircle size={16} color="#f5222d" />
          <span style={{ color: "#fff", fontSize: "0.85rem" }}>{updateError}</span>
        </div>
      )}

      {/* ACTIVE CRITICAL INCIDENTS LIST */}
      {criticalIncidents.length === 0 ? (
        <div className="form-panel" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '24px', fontSize: '0.88rem' }}>
          No active unresolved critical incidents at this time.
        </div>
      ) : (
        criticalIncidents.map((inc) => (
          <div key={inc.id} className="form-panel" style={{ marginBottom: '14px', padding: '16px', borderLeft: '3px solid var(--CSMS-red)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  #{inc.incidentTicket || 'INC-2026-6258'}
                </span>
                <StatusBadge status={inc.severity} /> 
                <StatusBadge status={inc.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-glass btn-blue"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => handleViewIncident(inc)}
                >
                  <Eye size={13} /> View
                </button>
                {!canManageIncidents && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Read-only mode
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Incident Type</div>
                <div style={{ fontWeight: 600, color: 'var(--CSMS-text-main)', marginTop: '2px' }}>{inc.type}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Source IP</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--CSMS-text-main)', marginTop: '2px' }}>{inc.sourceIp}</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Impact Summary</div>
              <div style={{ color: 'var(--CSMS-text-main)', marginTop: '2px' }}>{inc.impactSummary}</div>
            </div>

            {/* TEAM SLA CARDS */}
            <div className="dashboard-grid" style={{ marginTop: '12px', marginBottom: '8px', gap: '10px' }}>
              <div className="stat-card" style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={12} /> Assigned Team
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>{inc.assignedTeam || 'Security Ops'}</div>
              </div>
              <div className="stat-card" style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> SLA Target
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>{inc.slaHours} Hours</div>
              </div>
              <div className="stat-card" style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> Resolution ETA
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>{inc.etaMinutes} mins</div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {canManageIncidents && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="btn-glass btn-assign" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => handleStatusChange(inc.id, 'ASSIGNED')}>
                  Assign
                </button>
                <button className="btn-glass btn-investigate" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => handleStatusChange(inc.id, 'INVESTIGATION')}>
                  Investigate
                </button>
                <button className="btn-glass btn-resolve" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => handleStatusChange(inc.id, 'RESOLVED')}>
                  <CheckCircle2 size={13} /> Resolve
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* HISTORY TABLE */}
      {showHistory && (
        <div className="table-panel" style={{ marginTop: '20px' }}>
          <h4 style={{ padding: '14px 18px', color: 'var(--CSMS-text-bright)', fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>
            All Incident History (Including Resolved)
          </h4>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Impact Summary</th>
                <th>Assigned Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyIncidents.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.incidentTicket}</td>
                  <td>{h.type}</td>
                  <td><StatusBadge status={h.severity} /></td>
                  <td><StatusBadge status={h.status} /></td>
                  <td>{h.impactSummary}</td>
                  <td>{h.assignedTeam}</td>
                  <td>
                    <button
                      className="btn-glass btn-blue"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleViewIncident(h)}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="form-panel" style={{ width: '440px', marginBottom: 0, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Incident Details</h3>
              <X size={18} color="#a0aec0" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block' }}>INCIDENT TICKET</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>#{selectedIncident.incidentTicket || 'N/A'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block' }}>TYPE</span>
                  <span style={{ fontWeight: 600 }}>{selectedIncident.type}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block' }}>SOURCE IP</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedIncident.sourceIp}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block' }}>SEVERITY</span>
                  <StatusBadge status={selectedIncident.severity} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block' }}>STATUS</span>
                  <StatusBadge status={selectedIncident.status} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block' }}>IMPACT SUMMARY</span>
                <span>{selectedIncident.impactSummary}</span>
              </div>
            </div>
            <button className="btn-glass btn-blue" style={{ marginTop: '18px', width: '100%', padding: '8px', fontSize: '0.85rem' }} onClick={() => setIsViewModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};