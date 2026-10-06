import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CustomLoader } from '../components/CustomLoader';
import { StatusBadge } from '../components/StatusBadge';
import { 
  getAllAdminRequests, 
  getMyRequests, 
  submitAdminRequest, 
  processAdminRequest 
} from '../services/api';
import { 
  ClipboardList, 
  History, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  X, 
  AlertCircle, 
  Send,
  MessageSquare,
  Key,
  Server,
  Activity
} from 'lucide-react';

export default function RequestsPage() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
  const isDevOps = user?.role === 'DEVOPS_ENGINEER' || user?.role === 'ROLE_DEVOPS_ENGINEER';

  // Data States
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Form & Tab States
  const [activeTab, setActiveTab] = useState(isDevOps ? 'GENERIC_ACTION' : 'CREATE_ASSET');
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [assetForm, setAssetForm] = useState({ name: '', ip: '', type: 'SERVER', status: 'HEALTHY' });

  // Validation Error State
  const [formErrors, setFormErrors] = useState({});

  // Action/Feedback States
  const [adminComments, setAdminComments] = useState({});
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchRequests = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = isAdmin ? await getAllAdminRequests() : await getMyRequests();
      setPendingRequests(data.filter(r => r.status === 'PENDING'));
      setHistoryRequests(data.filter(r => r.status !== 'PENDING'));
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching requests:', err);
      if (err.response?.status === 403 && isAdmin) {
        try {
          const myData = await getMyRequests();
          setPendingRequests(myData.filter(r => r.status === 'PENDING'));
          setHistoryRequests(myData.filter(r => r.status !== 'PENDING'));
        } catch (fallbackErr) {
          showBanner('Failed to synchronize requests stream.', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => fetchRequests(true), 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const showBanner = (msg, type = 'success') => {
    setBannerMessage({ text: msg, type });
    setTimeout(() => setBannerMessage({ text: '', type: '' }), 5000);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormErrors({});
  };

  // --- VALIDATION FUNCTIONS ---
  const validateAssetForm = () => {
    const errors = {};
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!assetForm.name.trim()) {
      errors.name = 'Asset name is required.';
    } else if (assetForm.name.trim().length < 3) {
      errors.name = 'Asset name must be at least 3 characters long.';
    }

    if (!assetForm.ip.trim()) {
      errors.ip = 'IP address is required.';
    } else if (!ipRegex.test(assetForm.ip.trim())) {
      errors.ip = 'Please enter a valid IPv4 address (e.g., 192.168.1.50).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateGenericForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Action title is required.';
    } else if (title.trim().length < 4) {
      errors.title = 'Title must be at least 4 characters long.';
    }

    if (!messageText.trim()) {
      errors.messageText = 'Details description is required.';
    } else if (messageText.trim().length < 10) {
      errors.messageText = 'Description must be at least 10 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    const hasLetter = /[a-zA-Z]/;
    const hasNumber = /[0-9]/;

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long.';
    } else if (!hasLetter.test(newPassword) || !hasNumber.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one letter and one number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateMessageForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Subject is required.';
    if (!messageText.trim()) {
      errors.messageText = 'Message content cannot be empty.';
    } else if (messageText.trim().length < 5) {
      errors.messageText = 'Message is too short (at least 5 characters).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Renders JSON payloads in a clean UI grid, or plain text for regular messages
  const renderDetailsContent = (rawDetails) => {
    if (!rawDetails) return <span style={{ color: 'var(--CSMS-text-muted)' }}>No details provided</span>;

    try {
      const parsed = JSON.parse(rawDetails);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#0d131d', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--CSMS-border)' }}>
            {Object.entries(parsed).map(([key, val]) => (
              <div key={key}>
                <span style={{ fontSize: '0.68rem', color: 'var(--CSMS-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                  {key.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', fontFamily: key === 'ip' ? 'monospace' : 'inherit' }}>
                  {typeof val === 'string' ? val : JSON.stringify(val)}
                </span>
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Fallback for plain text messages
    }

    return (
      <div style={{ background: '#0d131d', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--CSMS-border)', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {rawDetails}
      </div>
    );
  };

  // --- SUBMIT HANDLERS ---
  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!validateAssetForm()) return;

    try {
      const detailsJson = JSON.stringify({ ...assetForm, name: assetForm.name.trim(), ip: assetForm.ip.trim() }, null, 2);
      await submitAdminRequest('CREATE_ASSET', `Asset Creation: ${assetForm.name.trim()}`, detailsJson);
      showBanner('Asset creation request submitted successfully to Admin!');
      setAssetForm({ name: '', ip: '', type: 'SERVER', status: 'HEALTHY' });
      setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to submit asset creation request.', 'error');
    }
  };

  const handleGenericSubmit = async (e) => {
    e.preventDefault();
    if (!validateGenericForm()) return;

    try {
      await submitAdminRequest('GENERIC_ACTION', title.trim(), messageText.trim());
      showBanner('Action request submitted successfully!');
      setTitle(''); setMessageText(''); setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to submit custom action request.', 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      await submitAdminRequest('PASSWORD_CHANGE', 'Password Reset Request', newPassword);
      showBanner('Password change request sent to Admin!');
      setNewPassword(''); setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to submit password change request.', 'error');
    }
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!validateMessageForm()) return;

    try {
      await submitAdminRequest('MESSAGE', title.trim() || 'User Message', messageText.trim());
      showBanner('Message sent to Administrator successfully!');
      setTitle(''); setMessageText(''); setFormErrors({});
      fetchRequests(true);
    } catch (err) {
      showBanner('Failed to send message to Admin.', 'error');
    }
  };

  const handleProcess = async (id, approve) => {
    try {
      await processAdminRequest(id, approve, adminComments[id] || '');
      showBanner(approve ? 'Request approved & action executed successfully!' : 'Request rejected.', approve ? 'success' : 'error');
      fetchRequests(true);
    } catch (err) {
      showBanner('Error processing request: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleViewRequest = (req) => {
    setSelectedRequest(req);
    setIsViewModalOpen(true);
  };

  if (loading) return <CustomLoader message="Connecting to Request & Approval Stream..." />;

  return (
    <div className="page-container">
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--CSMS-purple)" />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              {isAdmin ? 'Admin Approval Queue' : 'Requests & Messages'}
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--CSMS-text-muted)', marginTop: '3px', display: 'block' }}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <button 
          className="btn-glass btn-purple"
          onClick={() => setShowHistory(!showHistory)}
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <History size={14} /> {showHistory ? 'Hide Request History' : 'View Request History'}
        </button>
      </div>

      {/* FEEDBACK BANNER */}
      {bannerMessage.text && (
        <div
          className="form-panel"
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderLeft: `3px solid ${bannerMessage.type === 'error' ? '#f5222d' : '#10b981'}`,
            backgroundColor: bannerMessage.type === 'error' ? 'rgba(245, 34, 45, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          }}
        >
          {bannerMessage.type === 'error' ? <AlertCircle size={16} color="#f5222d" /> : <CheckCircle2 size={16} color="#10b981" />}
          <span style={{ color: '#fff', fontSize: '0.85rem' }}>{bannerMessage.text}</span>
        </div>
      )}

      {/* SUBMISSION FORM CONTAINER */}
      {!isAdmin && (
        <div className="form-panel" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--CSMS-border)', paddingBottom: '10px', marginBottom: '16px' }}>
            {!isDevOps && (
              <button type="button" className={activeTab === 'CREATE_ASSET' ? 'btn-primary' : 'btn-glass btn-white'} onClick={() => handleTabChange('CREATE_ASSET')} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                <Server size={14} /> Request Asset Creation
              </button>
            )}
            <button type="button" className={activeTab === 'GENERIC_ACTION' ? 'btn-primary' : 'btn-glass btn-white'} onClick={() => handleTabChange('GENERIC_ACTION')} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <Activity size={14} /> Request Custom Action
            </button>
            <button type="button" className={activeTab === 'PASSWORD_CHANGE' ? 'btn-primary' : 'btn-glass btn-white'} onClick={() => handleTabChange('PASSWORD_CHANGE')} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <Key size={14} /> Password Reset
            </button>
            <button type="button" className={activeTab === 'MESSAGE' ? 'btn-primary' : 'btn-glass btn-white'} onClick={() => handleTabChange('MESSAGE')} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              <MessageSquare size={14} /> Message Admin
            </button>
          </div>

          {activeTab === 'CREATE_ASSET' && !isDevOps && (
            <form onSubmit={handleAssetSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-field">
                  <label>ASSET NAME</label>
                  <input type="text" placeholder="AWS-K8s-Worker-Node" className="form-input" value={assetForm.name} onChange={(e) => { setAssetForm({...assetForm, name: e.target.value}); if (formErrors.name) setFormErrors({...formErrors, name: null}); }} />
                  {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
                </div>
                <div className="form-field">
                  <label>IP ADDRESS</label>
                  <input type="text" placeholder="192.168.1.50" className="form-input" value={assetForm.ip} onChange={(e) => { setAssetForm({...assetForm, ip: e.target.value}); if (formErrors.ip) setFormErrors({...formErrors, ip: null}); }} />
                  {formErrors.ip && <span className="field-error-msg">{formErrors.ip}</span>}
                </div>
                <div className="form-field">
                  <label>ASSET TYPE</label>
                  <select className="form-input" value={assetForm.type} onChange={(e) => setAssetForm({...assetForm, type: e.target.value})}>
                    <option value="SERVER">SERVER</option>
                    <option value="CLOUD_AWS">CLOUD_AWS</option>
                    <option value="CLOUD_AZURE">CLOUD_AZURE</option>
                    <option value="K8S_POD">K8S_POD</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>HEALTH STATUS</label>
                  <select className="form-input" value={assetForm.status} onChange={(e) => setAssetForm({...assetForm, status: e.target.value})}>
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '14px', padding: '8px 16px', fontSize: '0.85rem' }}>
                <Send size={14} /> Submit Asset Creation Request
              </button>
            </form>
          )}

          {activeTab === 'GENERIC_ACTION' && (
            <form onSubmit={handleGenericSubmit} noValidate>
              <div className="form-field" style={{ marginBottom: '10px' }}>
                <input type="text" placeholder="Action Title (e.g., Provision VPN Tunnel)" className="form-input" value={title} onChange={(e) => { setTitle(e.target.value); if (formErrors.title) setFormErrors({...formErrors, title: null}); }} />
                {formErrors.title && <span className="field-error-msg">{formErrors.title}</span>}
              </div>
              <div className="form-field">
                <textarea placeholder="Describe details..." rows="3" className="form-input" value={messageText} onChange={(e) => { setMessageText(e.target.value); if (formErrors.messageText) setFormErrors({...formErrors, messageText: null}); }} />
                {formErrors.messageText && <span className="field-error-msg">{formErrors.messageText}</span>}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.85rem' }}>
                <Send size={14} /> Submit Action Request
              </button>
            </form>
          )}

          {activeTab === 'PASSWORD_CHANGE' && (
            <form onSubmit={handlePasswordSubmit} noValidate>
              <div className="form-field">
                <input type="password" placeholder="Requested New Password" className="form-input" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); if (formErrors.newPassword) setFormErrors({...formErrors, newPassword: null}); }} />
                {formErrors.newPassword && <span className="field-error-msg">{formErrors.newPassword}</span>}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.85rem' }}>
                <Key size={14} /> Send Password Reset Request
              </button>
            </form>
          )}

          {activeTab === 'MESSAGE' && (
            <form onSubmit={handleMessageSubmit} noValidate>
              <div className="form-field" style={{ marginBottom: '10px' }}>
                <input type="text" placeholder="Subject" className="form-input" value={title} onChange={(e) => { setTitle(e.target.value); if (formErrors.title) setFormErrors({...formErrors, title: null}); }} />
                {formErrors.title && <span className="field-error-msg">{formErrors.title}</span>}
              </div>
              <div className="form-field">
                <textarea placeholder="Your message..." rows="3" className="form-input" value={messageText} onChange={(e) => { setMessageText(e.target.value); if (formErrors.messageText) setFormErrors({...formErrors, messageText: null}); }} />
                {formErrors.messageText && <span className="field-error-msg">{formErrors.messageText}</span>}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.85rem' }}>
                <MessageSquare size={14} /> Send Direct Message
              </button>
            </form>
          )}
        </div>
      )}

      {/* PENDING REQUESTS PANEL */}
      <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
        {isAdmin ? 'Pending Approval Queue' : 'My Active Requests'}
      </h4>

      {pendingRequests.length === 0 ? (
        <div className="form-panel" style={{ textAlign: 'center', color: 'var(--CSMS-text-muted)', padding: '24px', fontSize: '0.88rem' }}>
          No pending requests in queue at this time.
        </div>
      ) : (
        pendingRequests.map((req) => (
          <div key={req.id} className="form-panel" style={{ marginBottom: '12px', padding: '14px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  {req.title || req.requestType}
                </span>
                <StatusBadge status={req.requestType} />
                <StatusBadge status={req.status} />
              </div>
              <button className="btn-glass btn-blue" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleViewRequest(req)}>
                <Eye size={13} /> View Details
              </button>
            </div>

            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)' }}>Requester</div>
                <div style={{ color: 'var(--CSMS-text-bright)', marginTop: '2px' }}>{req.requester?.email || req.requester?.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)' }}>Submitted At</div>
                <div style={{ color: 'var(--CSMS-text-bright)', marginTop: '2px' }}>{req.createdAt ? new Date(req.createdAt).toLocaleString() : '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)' }}>Request ID</div>
                <div style={{ fontFamily: 'monospace', color: 'var(--CSMS-text-bright)', marginTop: '2px' }}>#{req.id}</div>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--CSMS-text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                DETAILS & REQUIREMENTS
              </div>
              {renderDetailsContent(req.details)}
            </div>

            {isAdmin && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--CSMS-border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text" placeholder="Optional admin comment..." className="form-input" style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }}
                  onChange={(e) => setAdminComments({ ...adminComments, [req.id]: e.target.value })}
                />
                <button className="btn-glass btn-green" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => handleProcess(req.id, true)}>
                  <CheckCircle2 size={13} /> Approve
                </button>
                <button className="btn-glass btn-red" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => handleProcess(req.id, false)}>
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* REQUEST HISTORY TABLE */}
      {showHistory && (
        <div className="table-panel" style={{ marginTop: '20px' }}>
          <h4 style={{ padding: '14px 18px', color: 'var(--CSMS-text-bright)', fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>
            Processed Request History
          </h4>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Admin Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyRequests.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 700 }}>#{h.id}</td>
                  <td><StatusBadge status={h.requestType} /></td>
                  <td>{h.title}</td>
                  <td>{h.requester?.email || h.requester?.username}</td>
                  <td><StatusBadge status={h.status} /></td>
                  <td style={{ color: 'var(--CSMS-text-muted)' }}>{h.adminComment || '-'}</td>
                  <td>
                    <button className="btn-glass btn-blue" style={{ padding: '4px 8px', fontSize: '0.78rem' }} onClick={() => handleViewRequest(h)}>
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW SINGLE REQUEST DETAILS MODAL */}
      {isViewModalOpen && selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div className="form-panel" style={{ width: '480px', marginBottom: 0, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Request Details</h3>
              <X size={18} color="#a0aec0" style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 600 }}>TITLE / SUBJECT</span>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{selectedRequest.title || 'N/A'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 600, marginBottom: '2px' }}>REQUEST TYPE</span>
                  <StatusBadge status={selectedRequest.requestType} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 600, marginBottom: '2px' }}>STATUS</span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 600 }}>REQUESTER</span>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{selectedRequest.requester?.email || selectedRequest.requester?.username}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 600, marginBottom: '4px' }}>DETAILS & PARAMETERS</span>
                {renderDetailsContent(selectedRequest.details)}
              </div>
              {selectedRequest.adminComment && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--CSMS-text-muted)', display: 'block', fontWeight: 600 }}>ADMIN COMMENT</span>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{selectedRequest.adminComment}</span>
                </div>
              )}
            </div>

            <button
              className="btn-glass btn-blue"
              style={{ marginTop: '20px', width: '100%', padding: '8px', fontSize: '0.85rem' }}
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}