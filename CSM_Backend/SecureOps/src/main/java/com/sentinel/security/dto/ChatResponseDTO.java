package com.sentinel.security.dto;

public class ChatResponseDTO {
    private String reply;
    private boolean actionRequired;
    private String suggestedAction;

    public ChatResponseDTO() {}
    public ChatResponseDTO(String reply) {
        this.reply = reply;
    }
    public ChatResponseDTO(String reply, boolean actionRequired, String suggestedAction) {
        this.reply = reply;
        this.actionRequired = actionRequired;
        this.suggestedAction = suggestedAction;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    public boolean isActionRequired() { return actionRequired; }
    public void setActionRequired(boolean actionRequired) { this.actionRequired = actionRequired; }
    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
}
