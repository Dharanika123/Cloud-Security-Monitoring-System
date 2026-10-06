import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Download, Plus, Eye, RefreshCw, X } from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('SECURITY_REPORT');
  const [actionMessage, setActionError] = useState('');

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await API.post(`/api/reports/generate?type=${reportType}`);
      setReports([res.data, ...reports]);
    } catch (err) {
      setActionError('Failed to generate report.');
    }
  };

  const handleDownloadPdf = async (reportId, title) => {
    try {
      const response = await API.get(`/api/reports/download/${reportId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${reportId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      setActionError('Failed to download PDF report.');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Loading Security Operations Reports..." />;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} color="var(--CSMS-blue)" />
          <h2 style={{ color: '#fff', margin: 0 }}>Security Reports & PDF Export</h2>
        </div>
        <button className="btn-glass btn-purple" onClick={fetchReports} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={15} /> Refresh Catalog
        </button>
      </div>

      {actionMessage && (
        <div className="form-panel" style={{ marginBottom: '20px', padding: '12px', borderLeft: '4px solid #f5222d' }}>
          <span style={{ color: '#fff' }}>{actionMessage}</span>
        </div>
      )}

      {/* GENERATE REPORT FORM */}
      <div className="form-panel" style={{ marginBottom: '24px' }}>
        <h4 style={{ color: 'var(--CSMS-text-muted)', marginBottom: '15px' }}>Generate Security Report</h4>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label>Report Type</label>
            <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {/* Type 1: Visible to everyone */}
              <option value="SECURITY_REPORT">Security Operations Executive Report</option>
              
              {/* Type 2 & 3: Visible to ADMIN only */}
              {isAdmin && (
                <>
                  <option value="AUDIT_REPORT">System Audit Trail & Event Logs Report</option>
                  <option value="COMPLIANCE_REPORT">Regulatory Compliance Report (PCI DSS / SOC 2)</option>
                </>
              )}

              {/* Type 4: Visible to everyone */}
              <option value="RISK_REPORT">Vulnerability & Patch Risk Assessment</option>
            </select>
          </div>
          <button type="submit" className="btn-glass btn-green" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}>
            <Plus size={16} /> Generate Report
          </button>
        </form>
      </div>

      {/* REPORTS CATALOG TABLE */}
      <div className="table-panel">
        <h4 style={{ padding: '16px', color: 'var(--CSMS-text-muted)', margin: 0 }}>
          Generated Reports Catalog ({reports.length})
        </h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Type</th>
              <th>Generated By</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((rep) => (
              <tr key={rep.id}>
                <td style={{ fontWeight: 600, color: '#fff' }}>{rep.title}</td>
                <td style={{ fontSize: '0.85rem' }}>{rep.reportType}</td>
                <td style={{ fontFamily: 'monospace', color: '#1890ff' }}>{rep.generatedBy}</td>
                <td><StatusBadge status={rep.status === 'READY' ? 'READY' : 'PENDING'} /></td>
                <td style={{ fontSize: '0.8rem', color: '#8c9ba5' }}>
                  {rep.createdDate ? new Date(rep.createdDate).toLocaleString() : 'Just now'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-glass btn-blue"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleViewReport(rep)}
                      title="View Summary"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      className="btn-glass btn-green"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleDownloadPdf(rep.id, rep.title)}
                      title="Download Official PDF"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW REPORT MODAL */}
      {isViewModalOpen && selectedReport && (
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
              <h3 style={{ margin: 0, color: '#fff' }}>Report Details</h3>
              <X size={20} color="#a0aec0" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.95rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>REPORT TITLE</span>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem' }}>{selectedReport.title}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>REPORT TYPE</span>
                  <span>{selectedReport.reportType}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>GENERATED BY</span>
                  <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{selectedReport.generatedBy}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block', marginBottom: '4px' }}>STATUS</span>
                  <StatusBadge status={selectedReport.status === 'READY' ? 'READY' : 'PENDING'} />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#8c9ba5', display: 'block' }}>DATE GENERATED</span>
                  <span>{selectedReport.createdDate ? new Date(selectedReport.createdDate).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn-glass btn-green"
                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                onClick={() => handleDownloadPdf(selectedReport.id, selectedReport.title)}
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                className="btn-glass btn-blue"
                style={{ flex: 1, background: 'transparent' }}
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};