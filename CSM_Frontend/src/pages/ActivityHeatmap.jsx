import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Tooltip as MuiTooltip,
} from "@mui/material";
import { TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon } from "@mui/icons-material";
import API from "../services/api";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const LEVEL_COLORS = {
  0: "rgba(255, 255, 255, 0.08)",
  1: "rgba(255, 255, 255, 0.25)",
  2: "rgba(255, 255, 255, 0.50)",
  3: "rgba(255, 255, 255, 0.75)",
  4: "#FFFFFF",
};

// Map count ranges: 0 -> 3 -> 5 -> 10 -> 15
function getLevelFromCount(count = 0) {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4; // 15+
}

function parseUTCDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function buildWeeks(days) {
  if (!days || days.length === 0) return [];

  const byDate = {};
  days.forEach((d) => (byDate[d.date] = d));

  const firstStr = days[0].date;
  const lastStr = days[days.length - 1].date;

  const first = parseUTCDate(firstStr);
  const last = parseUTCDate(lastStr);

  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const weeks = [];
  let cursor = new Date(gridStart);

  while (cursor.getTime() <= last.getTime()) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const inRange = cursor.getTime() >= first.getTime() && cursor.getTime() <= last.getTime();
      const entry = byDate[key];
      const count = entry?.count ?? 0;

      week.push({
        date: key,
        dateObj: new Date(cursor),
        count: count,
        level: inRange ? (entry?.level ?? getLevelFromCount(count)) : -1,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function buildLabels(weeks) {
  const monthLabels = [];
  const quarterGapIndices = new Set();
  let lastMonthKey = null;
  let lastQuarterKey = null;

  weeks.forEach((week, idx) => {
    const rep = week[3]?.dateObj || week[0].dateObj;
    const monthKey = `${rep.getUTCFullYear()}-${rep.getUTCMonth()}`;
    const quarter = Math.floor(rep.getUTCMonth() / 3) + 1;
    const quarterKey = `${rep.getUTCFullYear()}-Q${quarter}`;

    if (monthKey !== lastMonthKey) {
      monthLabels.push({
        weekIndex: idx,
        label: rep.toLocaleString("default", { month: "short", timeZone: "UTC" }),
      });
      lastMonthKey = monthKey;
    }

    if (quarterKey !== lastQuarterKey) {
      if (lastQuarterKey !== null) quarterGapIndices.add(idx);
      lastQuarterKey = quarterKey;
    }
  });

  return { monthLabels, quarterGapIndices };
}

function buildQuarterHeader(weeks) {
  const labels = [];
  let lastQuarterKey = null;
  weeks.forEach((week, idx) => {
    const rep = week[3]?.dateObj || week[0].dateObj;
    const quarter = Math.floor(rep.getUTCMonth() / 3) + 1;
    const quarterKey = `${rep.getUTCFullYear()}-Q${quarter}`;
    if (quarterKey !== lastQuarterKey) {
      labels.push({ weekIndex: idx, label: `Q${quarter}` });
      lastQuarterKey = quarterKey;
    }
  });
  return labels;
}

export const ActivityHeatmap = ({ days = 365, refreshKey = 0, pollInterval = 10000 }) => {
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await API.get("/api/dashboard/activity-heatmap", {
          params: { days },
        });
        if (!cancelled) {
          setHeatmap(res.data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch activity heatmap:", err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled && !isBackground) setLoading(false);
      }
    };

    fetchData(false);

    let timer = null;
    if (pollInterval > 0) {
      timer = setInterval(() => fetchData(true), pollInterval);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [days, refreshKey, pollInterval]);

  const weeks = useMemo(() => buildWeeks(heatmap?.data ?? []), [heatmap]);
  const { monthLabels, quarterGapIndices } = useMemo(() => buildLabels(weeks), [weeks]);
  const quarterLabels = useMemo(() => buildQuarterHeader(weeks), [weeks]);

  const monthLabelByIndex = useMemo(() => {
    const m = {};
    monthLabels.forEach((l) => (m[l.weekIndex] = l.label));
    return m;
  }, [monthLabels]);

  const quarterLabelByIndex = useMemo(() => {
    const m = {};
    quarterLabels.forEach((l) => (m[l.weekIndex] = l.label));
    return m;
  }, [quarterLabels]);

  const trend = heatmap?.trendPercentage ?? 0;
  const trendUp = trend >= 0;

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        backgroundColor: "#11161d",
        color: "#ffffff",
        borderRadius: 2,
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", color: "#f3f4f6" }}>
          Activity Heatmap
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af", fontSize: "0.825rem", mb: 2.5 }}>
          Your daily operations over the last {days} days
        </Typography>

        {loading ? (
          <Skeleton variant="rounded" height={160} sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2 }} />
        ) : error ? (
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            Couldn't load activity data.
          </Typography>
        ) : weeks.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            No activity recorded yet.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <Box sx={{ display: "flex", width: "100%" }}>
              {/* Day Labels Column */}
              <Box sx={{ display: "flex", flexDirection: "column", mr: 1, flexShrink: 0 }}>
                <Box sx={{ height: 18 }} />
                <Box sx={{ height: 18 }} />
                {DAY_LABELS.map((d, i) => (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      mb: "2px",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "#6b7280", width: 10 }}>
                      {d}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Weeks Grid */}
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                {/* Quarter Row */}
                <Box sx={{ display: "flex", height: 18 }}>
                  {weeks.map((_, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        flex: 1,
                        ml: quarterGapIndices.has(idx) ? "10px" : 0,
                        mr: "2px",
                        position: "relative",
                      }}
                    >
                      {quarterLabelByIndex[idx] && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.65rem",
                            color: "#6b7280",
                            fontWeight: 500,
                            position: "absolute",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {quarterLabelByIndex[idx]}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Month Row */}
                <Box sx={{ display: "flex", height: 18, mb: 0.5 }}>
                  {weeks.map((_, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        flex: 1,
                        ml: quarterGapIndices.has(idx) ? "10px" : 0,
                        mr: "2px",
                        position: "relative",
                      }}
                    >
                      {monthLabelByIndex[idx] && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.7rem",
                            color: "#9ca3af",
                            fontWeight: 500,
                            position: "absolute",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {monthLabelByIndex[idx]}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Cells Grid */}
                <Box sx={{ display: "flex", width: "100%" }}>
                  {weeks.map((week, wIdx) => {
                    const isQuarterBoundary = quarterGapIndices.has(wIdx);
                    return (
                      <Box
                        key={wIdx}
                        sx={{
                          flex: 1,
                          ml: isQuarterBoundary ? "10px" : 0,
                          mr: "2px",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                        }}
                      >
                        {/* Quarter Vertical Line */}
                        {isQuarterBoundary && (
                          <Box
                            sx={{
                              position: "absolute",
                              left: "-5px",
                              top: -20,
                              bottom: 0,
                              width: "1px",
                              backgroundColor: "rgba(255, 255, 255, 0.08)",
                            }}
                          />
                        )}

                        {week.map((day, dIdx) => {
                          const isPadding = day.level === -1;
                          const isHighlighted = hoveredLevel === null || day.level === hoveredLevel;
                          const opacity = isHighlighted ? 1 : 0.2;

                          const color = isPadding
                            ? "transparent"
                            : LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0];

                          const cell = (
                            <Box
                              sx={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                mb: "2px",
                                borderRadius: "50%",
                                backgroundColor: color,
                                opacity: opacity,
                                transition: "all 0.12s ease-in-out",
                                cursor: isPadding ? "default" : "pointer",
                                "&:hover": isPadding
                                  ? {}
                                  : { transform: "scale(1.25)", zIndex: 2 },
                              }}
                            />
                          );

                          if (isPadding) return <Box key={dIdx}>{cell}</Box>;

                          return (
                            <MuiTooltip
                              key={dIdx}
                              title={`${day.count} action${day.count === 1 ? "" : "s"} on ${parseUTCDate(day.date).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                timeZone: "UTC",
                              })}`}
                              arrow
                              slotProps={{
                                tooltip: { sx: { bgcolor: "#1f2937", borderRadius: 1, fontSize: "0.75rem" } },
                                arrow: { sx: { color: "#1f2937" } },
                              }}
                            >
                              {cell}
                            </MuiTooltip>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Legend */}
        {!loading && !error && weeks.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, mt: 3 }}>
            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.72rem" }}>
              Less
            </Typography>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <Box
                key={lvl}
                onMouseEnter={() => setHoveredLevel(lvl)}
                onMouseLeave={() => setHoveredLevel(null)}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: LEVEL_COLORS[lvl],
                  cursor: "pointer",
                  transition: "transform 0.1s ease",
                  "&:hover": { transform: "scale(1.25)" },
                }}
              />
            ))}
            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.72rem" }}>
              More
            </Typography>
          </Box>
        )}

        {/* Trend Footer */}
        {!loading && !error && heatmap && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.5 }}>
            {trendUp ? (
              <TrendUpIcon sx={{ fontSize: 16, color: "#10B981" }} />
            ) : (
              <TrendDownIcon sx={{ fontSize: 16, color: "#EF4444" }} />
            )}
            <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.78rem" }}>
              Trending {trendUp ? "up" : "down"} by {Math.abs(trend)}% this month ·{" "}
              {heatmap.totalCount} total actions · {heatmap.currentStreak}-day streak
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};