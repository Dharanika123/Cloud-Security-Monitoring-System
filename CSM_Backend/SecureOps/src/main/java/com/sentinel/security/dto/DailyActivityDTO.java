package com.sentinel.security.dto;

public class DailyActivityDTO {
    private String date;   // yyyy-MM-dd
    private long count;
    private int level;     // 0-4 intensity bucket

    public DailyActivityDTO(String date, long count, int level) {
        this.date = date;
        this.count = count;
        this.level = level;
    }

    public String getDate() { return date; }
    public long getCount() { return count; }
    public int getLevel() { return level; }
}