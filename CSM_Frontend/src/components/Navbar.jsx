import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, LogOut, Mail, Calendar, ShieldCheck } from "lucide-react";
import { formatDisplayName } from "../utils/userUtils";

export const Navbar = ({ onToggleChat, isChatOpen }) => {
  const navigate = useNavigate();
  const { user, logout, getInitials } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/");
  };

  return (
    <>
      <div className="top-navbar">
        {/* Left Side: Brand Logo & Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(82, 196, 26, 0.1)",
              border: "1px solid rgba(82, 196, 26, 0.25)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              color: "#52c41a",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#52c41a",
                boxShadow: "0 0 8px #52c41a",
              }}
            />
            SOC Telemetry Online
          </div>
        </div>

        {/* Right Side: Ask CSMS Button + User Profile Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Ask CSMS Pill Button */}
          <button
            onClick={onToggleChat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: isChatOpen ? "#1e293b" : "#171B22",
              color: "#FFF",
              border: `1px solid ${isChatOpen ? "#10B981" : "#242933"}`,
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#10B981";
              e.currentTarget.style.backgroundColor = "#1C222D";
            }}
            onMouseLeave={(e) => {
              if (!isChatOpen) {
                e.currentTarget.style.borderColor = "#242933";
                e.currentTarget.style.backgroundColor = "#171B22";
              }
            }}
          >
            <Shield size={16} color="#10B981" />
            <span>Ask CSMS</span>
          </button>

          {/* Profile Dropdown */}
          {user && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  cursor: "pointer",
                }}
              >
                <button className="user-profile-btn">
                  {getInitials(user.username)}
                </button>
              </div>

              {showDropdown && (
                <div
                  className="user-dropdown"
                  style={{ width: "320px", right: 0, top: "55px" }}
                >
                  <div className="dropdown-header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        className="user-profile-btn"
                        style={{
                          width: "48px",
                          height: "48px",
                          fontSize: "1.2rem",
                        }}
                      >
                        {getInitials(user.username)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            color: "#fff",
                          }}
                        >
                          {formatDisplayName(user.username)}
                        </div>
                        <span
                          className="badge badge-healthy"
                          style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--CSMS-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "0.9rem",
                        color: "var(--CSMS-text-main)",
                      }}
                    >
                      <Mail size={18} color="#1890ff" />
                      <div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--CSMS-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          EMAIL ADDRESS
                        </div>
                        <div>{user.email || "admin@CSMS.io"}</div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "0.9rem",
                        color: "var(--CSMS-text-main)",
                      }}
                    >
                      <ShieldCheck size={18} color="#52c41a" />
                      <div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--CSMS-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          PERMISSIONS LEVEL
                        </div>
                        <div>
                          {user.role === "ADMIN"
                            ? "Full Control (Read / Write / Delete)"
                            : "Read-Only Security Analyst"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "0.9rem",
                        color: "var(--CSMS-text-main)",
                      }}
                    >
                      <Calendar size={18} color="#fa8c16" />
                      <div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--CSMS-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          ACCOUNT CREATED AT
                        </div>
                        <div>{formatDate(user.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: "10px" }}>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
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
            zIndex: 2000,
          }}
        >
          <div
            className="form-panel"
            style={{
              width: "420px",
              textAlign: "center",
              padding: "30px",
              marginBottom: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  background: "rgba(245, 34, 45, 0.15)",
                  padding: "14px",
                  borderRadius: "50%",
                  border: "1px solid rgba(245, 34, 45, 0.3)",
                }}
              >
                <LogOut size={32} color="#f5222d" />
              </div>
            </div>

            <h3 style={{ color: "#fff", marginBottom: "10px" }}>
              Sign Out of CSMS?
            </h3>

            <p
              style={{
                color: "#a0aec0",
                fontSize: "0.9rem",
                marginBottom: "24px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to end your active SecOps session? You will
              need to sign in again to access telemetry.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="btn-glass btn-red"
                style={{ flex: 1 }}
                onClick={handleConfirmLogout}
              >
                Yes, Sign Out
              </button>

              <button
                className="btn-glass btn-blue"
                style={{ flex: 1, background: "transparent", width: "100%" }}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};