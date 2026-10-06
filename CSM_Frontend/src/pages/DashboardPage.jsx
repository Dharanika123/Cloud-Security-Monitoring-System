import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { DashboardTelemetrySection } from "../components/DashboardTelemetrySection";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  CircularProgress,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Storage as AssetIcon,
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as CriticalIcon,
  CloudOff as OfflineIcon,
  Shield as ShieldIcon,
  BugReport as BugIcon,
  VerifiedUser as ComplianceIcon,
  Speed as RiskIcon,
  History as AuditIcon,
  Memory as CpuIcon,
  Router as NetworkIcon,
  SdStorage as DiskIcon,
  Notifications as BellIcon,
  Add as AddIcon,
  AssignmentTurnedIn as ReportIcon,
  Dns as ServerIcon,
  Cloud as CloudIcon,
  ViewInAr as PodIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { AssetHealthCard } from "../components/AssetHealthCard";

const socTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0A0C10",
      paper: "#171B22",
    },
    primary: { main: "#10B981" },
    secondary: { main: "#3B82F6" },
    error: { main: "#EF4444" },
    warning: { main: "#F59E0B" },
    info: { main: "#3B82F6" },
    success: { main: "#10B981" },
    divider: "#242933",
    text: { primary: "#F5F7FA", secondary: "#8B93A3" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h6: { fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.01em" },
    subtitle2: {
      fontSize: "0.68rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontWeight: 700,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#171B22",
          border: "1px solid #242933",
          borderRadius: 10,
          boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

const SEVERITY_COLORS = {
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#3B82F6",
  LOW: "#10B981",
};

// 11 KPIs covering all statuses from Add Asset dropdown: HEALTHY, WARNING, CRITICAL, OFFLINE + Security metrics
const KPI_DEFS = [
  {
    key: "totalAssets",
    label: "Total Assets",
    icon: AssetIcon,
    color: "#3B82F6",
    link: "/assets",
  },
  {
    key: "healthyAssets",
    label: "Healthy",
    icon: HealthyIcon,
    color: "#10B981",
    link: "/assets",
  },
  {
    key: "warningAssets",
    label: "Warning",
    icon: WarningIcon,
    color: "#F59E0B",
    link: "/assets",
  },
  {
    key: "criticalAssets",
    label: "Critical",
    icon: CriticalIcon,
    color: "#EF4444",
    link: "/assets",
  },
  {
    key: "offlineAssets",
    label: "Offline",
    icon: OfflineIcon,
    color: "#8B93A3",
    link: "/assets",
  },
  {
    key: "activeAlerts",
    label: "Active Alerts",
    icon: BellIcon,
    color: "#F59E0B",
    link: "/alerts",
  },
  {
    key: "activeIncidents",
    label: "Open Incidents",
    icon: WarningIcon,
    color: "#EF4444",
    link: "/incidents",
  },
  {
    key: "criticalVulnerabilities",
    label: "Critical CVEs",
    icon: BugIcon,
    color: "#DC2626",
    link: "/vulnerabilities",
  },
  {
    key: "overallRiskScore",
    label: "Risk Score",
    icon: RiskIcon,
    color: "#F59E0B",
    suffix: "/100",
  },
  {
    key: "compliancePercentage",
    label: "Compliance",
    icon: ComplianceIcon,
    color: "#10B981",
    suffix: "%",
    link: "/compliance",
  },
  {
    key: "auditLogsToday",
    label: "Audit Logs",
    icon: AuditIcon,
    color: "#8B93A3",
    link: "/audit",
  },
];

const QUICK_ACTIONS = [
  { label: "Add Asset", act: "ADD_ASSET", icon: AddIcon, color: "#3B82F6" },
  {
    label: "Check Incidents",
    act: "CREATE_INCIDENT",
    icon: WarningIcon,
    color: "#F59E0B",
  },
  { label: "Run Scan", act: "RUN_TRIVY", icon: BugIcon, color: "#EF4444" },
  {
    label: "Generate Report",
    act: "GENERATE_REPORT",
    icon: ReportIcon,
    color: "#8B93A3",
  },
  {
    label: "Check Compliance",
    act: "CHECK_COMPLIANCE",
    icon: ComplianceIcon,
    color: "#10B981",
    adminOnly: true,
  },
  {
    label: "View Alerts",
    act: "VIEW_ALERTS",
    icon: BellIcon,
    color: "#F59E0B",
  },
  {
    label: "View Vulnerabilities",
    act: "VIEW_VULNERABILITIES",
    icon: ShieldIcon,
    color: "#EF4444",
  },
  {
    label: "Audit Trail",
    act: "VIEW_AUDIT_TRAIL",
    icon: AuditIcon,
    color: "#3B82F6",
    adminOnly: true,
  },
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "ADMIN";
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchSocData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [socRes, chartRes] = await Promise.all([
        API.get("/api/dashboard/soc-overview"),
        API.get("/api/dashboard/charts"),
      ]);
      setData(socRes.data);

      const formattedCharts = (chartRes.data || []).map((item) => ({
        ...item,
        formattedTime: item.timestamp
          ? new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      }));
      setCharts(formattedCharts);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("SOC Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (actionType) => {
    setActionLoading(true);
    try {
      switch (actionType) {
        case "ADD_ASSET":
          navigate("/assets");
          break;
        case "CREATE_INCIDENT":
          navigate("/incidents");
          break;
        case "RUN_TRIVY":
          try {
            await API.post("/api/v1/vulnerabilities/scan/trivy");
          } catch (e) {
            await API.post("/api/vulnerabilities/scan/trivy");
          }
          setToast({
            open: true,
            message: "Trivy fleet vulnerability scan completed successfully! Scanned all infrastructure assets.",
            severity: "success",
          });
          await fetchSocData(true);
          await fetchAuditLogs(true);
          break;
        case "GENERATE_REPORT":
          navigate("/reports");
          break;
        case "CHECK_COMPLIANCE":
          navigate("/compliance");
          break;
        case "VIEW_ALERTS":
          navigate("/alerts");
          break;
        case "VIEW_VULNERABILITIES":
          navigate("/vulnerabilities");
          break;
        case "VIEW_AUDIT_TRAIL":
          navigate("/audit");
          break;
        default:
          break;
      }
    } catch (err) {
      setToast({
        open: true,
        message:
          err.response?.data?.message ||
          "Failed to execute action. Please verify network.",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getThreatColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return "#EF4444";
      case "HIGH":
        return "#F59E0B";
      case "MEDIUM":
        return "#3B82F6";
      default:
        return "#10B981";
    }
  };

  const visibleQuickActions = QUICK_ACTIONS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  const resourceUsage = [
    {
      label: "CPU Usage",
      val: Math.round(data?.resourceSummary?.cpuUsage ?? 0),
      icon: <CpuIcon fontSize="small" />,
    },
    {
      label: "Memory Usage",
      val: Math.round(data?.resourceSummary?.memoryUsage ?? 0),
      icon: <AssetIcon fontSize="small" />,
    },
    {
      label: "Disk Usage",
      val: Math.round(data?.resourceSummary?.diskUsage ?? 0),
      icon: <DiskIcon fontSize="small" />,
    },
    {
      label: "Network Usage",
      val: Math.round(data?.resourceSummary?.networkUsage ?? 0),
      icon: <NetworkIcon fontSize="small" />,
    },
  ];

  const securityScore = data?.securityScore ?? 100;

  const fetchAuditLogs = async (isBackground = false) => {
    if (!isBackground) setLoadingLogs(true);
    try {
      const res = await API.get("/api/dashboard/auditLogs-summary");
      setAuditLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs summary:", err);
    } finally {
      if (!isBackground) setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSocData(false);
    fetchAuditLogs(false);

    const interval = setInterval(() => {
      fetchSocData(true);
      fetchAuditLogs(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const formatLogTime = (isoString) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "--:--";
    }
  };

  // Construct Pie Data for Asset Health accurately from database
  const totalAssetsCount = data?.totalAssets ?? 0;
  const healthyCount = data?.healthyAssets ?? 0;
  const warningCount = data?.warningAssets ?? 0;
  const criticalCount = data?.criticalAssets ?? 0;
  const offlineCount =
    data?.offlineAssets ??
    Math.max(0, totalAssetsCount - healthyCount - criticalCount - warningCount);

  const rawAssetHealth = [
    { name: "HEALTHY", value: healthyCount, color: "#10B981" },
    { name: "WARNING", value: warningCount, color: "#F59E0B" },
    { name: "CRITICAL", value: criticalCount, color: "#EF4444" },
    { name: "OFFLINE", value: offlineCount, color: "#6B7280" },
  ];
  const assetHealthData =
    totalAssetsCount === 0
      ? [{ name: "NO ASSETS", value: 1, color: "#374151" }]
      : rawAssetHealth.filter((item) => item.value > 0);

  return (
    <ThemeProvider theme={socTheme}>
      <CssBaseline />
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          backgroundColor: "background.default",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}
            >
              Security Operations Center
            </Typography>
            <Chip
              label={`Threat Level: ${data?.threatLevel || "LOW"}`}
              size="small"
              sx={{
                backgroundColor: `${getThreatColor(data?.threatLevel)}22`,
                color: getThreatColor(data?.threatLevel),
                border: `1px solid ${getThreatColor(data?.threatLevel)}55`,
                fontWeight: 700,
                fontSize: "0.7rem",
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Last refresh: {lastRefreshed.toLocaleTimeString()}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => {
                fetchSocData();
                fetchAuditLogs();
              }}
              sx={{
                borderColor: "divider",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  backgroundColor: "rgba(16,185,129,0.08)",
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* 12 KPI CARDS - ALL ASSET STATUSES & SECURITY METRICS */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: 1.5,
            mb: 3,
            width: "100%",
          }}
        >
          {KPI_DEFS.map((kpi) => {
            const Icon = kpi.icon;
            const rawVal = data?.[kpi.key];
            const displayVal = loading
              ? null
              : rawVal !== undefined && rawVal !== null
                ? `${rawVal}${kpi.suffix || ""}`
                : "0";
            return (
              <Box
                key={kpi.key}
                onClick={() => kpi.link && navigate(kpi.link)}
                sx={{
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 80,
                  cursor: kpi.link ? "pointer" : "default",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  "&:hover": {
                    borderColor: `${kpi.color}77`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                    }}
                    noWrap
                  >
                    {kpi.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${kpi.color}1F`,
                      color: kpi.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>
                {loading ? (
                  <Skeleton
                    variant="text"
                    width="55%"
                    height={28}
                    sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "1.35rem",
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {displayVal}
                  </Typography>
                )}
              </Box>
            );
          })}

          {/* 12th Card: Last Scan */}
          {[{ label: "LAST FLEET SCAN", val: data?.lastTrivyScan ? new Date(data.lastTrivyScan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Completed", icon: BugIcon }].map((s) => {
            const Icon = s.icon;
            return (
              <Box
                key={s.label}
                onClick={() => handleQuickAction("RUN_TRIVY")}
                sx={{
                  backgroundColor: "background.paper",
                  border: "1px dashed",
                  borderColor: "primary.main",
                  borderRadius: 2.5,
                  p: 1.5,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 80,
                  cursor: "pointer",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                  "&:hover": {
                    borderColor: "primary.light",
                    transform: "translateY(-2px)",
                  },
                }}
                title="Click to run fresh Trivy fleet vulnerability scan"
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "primary.main",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                    }}
                    noWrap
                  >
                    {s.label}
                  </Typography>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(16,185,129,0.12)",
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.25rem",
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {s.val}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* ASSET FLEET BREAKDOWN BY TYPE (MATCHING ADD ASSET DROPDOWN OPTIONS) */}
        <Card sx={{ mb: 2, width: "100%" }}>
          <CardContent sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  Monitored Infrastructure Fleet (Asset Types)
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
                  Active workload breakdown corresponding to registered asset platforms
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => navigate("/assets")}
                sx={{
                  borderColor: "divider",
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  "&:hover": { borderColor: "primary.main", color: "primary.main" },
                }}
              >
                Register New Asset
              </Button>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {[
                { label: "Baremetal / VMs", type: "SERVER", count: data?.serverAssets || 0, color: "#3B82F6", icon: ServerIcon },
                { label: "AWS Cloud Instances", type: "CLOUD_AWS", count: data?.awsAssets || 0, color: "#F59E0B", icon: CloudIcon },
                { label: "Azure Cloud Instances", type: "CLOUD_AZURE", count: data?.azureAssets || 0, color: "#0078D4", icon: CloudIcon },
                { label: "Kubernetes Pods", type: "K8S_POD", count: data?.k8sAssets || 0, color: "#10B981", icon: PodIcon },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Box
                    key={item.type}
                    onClick={() => navigate("/assets")}
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.015)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                      transition: "transform 0.15s ease, border-color 0.15s ease",
                      "&:hover": {
                        borderColor: `${item.color}77`,
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${item.color}1F`,
                        color: item.color,
                        flexShrink: 0,
                      }}
                    >
                      <ItemIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", fontSize: "0.72rem" }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#fff", lineHeight: 1.1 }}>
                        {item.count}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* INFRASTRUCTURE OVERVIEW */}
        <Card sx={{ mb: 2, width: "100%" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Infrastructure Overview
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
                width: "100%",
              }}
            >
              {resourceUsage.map((res, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.015)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mb: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ color: "text.secondary", display: "flex" }}>
                      {res.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.78rem" }}
                    >
                      {res.label}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {res.val}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={res.val}
                    sx={{
                      mt: 1,
                      height: 5,
                      borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        backgroundColor:
                          res.val > 80
                            ? "#EF4444"
                            : res.val > 50
                              ? "#F59E0B"
                              : "#10B981",
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* SINGLE ROW: SECURITY SCORE, ASSET HEALTH PIE CHART & TELEMETRY TREND */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 2.2fr" },
            gap: 2,
            mb: 2,
            width: "100%",
            alignItems: "stretch",
            minHeight: 280,
          }}
        >
          {/* Overall Security Score Card */}
          <Card
            elevation={0}
            sx={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#11161d",
              color: "#ffffff",
              borderRadius: 2,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    color: "#f3f4f6",
                  }}
                >
                  Overall Security Score
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#9ca3af", fontSize: "0.825rem" }}
                >
                  Automated risk evaluation
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", my: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={110}
                    thickness={5}
                    sx={{
                      color: "rgba(255,255,255,0.06)",
                      position: "absolute",
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={securityScore}
                    size={110}
                    thickness={5}
                    sx={{
                      color:
                        securityScore > 70
                          ? "#10B981"
                          : securityScore > 40
                            ? "#F59E0B"
                            : "#EF4444",
                      "& .MuiCircularProgress-circle": {
                        strokeLinecap: "round",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" fontWeight={800} color="#ffffff">
                      {securityScore}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6b7280", fontSize: "0.75rem" }}
                    >
                      / 100
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.75rem",
                  textAlign: "center",
                  px: 1,
                }}
              >
                Calculated from vulnerabilities & incident SLA times
              </Typography>
            </CardContent>
          </Card>

          {/*Asset Health Donut Chart with all 4 statuses */}
          <AssetHealthCard
            assetHealthData={assetHealthData}
            totalAssetsCount={totalAssetsCount}
          />

          {/* Performance Telemetry Trend Chart */}
          <DashboardTelemetrySection charts={charts} loading={loading} />
        </Box>

        {/* OPERATIONS, COMPLIANCE & TOP CRITICAL CVEs */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1.3fr" },
            gap: 2,
            mb: 2,
            width: "100%",
          }}
        >
          {/* Quick Operations Hub */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Quick Operations Hub
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1,
                }}
              >
                {visibleQuickActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.act}
                      disabled={actionLoading}
                      onClick={() => handleQuickAction(item.act)}
                      sx={{
                        justifyContent: "flex-start",
                        gap: 1,
                        py: 0.9,
                        px: 1.2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "rgba(255,255,255,0.015)",
                        color: "text.primary",
                        fontSize: "0.8rem",
                        "&:hover": {
                          borderColor: `${item.color}66`,
                          backgroundColor: `${item.color}14`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${item.color}1F`,
                          color: item.color,
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 13 }} />
                      </Box>
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          {/* Compliance Audits */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6">
                  Compliance Audits
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => navigate("/compliance")}
                  sx={{ color: "primary.main", fontSize: "0.75rem", p: 0 }}
                >
                  View Details
                </Button>
              </Box>
              {data?.complianceSummary?.map((comp, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 1,
                    p: 1.2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.015)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {comp.framework}
                    </Typography>
                    <Chip
                      label={comp.status}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.6rem",
                        backgroundColor:
                          comp.status === "PASS" || comp.status === "COMPLIANT"
                            ? "rgba(16,185,129,0.16)"
                            : "rgba(239,68,68,0.16)",
                        color:
                          comp.status === "PASS" || comp.status === "COMPLIANT"
                            ? "#34d399"
                            : "#f87171",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Controls passed: {comp.passedControls}/{comp.totalControls}{" "}
                    ({comp.scorePercentage}%)
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Top Critical Vulnerabilities (Clear details with Title, Severity, Servers, Action) */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: "0.95rem", fontWeight: 700 }}>
                    Active Critical Vulnerabilities
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                    Unpatched CVEs discovered by scanner
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate("/vulnerabilities")}
                  sx={{ borderColor: "divider", color: "text.secondary", fontSize: "0.72rem" }}
                >
                  Manage CVEs
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        CVE & Description
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        CVSS
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          p: "4px 6px",
                          borderColor: "divider",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          textAlign: "right",
                        }}
                      >
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.topCriticalCVEs?.length > 0 ? (
                      data.topCriticalCVEs.map((cve) => (
                        <TableRow key={cve.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate("/vulnerabilities")}>
                          <TableCell
                            sx={{
                              p: "6px",
                              borderColor: "divider",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.72rem",
                                  fontFamily: "JetBrains Mono, monospace",
                                  color: "#EF4444",
                                }}
                              >
                                {cve.cveId}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: "0.7rem",
                                color: "text.secondary",
                                maxWidth: 190,
                              }}
                              noWrap
                              title={cve.title}
                            >
                              {cve.title || "Critical Security Flaw"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{
                              p: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              borderColor: "divider",
                            }}
                          >
                            {cve.cvssScore}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: "6px",
                              fontSize: "0.7rem",
                              borderColor: "divider",
                            }}
                          >
                            <Chip
                              label={cve.patchStatus}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.6rem",
                                backgroundColor:
                                  cve.patchStatus === "PATCHED"
                                    ? "rgba(16,185,129,0.16)"
                                    : "rgba(239,68,68,0.16)",
                                color:
                                  cve.patchStatus === "PATCHED"
                                    ? "#34d399"
                                    : "#f87171",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ p: "6px", borderColor: "divider", textAlign: "right" }}>
                            <Button
                              size="small"
                              variant="text"
                              sx={{ fontSize: "0.7rem", p: "2px 6px", color: "primary.main", fontWeight: 700 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/vulnerabilities");
                              }}
                            >
                              Patch
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            color: "text.secondary",
                            py: 2,
                            borderColor: "divider",
                          }}
                        >
                          No active critical CVEs detected
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* AUDIT TIMELINE */}
        <Card sx={{ width: "100%", mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography
                variant="h6"
                sx={{ fontSize: "1.05rem", fontWeight: 700 }}
              >
                Live Security Audit Trail
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() => navigate("/audit")}
                sx={{ color: "primary.main", fontSize: "0.75rem", p: 0 }}
              >
                View Full Audit Logs
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
                width: "100%",
              }}
            >
              {loadingLogs ? (
                [...Array(4)].map((_, idx) => (
                  <Skeleton
                    key={idx}
                    variant="rounded"
                    height={68}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.03)",
                      borderRadius: 1.5,
                    }}
                  />
                ))
              ) : auditLogs.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ gridColumn: "1 / -1", py: 1 }}
                >
                  No recent audit logs recorded.
                </Typography>
              ) : (
                auditLogs.slice(0, 4).map((log, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.25,
                      borderLeft: "3px solid",
                      borderColor: "primary.main",
                      bgcolor: "rgba(255,255,255,0.015)",
                      borderRadius: 1.5,
                      borderTop: "1px solid #242933",
                      borderRight: "1px solid #242933",
                      borderBottom: "1px solid #242933",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "JetBrains Mono, monospace",
                          color: "primary.main",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatLogTime(log.timestamp)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.68rem",
                          color: "text.secondary",
                          noWrap: true,
                          maxWidth: "110px",
                        }}
                        title={log.userEmail}
                      >
                        {log.userEmail}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.8rem",
                        mt: 0.5,
                        fontWeight: 500,
                        color: "#fff",
                      }}
                      noWrap
                      title={log.action}
                    >
                      {log.action}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>

        <ActivityHeatmap days={365} />

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast({ ...toast, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={toast.severity}
            sx={{ width: "100%" }}
            onClose={() => setToast({ ...toast, open: false })}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};
