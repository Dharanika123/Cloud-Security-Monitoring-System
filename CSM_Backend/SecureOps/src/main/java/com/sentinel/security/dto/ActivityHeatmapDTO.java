package com.sentinel.security.dto;

import java.util.List;

public class ActivityHeatmapDTO {
    private List<DailyActivityDTO> data;
    private long maxCount;
    private long totalCount;
    private double trendPercentage; // vs previous period
    private int currentStreak;

    public ActivityHeatmapDTO(List<DailyActivityDTO> data, long maxCount,
                              long totalCount, double trendPercentage, int currentStreak) {
        this.data = data;
        this.maxCount = maxCount;
        this.totalCount = totalCount;
        this.trendPercentage = trendPercentage;
        this.currentStreak = currentStreak;
    }

    public List<DailyActivityDTO> getData() { return data; }
    public long getMaxCount() { return maxCount; }
    public long getTotalCount() { return totalCount; }
    public double getTrendPercentage() { return trendPercentage; }
    public int getCurrentStreak() { return currentStreak; }
}