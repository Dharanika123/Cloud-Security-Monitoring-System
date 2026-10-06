import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Activity,
  Fingerprint,
  Zap,
  Globe,
  Terminal,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

/* ─── Inject auth-page keyframes once ─── */
const AUTH_STYLE_ID = "__csms-auth-keyframes";
if (typeof document !== "undefined" && !document.getElementById(AUTH_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = AUTH_STYLE_ID;
  s.textContent = `
    @keyframes csms-auth-fade-up {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes csms-auth-glow {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 1; }
    }
    @keyframes csms-auth-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes csms-auth-gradient {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes csms-auth-scan {
      0%   { top: 0; }
      100% { top: 100%; }
    }
    @keyframes csms-auth-particle {
      0%   { transform: translateY(0) translateX(0); opacity: 0; }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-100%) translateX(15px); opacity: 0; }
    }
    @keyframes csms-auth-orbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .csms-auth-input {
      width: 100%;
      padding: 12px 14px 12px 44px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #f1f5f9;
      font-size: 0.88rem;
      font-family: 'Inter', system-ui, sans-serif;
      outline: none;
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .csms-auth-input::placeholder {
      color: #475569;
    }
    .csms-auth-input:focus {
      border-color: rgba(82,196,26,0.5);
      box-shadow: 0 0 0 3px rgba(82,196,26,0.08);
    }
    .csms-auth-input-error {
      border-color: #ef4444 !important;
    }
    .csms-auth-input-error:focus {
      box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
    }
    .csms-auth-submit {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #52c41a, #3da612);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Inter', system-ui, sans-serif;
    }
    .csms-auth-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(82,196,26,0.35);
    }
    .csms-auth-submit:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      filter: grayscale(40%);
    }
    .csms-auth-submit::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transition: left 0.5s ease;
    }
    .csms-auth-submit:hover:not(:disabled)::before {
      left: 100%;
    }
    @media (max-width: 900px) {
      .csms-auth-split { grid-template-columns: 1fr !important; }
      .csms-auth-left  { display: none !important; }
    }
  `;
  document.head.appendChild(s);
}

/* ─── Particles (left panel decoration) ─── */
const AuthParticles = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {Array.from({ length: 14 }).map((_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          width: i % 3 === 0 ? "3px" : "2px",
          height: i % 3 === 0 ? "3px" : "2px",
          borderRadius: "50%",
          background: i % 3 === 0 ? "#52c41a" : i % 3 === 1 ? "#38bdf8" : "#a855f7",
          left: `${(i * 7.7) % 100}%`,
          bottom: "-4px",
          opacity: 0.45,
          animation: `csms-auth-particle ${9 + i * 1.5}s linear ${i * 0.9}s infinite`,
        }}
      />
    ))}
  </div>
);

/* ─── Helper: Detect simple sequences or repeating patterns ─── */
const hasSimpleSequence = (password) => {
  if (!password) return false;
  const s = password.toLowerCase();

  // Common keyboard patterns
  const keyboardPatterns = [
    "qwerty", "asdfgh", "zxcvbn", "qwert", "asdfg", "zxcvb",
    "poiuy", "lkjhg", "mnbvc", "123456", "654321", "password"
  ];
  for (const pat of keyboardPatterns) {
    if (s.includes(pat)) return true;
  }

  // Repeating 3 or more consecutive identical characters (e.g. '4444', 'aaa')
  if (/(.)\1{2,}/.test(s)) return true;

  // 3 or more sequential alphanumeric characters (e.g. 'abc', '123', 'cba', '321')
  for (let i = 0; i < s.length - 2; i++) {
    const c1 = s.charCodeAt(i);
    const c2 = s.charCodeAt(i + 1);
    const c3 = s.charCodeAt(i + 2);

    // Alphabet sequences (a-z)
    if (c1 >= 97 && c1 <= 122 && c2 >= 97 && c2 <= 122 && c3 >= 97 && c3 <= 122) {
      if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
        return true;
      }
    }
    // Number sequences (0-9)
    if (c1 >= 48 && c1 <= 57 && c2 >= 48 && c2 <= 57 && c3 >= 48 && c3 <= 57) {
      if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
        return true;
      }
    }
  }

  return false;
};


export const AuthPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Derive mode from URL path
  const isLoginMode = location.pathname !== "/signup";

  const setIsLoginMode = (wantLogin) => {
    navigate(wantLogin ? "/login" : "/signup", { replace: true });
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Real-time password validation rules
  const pwd = formData.password;
  const isRuleLength = pwd.length >= 8 && pwd.length <= 30;
  const isRuleCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
  const isRuleNumber = /\d/.test(pwd);
  const isRuleSpecial = /[-!@#$%^&*()+]/.test(pwd);
  const isRuleNoSequence = pwd.length > 0 && !hasSimpleSequence(pwd);

  const allPasswordRulesMet =
    isRuleLength && isRuleCase && isRuleNumber && isRuleSpecial && isRuleNoSequence;

  const passwordRules = [
    { label: "8 to 30 characters long", passed: isRuleLength },
    { label: "Both lowercase and uppercase letters", passed: isRuleCase },
    { label: "At least 1 number (0-9)", passed: isRuleNumber },
    { label: "At least 1 special character (-!@#$%^&*()+)", passed: isRuleSpecial },
    { label: "No simple sequences or repeats (abc, 123, 4444, qwerty)", passed: isRuleNoSequence },
  ];

  // Reset form state when switching modes
  useEffect(() => {
    setErrors({});
    setApiError("");
    setSuccessMessage("");
    setIsMfaRequired(false);
    setMfaCode("");
    setIsPasswordFocused(false);
  }, [isLoginMode]);

  /* — focus first input on mount / mode switch — */
  const firstInputRef = useRef(null);
  useEffect(() => {
    firstInputRef.current?.focus();
  }, [isLoginMode, isMfaRequired]);

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = "Username or Identity ID is required";
    if (!isLoginMode) {
      if (!formData.email.trim()) errs.email = "Email address is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid corporate email format";

      if (!allPasswordRulesMet) {
        errs.password = "Password does not meet all security requirements";
      }

      if (!formData.confirmPassword) {
        errs.confirmPassword = "Confirm password is required";
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    } else {
      if (!formData.password) errs.password = "Password is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    if (!validate()) return;

    setLoading(true);
    const payload = {
      username: formData.username.trim().toLowerCase(),
      email: formData.email ? formData.email.trim().toLowerCase() : undefined,
      password: formData.password,
      rememberMe,
    };

    try {
      if (isLoginMode) {
        if (isMfaRequired) {
          const response = await API.post("/auth/mfa-verify", { username: payload.username, code: mfaCode });
          login(response.data);
          navigate("/dashboard", { replace: true });
          return;
        }
        const response = await API.post("/auth/login", { username: payload.username, password: payload.password });
        if (response.data?.mfaRequired) {
          setIsMfaRequired(true);
          setSuccessMessage("Security Challenge: Enter the 2FA code from your authenticator app.");
          return;
        }
        login(response.data);
        navigate("/dashboard", { replace: true });
      } else {
        await API.post("/auth/register", payload);
        setFormData({ username: "", email: "", password: "", confirmPassword: "" });
        navigate("/login", { replace: true });
        setSuccessMessage("Account created successfully. Please sign in with your credentials.");
      }
    } catch (err) {
      setApiError(err.response?.data?.message || "Authentication service failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Feature list for left panel ─── */
  const features = [
    { icon: <Activity size={18} />, title: "Real-Time Telemetry", desc: "24M+ events streamed daily with sub-ms latency" },
    { icon: <Fingerprint size={18} />, title: "Immutable Audit Trails", desc: "SHA-256 signed logs for SOC 2 & PCI-DSS 4.0" },
    { icon: <Zap size={18} />, title: "Zero-Day Heuristics", desc: "AI-driven threat detection in under 40ms" },
    { icon: <Globe size={18} />, title: "Multi-Cloud Native", desc: "AWS, Azure, GCP, and bare-metal unified" },
  ];

  // Button disabled condition
  const isSubmitDisabled =
    loading ||
    (!isLoginMode &&
      (!allPasswordRulesMet ||
        !formData.confirmPassword ||
        formData.password !== formData.confirmPassword));

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#06080d",
        color: "#f1f5f9",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══ SPLIT LAYOUT ═══ */}
      <div
        className="csms-auth-split"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ═══════════ LEFT PANEL — Branding ═══════════ */}
        <div
          className="csms-auth-left"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 56px",
            background: "linear-gradient(160deg, rgba(15,23,42,0.5), rgba(6,8,13,0.95))",
            borderRight: "1px solid rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          <AuthParticles />

          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "30%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(ellipse, rgba(82,196,26,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Orbiting ring decoration */}
          <div style={{
            position: "absolute",
            top: "10%",
            right: "-80px",
            width: "260px",
            height: "260px",
            border: "1px solid rgba(82,196,26,0.06)",
            borderRadius: "50%",
            animation: "csms-auth-orbit 40s linear infinite",
            pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute",
              top: "-4px",
              left: "50%",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#52c41a",
              boxShadow: "0 0 12px #52c41a",
            }} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "56px",
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(82,196,26,0.2), rgba(82,196,26,0.05))",
                  padding: "8px",
                  borderRadius: "12px",
                  border: "1px solid rgba(82,196,26,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={22} color="#52c41a" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.5px" }}>
                CSMS <span style={{ color: "#52c41a" }}>IMA</span>
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: "2.8rem",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                marginBottom: "16px",
              }}
            >
              Secure your{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #52c41a, #38bdf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                entire cloud
              </span>
              <br />
              in minutes.
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "1.02rem", lineHeight: 1.65, maxWidth: "420px", marginBottom: "48px" }}>
              Enterprise-grade infrastructure monitoring, threat detection, and compliance — all from one command center.
            </p>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "56px" }}>
              {features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    opacity: 0,
                    animation: `csms-auth-fade-up 0.5s ease ${0.15 + i * 0.1}s forwards`,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(82,196,26,0.08)",
                      border: "1px solid rgba(82,196,26,0.12)",
                      borderRadius: "10px",
                      padding: "8px",
                      color: "#52c41a",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "2px" }}>{f.title}</div>
                    <div style={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.45 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal chip */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px",
                padding: "10px 16px",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: "0.78rem",
                color: "#64748b",
              }}
            >
              <Terminal size={14} color="#52c41a" />
              <span style={{ color: "#475569" }}>$</span>
              <span>curl -sSL https://get.csms.io | sh</span>
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL — Form ═══════════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "48px 32px",
            position: "relative",
            minHeight: "100vh",
            overflowY: "auto",
          }}
        >
          {/* Radial glow behind form */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "500px",
              height: "500px",
              background: "radial-gradient(ellipse, rgba(82,196,26,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Back to landing button */}
          <div style={{ width: "100%", maxWidth: "440px", marginBottom: "24px", position: "relative", zIndex: 1 }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 0",
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <ArrowLeft size={15} /> Back to home
            </button>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              position: "relative",
              zIndex: 1,
              opacity: 0,
              animation: "csms-auth-fade-up 0.6s ease 0.1s forwards",
            }}
          >
            {/* Heading */}
            <h2
              style={{
                fontSize: "1.7rem",
                fontWeight: 800,
                letterSpacing: "-0.8px",
                marginBottom: "6px",
              }}
            >
              {isMfaRequired
                ? "Two-Factor Verification"
                : isLoginMode
                  ? "Sign in to your console"
                  : "Create your account"}
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "28px" }}>
              {isMfaRequired
                ? "Enter the 6-digit code from your authenticator app."
                : isLoginMode
                  ? "Enter your credentials to access the command center."
                  : "Set up your enterprise account to get started."}
            </p>

            {/* ── Banners ── */}
            {successMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                  background: "rgba(82,196,26,0.08)",
                  border: "1px solid rgba(82,196,26,0.2)",
                  fontSize: "0.82rem",
                  color: "#52c41a",
                  lineHeight: 1.4,
                }}
              >
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}
            {apiError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  marginBottom: "20px",
                  borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: "0.82rem",
                  color: "#f87171",
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{apiError}</span>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} noValidate>
              {isMfaRequired ? (
                /* MFA input */
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                    Security Code
                  </label>
                  <div style={{ position: "relative" }}>
                    <KeyRound size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                    <input
                      ref={firstInputRef}
                      type="text"
                      className="csms-auth-input"
                      placeholder="000000"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      style={{ textAlign: "center", letterSpacing: "6px", fontSize: "1.1rem" }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Username */}
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                      Username or ID
                    </label>
                    <div style={{ position: "relative" }}>
                      <User size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                      <input
                        ref={firstInputRef}
                        type="text"
                        className={`csms-auth-input ${errors.username ? "csms-auth-input-error" : ""}`}
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    {errors.username && (
                      <p style={{ color: "#ef4444", fontSize: "0.73rem", marginTop: "6px" }}>{errors.username}</p>
                    )}
                  </div>

                  {/* Email - register only */}
                  {!isLoginMode && (
                    <div style={{ marginBottom: "18px" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                        Corporate Email
                      </label>
                      <div style={{ position: "relative" }}>
                        <Mail size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                        <input
                          type="email"
                          className={`csms-auth-input ${errors.email ? "csms-auth-input-error" : ""}`}
                          placeholder="you@organization.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      {errors.email && (
                        <p style={{ color: "#ef4444", fontSize: "0.73rem", marginTop: "6px" }}>{errors.email}</p>
                      )}
                    </div>
                  )}

                  {/* Password */}
                  <div style={{ marginBottom: isLoginMode ? "18px" : "14px" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`csms-auth-input ${errors.password ? "csms-auth-input-error" : ""}`}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        style={{ paddingRight: "44px" }}
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: "4px",
                          borderRadius: "4px",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p style={{ color: "#ef4444", fontSize: "0.73rem", marginTop: "6px" }}>{errors.password}</p>
                    )}
                  </div>

                  {/* ── Dynamic Real-time Password Checklist (Signup Mode — only visible when focused on password) ── */}
                  {!isLoginMode && isPasswordFocused && (
                    <div
                      style={{
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        marginBottom: "18px",
                        animation: "csms-auth-fade-up 0.25s ease forwards",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                          color: allPasswordRulesMet ? "#52c41a" : "#94a3b8",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Password Requirements</span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: allPasswordRulesMet ? "#52c41a" : "#64748b" }}>
                          {passwordRules.filter((r) => r.passed).length}/5 met
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {passwordRules.map((rule, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "0.75rem",
                              color: rule.passed ? "#52c41a" : "#ef4444",
                              transition: "color 0.2s ease",
                            }}
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: rule.passed ? "rgba(82, 196, 26, 0.15)" : "rgba(239, 68, 68, 0.12)",
                                flexShrink: 0,
                                transition: "all 0.2s ease",
                              }}
                            >
                              {rule.passed ? (
                                <Check size={11} color="#52c41a" strokeWidth={3} />
                              ) : (
                                <X size={11} color="#ef4444" strokeWidth={3} />
                              )}
                            </div>
                            <span style={{ opacity: rule.passed ? 1 : 0.85 }}>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm Password - register only */}
                  {!isLoginMode && (
                    <div style={{ marginBottom: "22px" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "8px" }}>
                        Confirm Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <Lock size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`csms-auth-input ${
                            errors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword)
                              ? "csms-auth-input-error"
                              : ""
                          }`}
                          placeholder="Re-enter your password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          style={{ paddingRight: "44px" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "#475569",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: "4px",
                            borderRadius: "4px",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Real-time match feedback */}
                      {formData.confirmPassword && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.73rem",
                            marginTop: "6px",
                            color: formData.password === formData.confirmPassword ? "#52c41a" : "#ef4444",
                          }}
                        >
                          {formData.password === formData.confirmPassword ? (
                            <>
                              <Check size={12} color="#52c41a" /> Passwords match
                            </>
                          ) : (
                            <>
                              <X size={12} color="#ef4444" /> Passwords do not match
                            </>
                          )}
                        </div>
                      )}
                      {errors.confirmPassword && !formData.confirmPassword && (
                        <p style={{ color: "#ef4444", fontSize: "0.73rem", marginTop: "6px" }}>{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {/* Remember me */}
                  {isLoginMode && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                          color: "#94a3b8",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "#52c41a",
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                        />
                        Remember me
                      </label>
                      <a
                        href="#"
                        style={{
                          color: "#52c41a",
                          textDecoration: "none",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        Forgot password?
                      </a>
                    </div>
                  )}
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="csms-auth-submit"
                style={{ marginTop: !isLoginMode && !isMfaRequired ? "4px" : "0" }}
              >
                {loading ? (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "csms-auth-orbit 0.6s linear infinite",
                    }}
                  />
                ) : (
                  <>
                    <span>
                      {isMfaRequired ? "Verify Code" : isLoginMode ? "Sign In" : "Create Account"}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                margin: "24px 0",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <span style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Switch mode */}
            <p style={{ textAlign: "center", fontSize: "0.88rem", color: "#64748b" }}>
              {isLoginMode ? "Don't have an account? " : "Already registered? "}
              <span
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setErrors({});
                  setApiError("");
                  setSuccessMessage("");
                  setIsMfaRequired(false);
                  setFormData({ username: "", email: "", password: "", confirmPassword: "" });
                }}
                style={{
                  color: "#52c41a",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {isLoginMode ? "Create Account" : "Sign In"}
                <ChevronRight size={14} style={{ verticalAlign: "middle", marginLeft: "2px" }} />
              </span>
            </p>

            {/* Footer */}
            <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#334155", marginTop: "28px" }}>
              By continuing you agree to the{" "}
              <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="#" style={{ color: "#475569", textDecoration: "underline" }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
