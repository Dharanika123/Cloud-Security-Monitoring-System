import React from "react";
import { Box, Card, CardContent, Typography, keyframes } from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

// Keyframe animation for the diagonal sweep shimmer effect
const sweepAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// Mock static skeleton data to render the base wave inside Recharts
const SKELETON_DATA = [
  { time: "1", val: 35 },
  { time: "2", val: 65 },
  { time: "3", val: 40 },
  { time: "4", val: 80 },
  { time: "5", val: 30 },
  { time: "6", val: 70 },
  { time: "7", val: 45 },
  { time: "8", val: 85 },
  { time: "9", val: 50 },
];

const SkeletonLineChart = () => (
  <Box
    sx={{
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      borderRadius: 1,
    }}
  >
    {/* Base Native Recharts Line as Skeleton */}
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={SKELETON_DATA} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255, 255, 255, 0.05)"
          vertical={false}
        />
        <XAxis dataKey="time" hide />
        <YAxis domain={[0, 100]} hide />
        <Line
          type="monotone"
          dataKey="val"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={3}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>

    {/* Strictly Bounded Shimmer Sweep Overlay */}
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)",
          animation: `${sweepAnimation} 1.8s infinite linear`,
        }}
      />
    </Box>

    {/* Center Loading Badge */}
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "#ffffff",
          fontWeight: 600,
          fontSize: "0.825rem",
          letterSpacing: "0.02em",
          backgroundColor: "#18181b",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          px: 1.8,
          py: 0.5,
          borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
      >
        Loading
      </Typography>
    </Box>
  </Box>
);

// Custom Floating Tooltip matching BKLIT design
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: "#18181b",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "8px",
          p: 1.5,
          minWidth: 150,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#ffffff", fontWeight: 600, display: "block", mb: 1, fontSize: "0.78rem" }}
        >
          {label}
        </Typography>
        {payload.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: index !== payload.length - 1 ? 0.5 : 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: item.color,
                }}
              />
              <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                {item.name}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem", ml: 2 }}
            >
              {item.value}%
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

export const DashboardTelemetrySection = ({ charts = [], loading = false }) => {
  return (
    <Card
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#11161d",
        color: "#ffffff",
        borderRadius: 2,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        width: "100%",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", color: "#f3f4f6" }}>
          Performance Telemetry Trend
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af", fontSize: "0.825rem", mb: 2 }}>
          Real-time operations & load metrics
        </Typography>

        <Box sx={{ flex: 1, minHeight: 180, width: "100%", position: "relative" }}>
          {loading ? (
            <SkeletonLineChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "rgba(255, 255, 255, 0.2)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="cpuUsage"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#818cf8", stroke: "#ffffff", strokeWidth: 2 }}
                  name="CPU %"
                />
                <Line
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#94a3b8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#94a3b8", stroke: "#ffffff", strokeWidth: 2 }}
                  name="Memory %"
                />
                <Line
                  type="monotone"
                  dataKey="networkUsage"
                  stroke="#475569"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#475569", stroke: "#ffffff", strokeWidth: 2 }}
                  name="Network %"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};