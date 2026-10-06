import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Eye, CheckCircle2, Lock, RefreshCw, X } from 'lucide-react';

export const CompliancePage = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/compliance/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Compliance summary fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCheck = (check) => {
    setSelectedCheck(check);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Evaluating Compliance Frameworks..." />;

  if (user?.role !== 'ADMIN') {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Lock size={48} color="#f5222d" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#fff' }}>Access Restricted</h2>
        <p style={{ color: '#8c9ba5' }}>Only System Administrators have authorization to access Compliance Frameworks.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} color="var(--CSMS-green)" />
          <h2 style={{ color: '#fff', margin: 0 }}>Compliance & DevSecOps Governance</h2>
        </div>
        <button className="btn-primary" onClick={fetchCompliance} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Re-Evaluate
        </button>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-title">Compliance Score</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-green)' }}>
            {summary?.complianceRate || '100%'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Violations</div>
          <div className="stat-value" style={{ color: summary?.activeViolations > 0 ? '#f5222d' : '#fff' }}>
            {summary?.activeViolations || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">DevSecOps Pipeline</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-blue)' , fontSize: '1.5rem' }}>
            {summary?.owaspStatus || 'PASSED'}
          </div>
        </div>
      </div>

      {/* FRAMEWORKS TABLE */}
      <div className="table-panel">
        <h4 style={{ padding: '16px', color: 'var(--CSMS-text-muted)', margin: 0 }}>Compliance Framework Audits</h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Framework</th>
              <th>Status</th>
              <th>Score</th>
              <th>Controls Passed</th>
              <th>Total Controls</th>
              <th>Last Scanned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {summary?.checks?.map((check) => (
              <tr key={check.id}>
                <td style={{ fontWeight: 600, color: '#fff' }}>{check.framework}</td>
                <td><StatusBadge status={check.status} /></td>
                <td style={{ fontWeight: 700, color: 'var(--CSMS-green)' }}>{check.scorePercentage}%</td>
                <td>{check.passedControls}</td>
                <td>{check.totalControls}</td>
                <td style={{ fontSize: '0.8rem', color: '#8c9ba5' }}>
                  {check.lastScanned ? new Date(check.lastScanned).toLocaleString() : 'N/A'}
                </td>
                <td>
                  <button
                    className="btn-glass btn-blue"
                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleViewCheck(check)}
                    title="View Framework Details"
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW FRAMEWORK DETAILS MODAL */}
      {isViewModalOpen && selectedCheck && (
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
              <h3 style={{ margin: 0, color: '#fff' }}>Framework Audit Overview</h3>
              <X size={20} color="#a0aec0" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>FRAMEWORK</span>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>{selectedCheck.framework}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block', marginBottom: '4px' }}>STATUS</span>
                <StatusBadge status={selectedCheck.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>COMPLIANCE SCORE</span>
                  <span style={{ fontWeight: 700, color: 'var(--CSMS-green)' }}>{selectedCheck.scorePercentage}%</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>PASSED CONTROLS</span>
                  <span>{selectedCheck.passedControls} / {selectedCheck.totalControls}</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>LAST SCAN TIMESTAMP</span>
                <span>{selectedCheck.lastScanned ? new Date(selectedCheck.lastScanned).toLocaleString() : 'N/A'}</span>
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