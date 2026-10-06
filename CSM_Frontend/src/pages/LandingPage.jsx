import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Activity,
  Terminal,
  Cpu,
  Lock,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Globe,
  Radio,
  Copy,
  Check,
  Zap,
  ChevronRight,
  Fingerprint,
  Cloud,
  Play,
  Users,
  TrendingUp,
  MousePointerClick,
} from "lucide-react";

/* ─── CSS Keyframes injected once ─── */
const STYLE_ID = "__csms-landing-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes csms-float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-12px) rotate(1deg); }
      66% { transform: translateY(6px) rotate(-1deg); }
    }
    @keyframes csms-glow-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes csms-gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes csms-fade-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes csms-slide-in-right {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes csms-scan-line {
      0% { top: 0%; }
      100% { top: 100%; }
    }
    @keyframes csms-particle-drift {
      0% { transform: translateY(0) translateX(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
    }
    @keyframes csms-orbit {
      0% { transform: rotate(0deg) translateX(140px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
    }
    @keyframes csms-typing-blink {
      0%, 100% { border-color: #52c41a; }
      50% { border-color: transparent; }
    }
    @keyframes csms-counter-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes csms-marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes csms-border-glow {
      0%, 100% { border-color: rgba(82, 196, 26, 0.2); }
      50% { border-color: rgba(82, 196, 26, 0.5); }
    }
    .csms-card-hover {
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .csms-card-hover:hover {
      transform: translateY(-4px) !important;
      border-color: rgba(82, 196, 26, 0.3) !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(82, 196, 26, 0.08) !important;
    }
    .csms-nav-link {
      position: relative;
      transition: color 0.25s ease;
    }
    .csms-nav-link::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: #52c41a;
      transition: width 0.3s ease;
    }
    .csms-nav-link:hover::after {
      width: 100%;
    }
    .csms-btn-primary {
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .csms-btn-primary::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transition: left 0.5s ease;
    }
    .csms-btn-primary:hover::before {
      left: 100%;
    }
    .csms-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(82, 196, 26, 0.4);
    }
    .csms-btn-ghost {
      transition: all 0.3s ease;
    }
    .csms-btn-ghost:hover {
      background: rgba(255,255,255,0.08) !important;
      border-color: rgba(255,255,255,0.2) !important;
      transform: translateY(-1px);
    }
    @media (max-width: 900px) {
      .csms-hero-grid { grid-template-columns: 1fr !important; }
      .csms-bento-grid { grid-template-columns: 1fr !important; }
      .csms-bento-span2 { grid-column: span 1 !important; }
      .csms-footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .csms-step-grid { grid-template-columns: 1fr !important; }
      .csms-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .csms-workflow-panel { grid-template-columns: 1fr !important; }
      .csms-hero-title { font-size: 2.4rem !important; }
      .csms-nav-links { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Intersection observer hook for scroll animations ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/* ─── Animated counter hook ─── */
function useCounter(target, duration = 2000, inView = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, inView]);
  return count;
}

/* ─── Floating particles component ─── */
const Particles = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          width: i % 3 === 0 ? "3px" : "2px",
          height: i % 3 === 0 ? "3px" : "2px",
          borderRadius: "50%",
          background:
            i % 4 === 0
              ? "#52c41a"
              : i % 4 === 1
                ? "#38bdf8"
                : i % 4 === 2
                  ? "#a855f7"
                  : "#f59e0b",
          left: `${(i * 5.3) % 100}%`,
          bottom: "-10px",
          opacity: 0.5,
          animation: `csms-particle-drift ${8 + i * 1.3}s linear ${i * 0.8}s infinite`,
        }}
      />
    ))}
  </div>
);

export const LandingPage = () => {
  const navigate = useNavigate();

  // Typewriter
  const words = [
    "Servers",
    "API gateways",
    "AWS Cloud ",
    "Azure Cloud",
    "Database",
    "K8s clusters",
    "Kafka",
  ];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Step switcher
  const [activeStep, setActiveStep] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Scroll-triggered sections
  const [heroRef, heroInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.2);
  const [stepsRef, stepsInView] = useInView(0.1);
  const [bentoRef, bentoInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.2);

  // Nav scroll effect
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Typewriter loop
  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayedText(currentWord.substring(0, displayedText.length + 1));
          if (displayedText === currentWord) {
            setTimeout(() => setIsDeleting(true), 1800);
          }
        } else {
          setDisplayedText(currentWord.substring(0, displayedText.length - 1));
          if (displayedText === "") {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? 40 : 80,
    );
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentWordIndex]);

  // Auto-cycle steps
  useEffect(() => {
    const timer = setInterval(() => setActiveStep((p) => (p + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, []);

  // Animated stats
  const eventCount = useCounter(24, 2000, statsInView);
  const latencyCount = useCounter(40, 1800, statsInView);
  const uptimeVal = useCounter(99, 2200, statsInView);
  const teamCount = useCounter(2400, 2500, statsInView);

  const copyCLI = () => {
    navigator.clipboard?.writeText("curl -sSL https://get.csms.io | sh");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div
      style={{
        background: "#06080d",
        minHeight: "100vh",
        color: "#f1f5f9",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Radial ambient glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background:
            "radial-gradient(ellipse, rgba(82,196,26,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══════════ NAVIGATION ═══════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "rgba(6, 8, 13, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          transition: "all 0.35s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(82,196,26,0.2), rgba(82,196,26,0.05))",
                padding: "7px",
                borderRadius: "10px",
                border: "1px solid rgba(82,196,26,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={20} color="#52c41a" />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: "-0.5px",
              }}
            >
              CSMS <span style={{ color: "#52c41a" }}>IMA</span>
            </span>
          </div>

          {/* Nav links */}
          <nav
            className="csms-nav-links"
            style={{
              display: "flex",
              gap: "28px",
              fontSize: "0.875rem",
              color: "#94a3b8",
            }}
          >
            {["Product", "Architecture", "Telemetry", "ContactUs", "Docs"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="csms-nav-link"
                  style={{
                    color: "#94a3b8",
                    textDecoration: "none",
                    fontWeight: 500,
                    position: "relative",
                    paddingBottom: "4px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#f1f5f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#94a3b8")
                  }
                >
                  {item}
                </a>
              ),
            )}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: "8px 18px",
              borderRadius: "8px",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#cbd5e1";
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="csms-btn-primary"
            style={{
              background: "linear-gradient(135deg, #52c41a, #3da612)",
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <section
          ref={heroRef}
          className="csms-hero-grid"
          style={{
            paddingTop: "80px",
            paddingBottom: "60px",
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "64px",
            alignItems: "center",
            opacity: heroInView ? 1 : 0,
            transform: heroInView ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div>
            {/* Announcement pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background:
                  "linear-gradient(135deg, rgba(82,196,26,0.12), rgba(82,196,26,0.04))",
                border: "1px solid rgba(82,196,26,0.2)",
                padding: "5px 16px 5px 6px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                color: "#a3e635",
                fontWeight: 600,
                marginBottom: "28px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(82,196,26,0.4)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(82,196,26,0.2)")
              }
            >
              CSMS — Zero Trust Cloud Defense
              <ChevronRight size={14} style={{ opacity: 0.6 }} />
            </div>

            {/* Headline */}
            <h1
              className="csms-hero-title"
              style={{
                fontSize: "3.6rem",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-2px",
                marginBottom: "24px",
              }}
            >
              Your fastest path <br />
              to secure{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #52c41a, #38bdf8, #a855f7)",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "csms-gradient-shift 4s ease infinite",
                  borderRight: "3px solid #52c41a",
                  paddingRight: "6px",
                  animation:
                    "csms-typing-blink 0.8s step-end infinite, csms-gradient-shift 4s ease infinite",
                }}
              >
                {displayedText}
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.12rem",
                color: "#94a3b8",
                lineHeight: 1.7,
                maxWidth: "520px",
                marginBottom: "40px",
              }}
            >
              Unified infrastructure telemetry, automated threat sandboxing, and
              immutable cryptographic audit trails — built for cloud-native
              engineering teams.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "40px",
              }}
            >
              <button
                onClick={() => navigate("/signup")}
                className="csms-btn-primary"
                style={{
                  background: "linear-gradient(135deg, #52c41a, #3da612)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  padding: "14px 28px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Start for free <ArrowRight size={16} />
              </button>
              <button
                className="csms-btn-ghost"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "#e2e8f0",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  padding: "14px 24px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Play size={15} /> Live Demo
              </button>
            </div>

            {/* CLI install */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "10px 16px",
                borderRadius: "10px",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: "0.82rem",
                color: "#94a3b8",
              }}
            >
              <Terminal size={14} color="#52c41a" />
              <span style={{ color: "#64748b" }}>$</span>
              <span>curl -sSL https://get.csms.io | sh</span>
              <button
                onClick={copyCLI}
                style={{
                  background: "none",
                  border: "none",
                  color: "#52c41a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "4px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(82,196,26,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                {copiedCmd ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* ── Hero right: Interactive dashboard preview ── */}
          <div
            style={{
              position: "relative",
              height: "420px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Particles />
            {/* Main card */}
            <div
              style={{
                background:
                  "linear-gradient(160deg, rgba(15,23,42,0.9), rgba(6,8,13,0.95))",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "24px",
                width: "100%",
                maxWidth: "480px",
                boxShadow:
                  "0 25px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset",
                position: "relative",
                zIndex: 2,
                animation: "csms-float 6s ease-in-out infinite",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingBottom: "14px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.78rem",
                    color: "#64748b",
                  }}
                >
                  <Terminal size={14} color="#52c41a" />
                  <span>csms monitor --cluster=prod-us</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.72rem",
                    background: "rgba(82,196,26,0.1)",
                    color: "#52c41a",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#52c41a",
                      boxShadow: "0 0 8px #52c41a",
                      animation: "csms-glow-pulse 2s ease-in-out infinite",
                    }}
                  />
                  Live
                </div>
              </div>

              {/* Server nodes */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {[
                  {
                    name: "app-backend",
                    type: "NodeJS",
                    status: "Healthy",
                    cpu: "14%",
                    ram: "512MB",
                    color: "#52c41a",
                  },
                  {
                    name: "auth-service",
                    type: "Go/gRPC",
                    status: "Healthy",
                    cpu: "4%",
                    ram: "128MB",
                    color: "#52c41a",
                  },
                  {
                    name: "kafka-bus",
                    type: "Streaming",
                    status: "Deploying",
                    cpu: "62%",
                    ram: "2.4GB",
                    color: "#f59e0b",
                  },
                  {
                    name: "mysql-db",
                    type: "Primary",
                    status: "Healthy",
                    cpu: "22%",
                    ram: "4.1GB",
                    color: "#52c41a",
                  },
                ].map((node, i) => (
                  <div
                    key={i}
                    className="csms-card-hover"
                    style={{
                      background: "rgba(6,8,13,0.7)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "14px",
                      cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>
                        {node.name}
                      </div>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: node.color,
                          background: `${node.color}12`,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontWeight: 600,
                        }}
                      >
                        {node.status}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.72rem",
                        color: "#64748b",
                        marginBottom: "10px",
                      }}
                    >
                      <span>
                        CPU{" "}
                        <strong style={{ color: "#cbd5e1" }}>{node.cpu}</strong>
                      </span>
                      <span>
                        RAM{" "}
                        <strong style={{ color: "#cbd5e1" }}>{node.ram}</strong>
                      </span>
                    </div>
                    <svg
                      width="100%"
                      height="24"
                      style={{ overflow: "visible" }}
                    >
                      <defs>
                        <linearGradient
                          id={`grad-${i}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop
                            offset="0%"
                            stopColor={node.color}
                            stopOpacity="0.1"
                          />
                          <stop
                            offset="100%"
                            stopColor={node.color}
                            stopOpacity="0.5"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M0 ${12 + i * 2} Q 30 ${4 + i}, 60 ${14 - i} T 120 ${10 + i} T 180 ${6 + i * 3}`}
                        fill="none"
                        stroke={`url(#grad-${i})`}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Scan line effect */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "5%",
                right: "5%",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, rgba(82,196,26,0.3), transparent)",
                animation: "csms-scan-line 3s linear infinite",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
          </div>
        </section>

        {/* ═══════════ TRUSTED BY — Marquee ═══════════ */}
        <section
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "40px 0",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#475569",
              textAlign: "center",
              marginBottom: "28px",
              fontWeight: 600,
            }}
          >
            Trusted by security-first engineering teams
          </p>
          <div style={{ overflow: "hidden", position: "relative" }}>
            <div
              style={{
                display: "flex",
                gap: "72px",
                animation: "csms-marquee 25s linear infinite",
                width: "max-content",
              }}
            >
              {[
                ...[
                  "BASE 44",
                  "BLACKROCK",
                  "FORTUNE-X",
                  "COMMURE",
                  "METRIC-AI",
                  "DATAVIEW",
                  "NOVA INC",
                  "SENTINEL",
                ],
                ...[
                  "BASE 44",
                  "BLACKROCK",
                  "FORTUNE-X",
                  "COMMURE",
                  "METRIC-AI",
                  "DATAVIEW",
                  "NOVA INC",
                  "SENTINEL",
                ],
              ].map((logo, i) => (
                <span
                  key={i}
                  style={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    letterSpacing: "2px",
                    color: "#334155",
                    whiteSpace: "nowrap",
                    transition: "color 0.3s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#64748b")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#334155")
                  }
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ STATS BAR ═══════════ */}
        <section
          ref={statsRef}
          className="csms-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            padding: "60px 0",
            opacity: statsInView ? 1 : 0,
            transform: statsInView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s",
          }}
        >
          {[
            {
              value: `${eventCount}M+`,
              label: "Events processed daily",
              icon: <Activity size={20} />,
              color: "#52c41a",
            },
            {
              value: `<${latencyCount}ms`,
              label: "Threat response time",
              icon: <Zap size={20} />,
              color: "#f59e0b",
            },
            {
              value: `${uptimeVal}.99%`,
              label: "Platform uptime SLA",
              icon: <TrendingUp size={20} />,
              color: "#38bdf8",
            },
            {
              value: `${teamCount}+`,
              label: "Engineering teams",
              icon: <Users size={20} />,
              color: "#a855f7",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="csms-card-hover"
              style={{
                background: "rgba(15,23,42,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "28px 24px",
                textAlign: "center",
                cursor: "default",
              }}
            >
              <div
                style={{
                  color: stat.color,
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  marginBottom: "4px",
                  background: `linear-gradient(135deg, ${stat.color}, #f1f5f9)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* ═══════════ WORKFLOW STEPS — "Click, protect, comply." ═══════════ */}
        <section
          id="architecture"
          ref={stepsRef}
          style={{
            padding: "80px 0 100px",
            opacity: stepsInView ? 1 : 0,
            transform: stepsInView ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(82,196,26,0.08)",
                border: "1px solid rgba(82,196,26,0.15)",
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                color: "#52c41a",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              <MousePointerClick size={13} /> How it works
            </div>
            <h2
              style={{
                fontSize: "2.6rem",
                fontWeight: 800,
                letterSpacing: "-1.5px",
                marginBottom: "12px",
              }}
            >
              Click, protect, comply.
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "1rem",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              Zero configuration overhead. Ship resilient infrastructure in
              three simple steps.
            </p>
          </div>

          {/* Step tabs */}
          <div
            className="csms-step-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                num: "01",
                title: "Select a target",
                desc: "Choose between VPCs, K8s, containers, or bare-metal.",
                icon: <Globe size={18} />,
              },
              {
                num: "02",
                title: "Attach telemetry",
                desc: "Deploy with one curl command or Helm chart.",
                icon: <Radio size={18} />,
              },
              {
                num: "03",
                title: "CSMS does the rest",
                desc: "Instant heuristics, threat quarantine, and audit trails.",
                icon: <Shield size={18} />,
              },
            ].map((step, idx) => (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{
                  background:
                    activeStep === idx
                      ? "linear-gradient(160deg, rgba(82,196,26,0.08), rgba(15,23,42,0.8))"
                      : "rgba(15,23,42,0.3)",
                  border:
                    activeStep === idx
                      ? "1px solid rgba(82,196,26,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                  padding: "24px",
                  borderRadius: "14px",
                  cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (activeStep !== idx)
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  if (activeStep !== idx)
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.06)";
                }}
              >
                {/* Progress bar for active step */}
                {activeStep === idx && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      height: "2px",
                      background:
                        "linear-gradient(90deg, #52c41a, transparent)",
                      animation: "csms-gradient-shift 5s linear infinite",
                      width: "100%",
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background:
                        activeStep === idx
                          ? "#52c41a"
                          : "rgba(255,255,255,0.04)",
                      color: activeStep === idx ? "#000" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {step.num}
                  </div>
                  <div
                    style={{
                      color: activeStep === idx ? "#52c41a" : "#475569",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {step.icon}
                  </div>
                </div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.83rem",
                    color: "#94a3b8",
                    lineHeight: 1.55,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Workflow panel */}
          <div
            className="csms-workflow-panel"
            style={{
              background:
                "linear-gradient(160deg, rgba(15,23,42,0.6), rgba(6,8,13,0.9))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "36px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "36px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#52c41a",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "2px",
                    background: "#52c41a",
                    display: "inline-block",
                    borderRadius: "1px",
                  }}
                />
                Pipeline Stage 0{activeStep + 1}
              </div>
              <h4
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "14px",
                  letterSpacing: "-0.5px",
                }}
              >
                {activeStep === 0 && "Target Infrastructure Selection"}
                {activeStep === 1 && "Lightweight eBPF Ingestion"}
                {activeStep === 2 && "Autonomous Policy Enforcement"}
              </h4>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  marginBottom: "28px",
                }}
              >
                {activeStep === 0 &&
                  "Select any environment: AWS EKS, Azure AKS, self-hosted Docker instances, or high-throughput MySQL databases."}
                {activeStep === 1 &&
                  "Kernel-level eBPF probes stream logs and telemetry directly to the Kafka bus without degrading application performance."}
                {activeStep === 2 &&
                  "AI heuristic engines isolate zero-day threats within 40ms, producing immutable, auditor-ready compliance logs."}
              </p>

              {/* Feature pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(activeStep === 0
                  ? ["AWS EKS", "Azure AKS", "Docker", "MySQL"]
                  : activeStep === 1
                    ? [
                        "eBPF Probes",
                        "Kafka Bus",
                        "Zero Overhead",
                        "Helm Deploy",
                      ]
                    : [
                        "AI Heuristics",
                        "40ms Response",
                        "Immutable Logs",
                        "SOC 2 Ready",
                      ]
                ).map((pill, i) => (
                  <span
                    key={i}
                    style={{
                      background: "rgba(82,196,26,0.08)",
                      border: "1px solid rgba(82,196,26,0.15)",
                      color: "#a3e635",
                      padding: "5px 12px",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Terminal */}
            <div
              style={{
                background: "#020408",
                borderRadius: "14px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: "0.78rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Terminal dots */}
              <div
                style={{ display: "flex", gap: "6px", marginBottom: "16px" }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ef4444",
                  }}
                />
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#f59e0b",
                  }}
                />
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
              </div>
              <div style={{ color: "#475569", marginBottom: "10px" }}>
                // CSMS Stream Telemetry v2.0
              </div>
              <div style={{ color: "#38bdf8", marginBottom: "4px" }}>
                [INFRA] Ingesting telemetry [k8s-prod-east]...
              </div>
              <div style={{ color: "#52c41a", marginBottom: "4px" }}>
                [OK] eBPF probes hooked to kernel namespaces
              </div>
              <div style={{ color: "#e2e8f0", marginBottom: "4px" }}>
                [AUDIT] Crypto root: 8f9b…a104 generated
              </div>
              <div style={{ color: "#fbbf24", marginBottom: "4px" }}>
                [RULE] Zero-Trust enforcement: active (14 rules)
              </div>
              <div
                style={{
                  color: "#52c41a",
                  marginTop: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle size={13} /> All systems guarded — 0 critical
                vulnerabilities
              </div>

              {/* Scan line in terminal */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "1px",
                  background: "rgba(82,196,26,0.15)",
                  animation: "csms-scan-line 4s linear infinite",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </section>

        {/* ═══════════ BENTO FEATURES GRID ═══════════ */}
        <section
          id="telemetry"
          ref={bentoRef}
          style={{
            paddingBottom: "100px",
            opacity: bentoInView ? 1 : 0,
            transform: bentoInView ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.15)",
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                color: "#38bdf8",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              <Layers size={13} /> Features
            </div>
            <h2
              style={{
                fontSize: "2.6rem",
                fontWeight: 800,
                letterSpacing: "-1.5px",
                marginBottom: "12px",
              }}
            >
              Everything you need to{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #52c41a, #38bdf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                stay secure
              </span>
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "1rem",
                maxWidth: "520px",
                margin: "0 auto",
              }}
            >
              Intuitive controls, real-time insights, and immutable compliance
              out of the box.
            </p>
          </div>

          <div
            className="csms-bento-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {/* Card 1 — Kafka Streaming (wide) */}
            <div
              className="csms-card-hover csms-bento-span2"
              style={{
                gridColumn: "span 2",
                background:
                  "linear-gradient(160deg, rgba(15,23,42,0.6), rgba(6,8,13,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "18px",
                padding: "32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    background: "rgba(82,196,26,0.1)",
                    padding: "8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(82,196,26,0.15)",
                  }}
                >
                  <Activity size={20} color="#52c41a" />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Real-Time Event Streaming
                </h3>
              </div>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.88rem",
                  marginBottom: "24px",
                  maxWidth: "480px",
                  lineHeight: 1.6,
                }}
              >
                High-throughput distributed message bus handling over 24M events
                daily with microsecond latency.
              </p>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.76rem",
                }}
              >
                {[
                  {
                    time: "14:23:01",
                    msg: "SSH attempt blocked from unauthorized IP",
                    status: "Blocked",
                    color: "#f59e0b",
                  },
                  {
                    time: "14:22:45",
                    msg: "MySQL replica snapshot verified",
                    status: "Healthy",
                    color: "#52c41a",
                  },
                  {
                    time: "14:20:10",
                    msg: "CVE scanning completed across 48 pods",
                    status: "Passed",
                    color: "#52c41a",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#475569" }}>
                      <span style={{ color: "#64748b" }}>[{item.time}]</span>{" "}
                      {item.msg}
                    </span>
                    <span
                      style={{
                        color: item.color,
                        fontWeight: 700,
                        background: `${item.color}12`,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "0.68rem",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — Audit */}
            <div
              className="csms-card-hover"
              style={{
                background:
                  "linear-gradient(160deg, rgba(15,23,42,0.6), rgba(6,8,13,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "18px",
                padding: "32px",
              }}
            >
              <div
                style={{
                  background: "rgba(56,189,248,0.1)",
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(56,189,248,0.15)",
                  display: "inline-flex",
                  marginBottom: "16px",
                }}
              >
                <Lock size={20} color="#38bdf8" />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Immutable Audit Trails
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.88rem",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                Cryptographically signed event ledgers for SOC 2 Type II and
                PCI-DSS 4.0.
              </p>
              <div
                style={{
                  background: "rgba(56,189,248,0.06)",
                  border: "1px solid rgba(56,189,248,0.12)",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  color: "#38bdf8",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Fingerprint size={15} />
                SHA-256 Verification Active
              </div>
            </div>

            {/* Card 3 — Zero Day */}
            <div
              className="csms-card-hover"
              style={{
                background:
                  "linear-gradient(160deg, rgba(15,23,42,0.6), rgba(6,8,13,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "18px",
                padding: "32px",
              }}
            >
              <div
                style={{
                  background: "rgba(168,85,247,0.1)",
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(168,85,247,0.15)",
                  display: "inline-flex",
                  marginBottom: "16px",
                }}
              >
                <Cpu size={20} color="#a855f7" />
              </div>
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Zero-Day Heuristics
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                }}
              >
                AI-driven anomaly detection models identify and sandbox threats
                before they spread.
              </p>
            </div>

            {/* Card 4 — Multi-cloud (wide) */}
            <div
              className="csms-card-hover csms-bento-span2"
              style={{
                gridColumn: "span 2",
                background:
                  "linear-gradient(160deg, rgba(15,23,42,0.6), rgba(6,8,13,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "18px",
                padding: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    background: "rgba(82,196,26,0.1)",
                    padding: "8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(82,196,26,0.15)",
                  }}
                >
                  <Cloud size={20} color="#52c41a" />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Multi-Cloud & Hybrid Native
                </h3>
              </div>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.88rem",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                Connect AWS, Azure, GCP, or bare-metal instances under one
                operational command dashboard.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  "AWS EC2",
                  "EKS",
                  "Azure AKS",
                  "MySQL",
                  "Redis",
                  "Docker",
                  "Kubernetes",
                  "Kafka",
                ].map((tech, i) => (
                  <span
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(82,196,26,0.3)";
                      e.currentTarget.style.color = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ CTA SECTION ═══════════ */}
        <section
          id="contactus"
          ref={ctaRef}
          style={{
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(82,196,26,0.08) 0%, rgba(6,8,13,0) 100%)",
            border: "1px solid rgba(82,196,26,0.15)",
            borderRadius: "24px",
            padding: "80px 40px",
            textAlign: "center",
            marginBottom: "100px",
            overflow: "hidden",
            opacity: ctaInView ? 1 : 0,
            transform: ctaInView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Decorative orbiting ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              height: "400px",
              border: "1px solid rgba(82,196,26,0.06)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "600px",
              border: "1px solid rgba(82,196,26,0.03)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(82,196,26,0.1)",
                border: "1px solid rgba(82,196,26,0.2)",
                borderRadius: "14px",
                padding: "12px",
                marginBottom: "24px",
              }}
            >
              <Shield size={28} color="#52c41a" />
            </div>

            <h2
              style={{
                fontSize: "2.8rem",
                fontWeight: 800,
                marginBottom: "16px",
                letterSpacing: "-1px",
              }}
            >
              Start building with{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #52c41a, #38bdf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CSMS
              </span>{" "}
              today
            </h2>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "1.05rem",
                maxWidth: "480px",
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Zero ops, zero surprises. Protect your entire cloud infrastructure
              from code to runtime.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => navigate("/signup")}
                className="csms-btn-primary"
                style={{
                  background: "linear-gradient(135deg, #52c41a, #3da612)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1rem",
                  padding: "15px 36px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Launch Command Center <ArrowRight size={16} />
              </button>
              <button
                className="csms-btn-ghost"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "#e2e8f0",
                  fontWeight: 600,
                  fontSize: "1rem",
                  padding: "15px 28px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ExternalLink size={15} /> Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer
        id="docs"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "64px 0 36px",
            fontSize: "0.85rem",
            color: "#475569",
          }}
        >
          <div
            className="csms-footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "40px",
              marginBottom: "56px",
            }}
          >
            {[
              {
                title: "Product",
                links: [
                  "Infrastructure Telemetry",
                  "Zero-Trust Security",
                  "Audit Logs",
                  "Pricing",
                ],
              },
              {
                title: "Supported Stacks",
                links: [
                  "Kubernetes / Helm",
                  "AWS & Azure",
                  "MySQL Monitoring",
                  "Kafka Streams",
                ],
              },
              {
                title: "Compliance",
                links: [
                  "PCI-DSS 4.0",
                  "SOC 2 Type II",
                  "ISO 27001",
                  "Trust Center",
                ],
              },
              {
                title: "Company",
                links: [
                  "About CSMS",
                  "Careers",
                  "Security Disclosures",
                  "Contact Sales",
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#f1f5f9",
                    marginBottom: "18px",
                    fontSize: "0.88rem",
                  }}
                >
                  {col.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {col.links.map((link, j) => (
                    <a
                      key={j}
                      href="#"
                      style={{
                        color: "#64748b",
                        textDecoration: "none",
                        transition: "color 0.2s ease",
                        fontSize: "0.84rem",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#e2e8f0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#64748b")
                      }
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              paddingTop: "24px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "rgba(82,196,26,0.1)",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={14} color="#52c41a" />
              </div>
              <span style={{ color: "#64748b", fontSize: "0.82rem" }}>
                © 2026 CSMS IMA Platform. All rights reserved.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#52c41a",
                  boxShadow: "0 0 8px #52c41a",
                  animation: "csms-glow-pulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  color: "#52c41a",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                All systems operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
