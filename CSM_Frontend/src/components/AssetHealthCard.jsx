import React, { useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  ResponsiveContainer,
} from "recharts";

// Custom Active Shape with expanding grow hover effect
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6} // Expands smoothly on hover
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const AssetHealthCard = ({ assetHealthData, totalAssetsCount }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const displayValue =
    activeIndex !== null ? assetHealthData[activeIndex]?.value : totalAssetsCount;
  const displayLabel =
    activeIndex !== null ? assetHealthData[activeIndex]?.name : "Total Assets";

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
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", color: "#f3f4f6" }}>
            Asset Health Status
          </Typography>
          <Typography variant="body2" sx={{ color: "#9ca3af", fontSize: "0.825rem" }}>
            Infrastructure breakdown
          </Typography>
        </Box>

        <Box sx={{ position: "relative", width: "100%", height: 140, my: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Pie
                data={assetHealthData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={54}
                stroke="none"
                paddingAngle={3}
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {assetHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: "none" }} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>

          {/* Dynamic Donut Center Text */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.25rem", lineHeight: 1, color: "#ffffff" }}>
              {displayValue}
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.68rem", mt: 0.3 }}>
              {displayLabel}
            </Typography>
          </Box>
        </Box>

        {/* Legend Row */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, pt: 1 }}>
          {assetHealthData.map((item, idx) => (
            <Box
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                opacity: activeIndex === null || activeIndex === idx ? 1 : 0.4,
                transition: "opacity 0.15s ease",
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color }} />
              <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#9ca3af" }}>
                {item.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};