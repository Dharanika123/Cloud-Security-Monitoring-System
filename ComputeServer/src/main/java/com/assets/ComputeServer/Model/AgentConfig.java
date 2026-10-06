package com.assets.ComputeServer.Model;

import lombok.Data;

@Data
public class AgentConfig {
    private String assetId;
    private String serverUrl;
    private int intervalSeconds;
}