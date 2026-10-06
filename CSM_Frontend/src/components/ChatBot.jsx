import React, { useState, useRef, useEffect, useContext } from "react";
import {
  X,
  Send,
  Shield,
  RotateCcw,
  ChevronRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { formatDisplayName } from "../utils/userUtils";

const QUICK_PROMPTS = [
  "How to create an asset?",
  "How many assets are critical?",
  "What is an Incident & SLA?",
  "What is the CPU status of SRV-PROD-01?",
  "How many AWS cloud assets are present?",
];

export default function ChatBot({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { role: "user", content: query };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await API.post(
        "/api/chat",
        {
          message: query,
          history: updatedMessages.slice(-6),
        }
      );

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "⚠️ **Connection Error**: Unable to reach CSMS AI Gateway. Please check your backend connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <aside
      style={{
        width: "380px",
        height: "100vh",
        backgroundColor: "#0D0F12",
        borderLeft: "1px solid #242933",
        display: "flex",
        flexDirection: "column",
        color: "#F5F7FA",
        position: "fixed",
        right: 0,
        top: 0,
        zIndex: 1000,
        boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
        transition: "transform 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 18px 8px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          backgroundColor: "#0D0F12",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleClear}
            title="Reset Chat"
            style={{
              background: "transparent",
              border: "none",
              color: "#8B93A3",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B93A3")}
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onClose}
            title="Close Panel"
            style={{
              background: "transparent",
              border: "none",
              color: "#8B93A3",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8B93A3")}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          backgroundColor: "#0D0F12",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ margin: "auto 0", padding: "0 4px" }}>
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "#10B981",
                  lineHeight: 1.3,
                }}
              >
                Hello, {user ? formatDisplayName(user.username) : "Security Operator"}
              </div>
              <div
                style={{
                  fontSize: "1.15rem",
                  color: "#F1F5F9",
                  fontWeight: 600,
                  marginTop: "6px",
                  lineHeight: 1.35,
                }}
              >
                How can I assist your operations today?
              </div>
            </div>

            {/* Quick Prompt Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#171B22",
                    border: "1px solid #242933",
                    color: "#CBD5E1",
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#10B981";
                    e.currentTarget.style.backgroundColor = "#1C222D";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#242933";
                    e.currentTarget.style.backgroundColor = "#171B22";
                  }}
                >
                  <span>{prompt}</span>
                  <ChevronRight size={14} color="#64748B" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                {/* Bot Icon */}
                {!isUser && (
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "3px",
                    }}
                  >
                    <Shield size={16} color="#10B981" />
                  </div>
                )}

                {/* Message Content */}
                <div
                  style={{
                    maxWidth: isUser ? "85%" : "100%",
                    padding: isUser ? "10px 16px" : "0px",
                    borderRadius: isUser ? "18px" : "0px",
                    backgroundColor: isUser ? "#1E293B" : "transparent",
                    color: isUser ? "#FFFFFF" : "#E2E8F0",
                    fontSize: "0.88rem",
                    lineHeight: 1.6,
                    border: "none",
                    boxShadow: "none",
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "6px 0" }}>{children}</p>,
                      ul: ({ children }) => (
                        <ul style={{ margin: "6px 0", paddingLeft: "20px" }}>{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol style={{ margin: "6px 0", paddingLeft: "20px" }}>{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: "4px 0", color: "#CBD5E1" }}>{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ color: "#10B981", fontWeight: 600 }}>{children}</strong>
                      ),
                      h1: ({ children }) => (
                        <h1 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "10px 0 4px", color: "#10B981" }}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 style={{ fontSize: "0.98rem", fontWeight: 700, margin: "8px 0 4px", color: "#10B981" }}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "8px 0 4px", color: "#10B981" }}>
                          {children}
                        </h3>
                      ),
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: "#171B22",
                            border: "1px solid #242933",
                            padding: "2px 6px",
                            borderRadius: "5px",
                            fontSize: "0.82rem",
                            color: "#10B981",
                            fontFamily: "monospace",
                          }}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={16} color="#10B981" />
            </div>
            <span style={{ fontSize: "0.84rem", color: "#8B93A3" }}>
              Analyzing telemetry...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: "12px 16px 18px 16px",
          backgroundColor: "#0D0F12",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#171B22",
            border: "1px solid #242933",
            borderRadius: "12px",
            padding: "4px 8px",
          }}
        >
          <input
            type="text"
            placeholder="Ask CSMS anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: "#FFF",
              fontSize: "0.84rem",
              padding: "8px",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              backgroundColor: input.trim() ? "#10B981" : "#242933",
              color: input.trim() ? "#000" : "#64748B",
              border: "none",
              borderRadius: "8px",
              padding: "6px 8px",
              cursor: input.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </aside>
  );
}