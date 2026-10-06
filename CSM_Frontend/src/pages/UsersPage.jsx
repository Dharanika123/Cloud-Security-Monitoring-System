import React, { useState, useEffect, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CustomLoader } from "../components/CustomLoader";
import { Users, UserPlus, Edit, Trash2, X, Check, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

export const UsersPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Notice Banner State
  const [notice, setNotice] = useState({ type: "", message: "" });

  // Form State for Creating New User
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [formErrors, setFormErrors] = useState({});

  // Modal States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [editError, setEditError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await API.get("/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setNotice({ type: "error", message: "Failed to load user accounts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateCreate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = "Username required";
    if (!formData.email.trim()) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid email format";
    if (!formData.password) errs.password = "Password required";
    else if (formData.password.length < 6) errs.password = "Min 6 characters required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNotice({ type: "", message: "" });
    if (!validateCreate()) return;

    try {
      const payload = {
        ...formData,
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
      };
      const res = await API.post("/api/users", payload);
      setUsers([...users, res.data]);
      setFormData({ username: "", email: "", password: "", role: "EMPLOYEE" });
      setFormErrors({});
      setNotice({ type: "success", message: `User account '${res.data.username}' provisioned successfully.` });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.response?.data?.message || "Failed to create user account.",
      });
    }
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditError("");
    setEditFormData({
      email: u.email,
      password: "",
      role: u.role,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditError("");

    try {
      const payload = {
        email: editFormData.email.trim().toLowerCase(),
        role: editFormData.role,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await API.put(`/api/users/${selectedUser.userId}`, payload);
      setUsers(users.map((u) => (u.userId === selectedUser.userId ? res.data : u)));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setNotice({ type: "success", message: `Updated authorization settings for '${res.data.username}'.` });
    } catch (err) {
      setEditError("Failed to update user authorization.");
    }
  };

  const handlePromptDelete = (u) => {
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await API.delete(`/api/users/${selectedUser.userId}`);
      setUsers(users.filter((u) => u.userId !== selectedUser.userId));
      setIsDeleteModalOpen(false);
      setNotice({ type: "success", message: `Account '${selectedUser.username}' successfully revoked.` });
      setSelectedUser(null);
    } catch (err) {
      setIsDeleteModalOpen(false);
      setNotice({ type: "error", message: "Failed to delete user account." });
    }
  };

  if (loading) return <CustomLoader message="Loading Security Credentials Catalog..." />;

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="page-container">
        <div className="form-panel" style={{ textAlign: "center", padding: "40px", color: "#8c9ba5" }}>
          <AlertTriangle size={48} color="#f5222d" style={{ marginBottom: "16px" }} />
          <h3>Access Restricted</h3>
          <p>User Identity & Authorization management is restricted to ADMIN roles only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <Users size={24} color="#52c41a" />
        <h2 style={{ color: "#fff", margin: 0 }}>Identity & Role Administration</h2>
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

      {/* CREATE USER PANEL */}
      <div className="form-panel" style={{ marginBottom: "20px" }}>
        <h4 style={{ color: "var(--CSMS-text-muted)", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <UserPlus size={18} /> Provision New SOC User
        </h4>
        <form onSubmit={handleCreateUser}>
          <div className="form-grid">
            <div className="form-field">
              <label>Username</label>
              <input
                className={`form-input ${formErrors.username ? "is-invalid" : ""}`}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="  j_doe"
              />
              {formErrors.username && <span className="field-error-msg">{formErrors.username}</span>}
            </div>

            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                className={`form-input ${formErrors.email ? "is-invalid" : ""}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jdoe@company.com"
              />
              {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
            </div>

            <div className="form-field">
              <label>Initial Password</label>
              <input
                type="password"
                className={`form-input ${formErrors.password ? "is-invalid" : ""}`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              {formErrors.password && <span className="field-error-msg">{formErrors.password}</span>}
            </div>

            <div className="form-field">
              <label>Assigned Authorization Role</label>
              <select
                className="form-input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="ADMIN">ADMIN (Full Platform Access)</option>
                <option value="SECURITY_ANALYST">SECURITY_ANALYST (Vulnerabilities & Incidents)</option>
                <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER (Assets & Patch Engine)</option>
                <option value="EMPLOYEE">EMPLOYEE (Read Only Overview)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-glass btn-green" style={{ marginTop: "16px" }}>
            Provision User
          </button>
        </form>
      </div>

      {/* USERS TABLE */}
      <div className="table-panel">
        <h4 style={{ padding: "16px", color: "var(--CSMS-text-muted)", margin: 0 }}>
          Provisioned Accounts ({users.length})
        </h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId}>
                <td style={{ fontFamily: "monospace" }}>#{u.userId}</td>
                <td style={{ fontWeight: 600, color: "#fff" }}>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background:
                        u.role === "ADMIN"
                          ? "rgba(245, 34, 45, 0.2)"
                          : u.role === "SECURITY_ANALYST"
                          ? "rgba(114, 46, 209, 0.2)"
                          : u.role === "DEVOPS_ENGINEER"
                          ? "rgba(24, 144, 255, 0.2)"
                          : "rgba(255, 255, 255, 0.1)",
                      color:
                        u.role === "ADMIN"
                          ? "#ff7875"
                          : u.role === "SECURITY_ANALYST"
                          ? "#b37feb"
                          : u.role === "DEVOPS_ENGINEER"
                          ? "#69c0ff"
                          : "#d9d9d9",
                      border: "1px solid currentColor",
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ fontSize: "0.82rem", color: "#8c9ba5" }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-glass btn-orange"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                      onClick={() => handleOpenEdit(u)}
                    >
                      <Edit size={14} /> Edit
                    </button>

                    {/* Prevent deleting own logged in admin account */}
                    {currentUser?.username !== u.username && (
                      <button
                        className="btn-glass btn-red"
                        style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                        onClick={() => handlePromptDelete(u)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="form-panel" style={{ width: "480px", marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#fff" }}>Modify User Authorization</h3>
              <X size={20} color="#a0aec0" style={{ cursor: "pointer" }} onClick={() => setIsEditModalOpen(false)} />
            </div>

            {editError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  marginBottom: "16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(245, 34, 45, 0.15)",
                  border: "1px solid rgba(245, 34, 45, 0.3)",
                  color: "#f5222d",
                  fontSize: "0.85rem",
                }}
              >
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-field">
                  <label>Username (Read-Only)</label>
                  <input className="form-input" value={selectedUser.username} disabled style={{ opacity: 0.6 }} />
                </div>

                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Reset Password (Leave blank to keep existing)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="New password..."
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Role Privilege</label>
                  <select
                    className="form-input"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                    <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button type="submit" className="btn-glass btn-green" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
                  <Check size={16} /> Save Changes
                </button>
                <button type="button" className="btn-glass btn-blue" style={{ background: "transparent"}} onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div className="form-panel" style={{ width: "440px", textAlign: "center", padding: "30px", marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <div style={{ background: "rgba(245, 34, 45, 0.15)", padding: "14px", borderRadius: "50%", border: "1px solid rgba(245, 34, 45, 0.3)" }}>
                <AlertTriangle size={32} color="#f5222d" />
              </div>
            </div>

            <h3 style={{ color: "#fff", marginBottom: "10px" }}>Revoke Account Access?</h3>
            <p style={{ color: "#a0aec0", fontSize: "0.9rem", marginBottom: "20px" }}>
              Are you sure you want to permanently delete user <strong style={{ color: "#fff" }}>"{selectedUser.username}"</strong> ({selectedUser.email})?
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button className="btn-glass btn-red" style={{ flex: 1 }} onClick={handleConfirmDelete}>
                Delete User
              </button>
              <button type="button" className="btn-glass btn-blue" style={{ background: "transparent"}} onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};