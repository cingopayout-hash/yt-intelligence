import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_BASE = "https://yt-intelligence-api.cingopayout.workers.dev";

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [channelInput, setChannelInput] = useState("");
  const [channelData, setChannelData] = useState(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState("");

  async function sendMessage(promptText) {
    const text = (
      typeof promptText === "string" ? promptText : message
    ).trim();

    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: {
            channel: channelData,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer || "AI tidak mengembalikan jawaban.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Terjadi kesalahan: " + error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeChannel() {
    const channel = channelInput.trim();
    if (!channel || channelLoading) return;

    setChannelLoading(true);
    setChannelError("");
    setChannelData(null);

    try {
      const response = await fetch(`${API_BASE}/channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Channel request failed");
      }

      setChannelData(data.channel);
    } catch (error) {
      setChannelError(error.message);
    } finally {
      setChannelLoading(false);
    }
  }

  function formatNumber(value) {
    if (value === undefined || value === null) return "N/A";
    return Number(value).toLocaleString("en-US");
  }

  const stats = channelData?.statistics;
  const snippet = channelData?.snippet;

  const suggestions = channelData
    ? [
        "Analyze this channel's public statistics",
        "What can I learn from this channel's size?",
        "What data is missing for a deeper analysis?",
      ]
    : [
        "How do I analyze a YouTube channel?",
        "Explain YouTube Shorts retention",
        "Give me a video research checklist",
      ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">YT</div>
          <div>
            <strong>YT Intelligence</strong>
            <span>RESEARCH WORKSPACE</span>
          </div>
        </div>

        <button
          className="new-chat"
          onClick={() => {
            setMessages([]);
            setMessage("");
            setChannelData(null);
            setChannelError("");
            setChannelInput("");
          }}
        >
          <span>＋</span> New Research
        </button>

        <div className="nav-group">
          <p className="nav-title">WORKSPACE</p>
          <div className="nav-item active">
            <span>✳</span> AI Analyst
          </div>
          <div className="nav-item">
            <span>⌕</span> Video Research
          </div>
          <div className="nav-item">
            <span>▥</span> Analytics
          </div>
          <div className="nav-item">
            <span>✧</span> Idea Studio
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="connection">
            <span className="connection-dot" />
            <div>
              <strong>AI Connected</strong>
              <small>Cloudflare Workers AI</small>
            </div>
          </div>
          <div className="sidebar-version">
            YT Intelligence <span>v1.0</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>AI Analyst</strong>
          </div>
          <div className="topbar-right">
            <span className="workspace-pill">
              <i /> Workspace
            </span>
            <div className="user-avatar">C</div>
          </div>
        </header>

        <div className="dashboard">
          <section className="center-column">
            <div className="page-heading">
              <div>
                <div className="eyebrow">YOUTUBE RESEARCH</div>
                <h1>Research Dashboard</h1>
                <p>
                  Discover insights and understand any YouTube channel.
                </p>
              </div>
              <div className="date-label">✦ AI POWERED</div>
            </div>

            <section className="research-card">
              <div className="section-heading">
                <div className="section-icon">⌕</div>
                <div>
                  <h2>Channel Research</h2>
                  <p>Explore public channel data with one search.</p>
                </div>
              </div>

              <div className="channel-search">
                <span className="search-symbol">⌕</span>
                <input
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") analyzeChannel();
                  }}
                  placeholder="Search by channel name, @handle, or URL..."
                />
                <button
                  onClick={analyzeChannel}
                  disabled={channelLoading || !channelInput.trim()}
                >
                  {channelLoading ? "Searching..." : "Analyze Channel  →"}
                </button>
              </div>

              <div className="search-hint">
                <span>⌁</span> Try: @YouTube, channel URL, or channel ID
              </div>

              {channelError && (
                <div className="channel-error">{channelError}</div>
              )}

              {channelData && (
                <div className="channel-result">
                  <div className="channel-heading">
                    {snippet?.thumbnails?.medium?.url ||
                    snippet?.thumbnails?.default?.url ? (
                      <img
                        src={
                          snippet?.thumbnails?.medium?.url ||
                          snippet?.thumbnails?.default?.url
                        }
                        alt="Channel avatar"
                      />
                    ) : (
                      <div className="channel-placeholder">YT</div>
                    )}
                    <div className="channel-name">
                      <h3>{snippet?.title || "Untitled channel"}</h3>
                      <p>{snippet?.customUrl || "YouTube channel"}</p>
                    </div>
                    <span className="public-badge">● Public data</span>
                  </div>

                  <div className="channel-stats">
                    <div>
                      <small>Subscribers</small>
                      <strong>
                        {stats?.hiddenSubscriberCount
                          ? "Hidden"
                          : formatNumber(stats?.subscriberCount)}
                      </strong>
                    </div>
                    <div>
                      <small>Total Views</small>
                      <strong>{formatNumber(stats?.viewCount)}</strong>
                    </div>
                    <div>
                      <small>Total Videos</small>
                      <strong>{formatNumber(stats?.videoCount)}</strong>
                    </div>
                  </div>

                  <div className="channel-description">
                    <strong>About this channel</strong>
                    <p>
                      {snippet?.description ||
                        "No public channel description available."}
                    </p>
                  </div>
                  <small className="data-note">
                    Source: YouTube Data API · Public channel data only
                  </small>
                </div>
              )}
            </section>

            <section className="analyst-card">
              <div className="section-heading analyst-heading">
                <div className="section-icon ai-icon">✳</div>
                <div>
                  <h2>AI Analyst</h2>
                  <p>Ask questions and explore YouTube strategy.</p>
                </div>
                <span className="model-tag">LLAMA AI</span>
              </div>

              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="welcome-icon">✳</div>
                  <h2>What would you like to research?</h2>
                  <p>
                    I can help you understand YouTube, content strategy,
                    audience signals, and video performance.
                  </p>

                  <div className="suggestions">
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        onClick={() => sendMessage(item)}
                        disabled={loading}
                      >
                        {item} <span>↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((item, index) => (
                    <div
                      className={
                        item.role === "user"
                          ? "user-message"
                          : "assistant-message"
                      }
                      key={index}
                    >
                      {item.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1>{children}</h1>,
                            h2: ({ children }) => <h2>{children}</h2>,
                            h3: ({ children }) => <h3>{children}</h3>,
                            p: ({ children }) => <p>{children}</p>,
                            ul: ({ children }) => <ul>{children}</ul>,
                            ol: ({ children }) => <ol>{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => (
                              <strong>{children}</strong>
                            ),
                          }}
                        >
                          {item.text}
                        </ReactMarkdown>
                      ) : (
                        item.text
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="assistant-message loading">
                      AI is thinking...
                    </div>
                  )}
                </div>
              )}

              <div className="composer">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask anything about YouTube..."
                  rows={2}
                  disabled={loading}
                />
                <button
                  className="send"
                  onClick={() => sendMessage()}
                  disabled={loading || !message.trim()}
                  aria-label="Send message"
                >
                  {loading ? "…" : "↑"}
                </button>
              </div>
              <div className="composer-note">
                AI can make mistakes. Verify important data before making
                decisions.
              </div>
            </section>
          </section>

          <aside className="right-column">
            <section className="side-card overview-card">
              <div className="side-card-heading">
                <h3>Channel Overview</h3>
                <span>◎</span>
              </div>
              {channelData ? (
                <>
                  <div className="overview-profile">
                    {snippet?.thumbnails?.default?.url ? (
                      <img
                        src={snippet.thumbnails.default.url}
                        alt=""
                      />
                    ) : (
                      <div className="channel-placeholder small">YT</div>
                    )}
                    <div>
                      <strong>{snippet?.title || "Channel"}</strong>
                      <small>
                        {snippet?.customUrl || "Public channel"}
                      </small>
                    </div>
                  </div>
                  <div className="overview-line">
                    <span>Subscribers</span>
                    <strong>
                      {stats?.hiddenSubscriberCount
                        ? "Hidden"
                        : formatNumber(stats?.subscriberCount)}
                    </strong>
                  </div>
                  <div className="overview-line">
                    <span>Views</span>
                    <strong>{formatNumber(stats?.viewCount)}</strong>
                  </div>
                  <div className="overview-line">
                    <span>Videos</span>
                    <strong>{formatNumber(stats?.videoCount)}</strong>
                  </div>
                </>
              ) : (
                <div className="empty-side">
                  <div className="empty-icon">◉</div>
                  <strong>No channel selected</strong>
                  <p>
                    Search a channel to see its public overview here.
                  </p>
                </div>
              )}
            </section>

            <section className="side-card">
              <div className="side-card-heading">
                <h3>Top Content</h3>
                <span>↗</span>
              </div>
              <div className="empty-side compact">
                <div className="empty-icon">▤</div>
                <strong>Video data not loaded</strong>
                <p>
                  Video discovery will be added in a later step.
                </p>
              </div>
            </section>

            <section className="side-card insights-card">
              <div className="side-card-heading">
                <h3>Quick Insights</h3>
                <span>✧</span>
              </div>
              <div className="insight-item">
                <div className="insight-bullet blue">✦</div>
                <div>
                  <strong>Start with channel research</strong>
                  <p>
                    Look at public channel scale before comparing content.
                  </p>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-bullet purple">⌁</div>
                <div>
                  <strong>Ask the AI Analyst</strong>
                  <p>
                    Use specific questions to get more useful explanations.
                  </p>
                </div>
              </div>
              <div className="insight-footnote">
                Insights are general until channel data is analyzed.
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}