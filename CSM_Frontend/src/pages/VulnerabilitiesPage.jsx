import React, { useState, useEffect, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CustomLoader } from "../components/CustomLoader";
import { StatusBadge } from "../components/StatusBadge";
import { Eye, X, AlertCircle, CheckCircle2 } from "lucide-react";

export const VulnerabilitiesPage = () => {
  const { user } = useContext(AuthContext);
  const [vulns, setVulns] = useState([]);
  const [patchInputs, setPatchInputs] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  // Modal States for Viewing Single Vulnerability
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Authorization Check
  const canManageVulns =
    user?.role === "ADMIN" ||
    user?.role === "SECURITY_ANALYST" ||
    user?.role === "DEVOPS_ENGINEER";

  // New Vulnerability Form State
  const [formData, setFormData] = useState({
    cveId: "",
    title: "",
    description: "",
    severity: "HIGH",
    cvssScore: 7.5,
    patchStatus: "PENDING",
    affectedServersCount: 10,
    patchedServersCount: 0,
    scannerSource: "  Scanner",
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchVulns = async () => {
    try {
      const res = await API.get("/api/v1/vulnerabilities");
      setVulns(res.data);
    } catch (err) {
      console.error("Vulnerabilities fetch error", err);
      setNotice({ type: "error", message: "Failed to load vulnerabilities." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulns();
  }, []);

  const handleViewVuln = (v) => {
    setSelectedVuln(v);
    setIsViewModalOpen(true);
  };

  const validateNewVuln = () => {
    const errs = {};
    if (!formData.cveId.trim())
      errs.cveId = "CVE ID required (  CVE-2026-1234)";
    if (!formData.title.trim()) errs.title = "Title required";
    if (formData.cvssScore < 0 || formData.cvssScore > 10)
      errs.cvssScore = "CVSS Score must be 0 - 10";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateVuln = async (e) => {
    e.preventDefault();
    setNotice({ type: "", message: "" });
    if (!canManageVulns) return;
    if (!validateNewVuln()) return;

    try {
      const res = await API.post("/api/v1/vulnerabilities", formData);
      setVulns([...vulns, res.data]);
      setFormData({
        cveId: "",
        title: "",
        description: "",
        severity: "HIGH",
        cvssScore: 7.5,
        patchStatus: "PENDING",
        affectedServersCount: 10,
        patchedServersCount: 0,
        scannerSource: "  Scanner",
      });
      setFormErrors({});
      setNotice({ type: "success", message: "Vulnerability registered successfully." });
    } catch (err) {
      setNotice({ type: "error", message: "Failed to register CVE. Please try again." });
    }
  };

  const handleApplyPatch = async (id) => {
    setNotice({ type: "", message: "" });
    const qty = parseInt(patchInputs[id]);
    if (!qty || qty <= 0) {
      setErrors({ ...errors, [id]: "Enter valid count > 0" });
      return;
    }

    try {
      const res = await API.put(`/api/v1/vulnerabilities/${id}/patch`, {
        serversToPatch: qty,
      });
      setVulns(vulns.map((v) => (v.id === id ? res.data : v)));

      setPatchInputs((prev) => ({ ...prev, [id]: "" }));
      setErrors((prev) => ({ ...prev, [id]: null }));
      setNotice({ type: "success", message: `Patch applied to ${qty} server(s).` });
    } catch (err) {
      setErrors({ ...errors, [id]: "Patch operation failed" });
    }
  };

  const handleScan = async (id) => {
    setNotice({ type: "", message: "" });
    try {
      const res = await API.post(`/api/v1/vulnerabilities/${id}/scan`);
      setVulns(vulns.map((v) => (v.id === id ? res.data : v)));
      setNotice({ type: "success", message: "Scan completed successfully!" });
    } catch (err) {
      setNotice({ type: "error", message: "Scan trigger failed." });
    }
  };

  if (loading)
    return (
      <CustomLoader message="Loading Vulnerability Scanner & Patch Tracker..." />
    );

  const totalCves = vulns.length;
  const criticalCves = vulns.filter((v) => v.severity === "CRITICAL").length;
  const patchedCves = vulns.filter((v) => v.patchStatus === "PATCHED").length;
  const totalAffected = vulns.reduce((acc, v) => acc + (v.affectedServersCount || 0), 0);
  const totalPatched = vulns.reduce((acc, v) => acc + (v.patchedServersCount || 0), 0);
  const patchProgress = totalAffected > 0 ? Math.round((totalPatched / totalAffected) * 100) : 0;

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: "20px", color: "#fff" }}>
        Vulnerability Assessment & Patch Engine
      </h2>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="stat-title">Tracked CVE Records</div>
          <div className="stat-value" style={{ color: "var(--CSMS-blue)" }}>{totalCves}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Critical Severity</div>
          <div className="stat-value" style={{ color: criticalCves > 0 ? "#EF4444" : "#10B981" }}>{criticalCves}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Patched CVEs</div>
          <div className="stat-value" style={{ color: "#10B981" }}>{patchedCves}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Fleet Patch Progress</div>
          <div className="stat-value" style={{ color: "#F59E0B" }}>{patchProgress}%</div>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {notice.message && (
        <div
          className="form-panel"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: `4px solid ${
              notice.type === "success" ? "#52c41a" : "#f5222d"
            }`,
            backgroundColor:
              notice.type === "success"
                ? "rgba(82, 196, 26, 0.1)"
                : "rgba(245, 34, 45, 0.1)",
          }}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} color="#52c41a" />
          ) : (
            <AlertCircle size={18} color="#f5222d" />
          )}
          <span style={{ color: "#fff", fontSize: "0.9rem" }}>
            {notice.message}
          </span>
        </div>
      )}

      {/* CREATE CVE FORM - VISIBLE ONLY TO AUTHORIZED ROLES */}
      {canManageVulns && (
        <div className="form-panel" style={{ marginBottom: "20px" }}>
          <h4
            style={{
              color: "var(--CSMS-text-muted)",
              marginBottom: "15px",
            }}
          >
            Register CVE Record
          </h4>
          <form onSubmit={handleCreateVuln}>
            <div className="form-grid">
              <div className="form-field">
                <label>CVE ID</label>
                <input
                  className={`form-input ${
                    formErrors.cveId ? "is-invalid" : ""
                  }`}
                  value={formData.cveId}
                  onChange={(e) =>
                    setFormData({ ...formData, cveId: e.target.value })
                  }
                  placeholder="CVE-2026-1234"
                />
                {formErrors.cveId && (
                  <span className="field-error-msg">{formErrors.cveId}</span>
                )}
              </div>

              <div className="form-field">
                <label>Vulnerability Title</label>
                <input
                  className={`form-input ${
                    formErrors.title ? "is-invalid" : ""
                  }`}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Remote Code Execution in Webserver"
                />
                {formErrors.title && (
                  <span className="field-error-msg">{formErrors.title}</span>
                )}
              </div>

              <div className="form-field">
                <label>CVSS Score (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.1"
                  className={`form-input ${
                    formErrors.cvssScore ? "is-invalid" : ""
                  }`}
                  value={formData.cvssScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cvssScore: parseFloat(e.target.value),
                    })
                  }
                />
                {formErrors.cvssScore && (
                  <span className="field-error-msg">{formErrors.cvssScore}</span>
                )}
              </div>

              <div className="form-field">
                <label>Severity</label>
                <select
                  className="form-input"
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: "16px" }}
            >
              Register Vulnerability
            </button>
          </form>
        </div>
      )}

      {/* VULNERABILITIES TABLE */}
      <div className="table-panel">
        <h4
          style={{
            padding: "16px",
            color: "var(--CSMS-text-muted)",
            margin: 0,
          }}
        >
          Tracked Vulnerabilities & Patch Action
        </h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>CVSS</th>
              <th>Patch Status</th>
              <th>Affected</th>
              <th>Patched</th>
              <th>Patch Servers Action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vulns.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.cveId}</td>
                <td>{v.title}</td>
                <td>
                  <StatusBadge status={v.severity} />
                </td>
                <td>{v.cvssScore}</td>
                <td>
                  <StatusBadge status={v.patchStatus} />
                </td>
                <td>{v.affectedServersCount}</td>
                <td>{v.patchedServersCount}</td>

                {/* PATCH ACTION COLUMN */}
                <td>
                  {v.patchStatus === "PATCHED" ||
                  v.patchedServersCount >= v.affectedServersCount ? (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#52c41a",
                        fontWeight: 600,
                      }}
                    >
                      Fully Patched
                    </span>
                  ) : canManageVulns ? (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="number"
                          min="1"
                          max={v.affectedServersCount - v.patchedServersCount}
                          className={`form-input patch-qty-input ${
                            errors[v.id] ? "is-invalid" : ""
                          }`}
                          style={{
                            width: "72px",
                            padding: "5px 8px",
                            fontSize: "0.8rem",
                            textAlign: "center",
                            MozAppearance: "textfield",
                          }}
                          placeholder="Qty"
                          value={patchInputs[v.id] || ""}
                          onChange={(e) =>
                            setPatchInputs({
                              ...patchInputs,
                              [v.id]: e.target.value,
                            })
                          }
                        />
                        <button
                          className="btn-glass btn-green"
                          style={{
                            padding: "5px 10px",
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                          }}
                          onClick={() => handleApplyPatch(v.id)}
                        >
                          Apply Patch
                        </button>
                      </div>
                      {errors[v.id] && (
                        <span
                          className="field-error-msg"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {errors[v.id]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#8c9ba5" }}>
                      Read-only
                    </span>
                  )}
                </td>

                {/* ACTIONS COLUMN */}
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn-glass btn-blue"
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={() => handleViewVuln(v)}
                      title="View Details"
                    >
                      <Eye size={12} /> View
                    </button>

                    {canManageVulns && (
                      <button
                        className="btn-action"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={() => handleScan(v.id)}
                      >
                        Rescan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW SINGLE VULNERABILITY MODAL */}
      {isViewModalOpen && selectedVuln && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="form-panel"
            style={{ width: "480px", marginBottom: 0 }}
          >
            <div
              style={{
                display: "flex",
                justifyInhalt: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0, color: "#fff" }}>
                Vulnerability Details
              </h3>
              <X
                size={20}
                color="#a0aec0"
                style={{ cursor: "pointer" }}
                onClick={() => setIsViewModalOpen(false)}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                fontSize: "0.95rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#8c9ba5",
                    display: "block",
                  }}
                >
                  CVE ID
                </span>
                <span style={{ fontWeight: 600, color: "#fff" }}>
                  {selectedVuln.cveId}
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#8c9ba5",
                    display: "block",
                  }}
                >
                  TITLE
                </span>
                <span style={{ fontWeight: 600 }}>{selectedVuln.title}</span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#8c9ba5",
                    display: "block",
                  }}
                >
                  DESCRIPTION
                </span>
                <span>
                  {selectedVuln.description ||
                    "No detailed description provided."}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "#8c9ba5",
                      display: "block",
                    }}
                  >
                    CVSS SCORE
                  </span>
                  <span>{selectedVuln.cvssScore}</span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "#8c9ba5",
                      display: "block",
                    }}
                  >
                    SEVERITY
                  </span>
                  <StatusBadge status={selectedVuln.severity} />
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#8c9ba5",
                    display: "block",
                  }}
                >
                  PATCH STATUS
                </span>
                <StatusBadge status={selectedVuln.patchStatus} />
              </div>
            </div>

            <button
              className="btn-glass btn-blue"
              style={{ flex: 1,
                  background: "transparent",marginTop: "24px", width: "100%" }}
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