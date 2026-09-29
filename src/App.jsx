import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_BASE = "https://yt-intelligence-api.cingopayout.workers.dev";

export default function App() {
  const [page, setPage] = useState("analyst");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [channelInput, setChannelInput] = useState("");
  const [channelData, setChannelData] = useState(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState("");

  // Content Strategist
  const [niche, setNiche] = useState("");
  const [nicheEdited, setNicheEdited] = useState(false);
  const [format, setFormat] = useState("Shorts");
  const [theme, setTheme] = useState("");
  const [audience, setAudience] = useState("");
  const [complexity, setComplexity] = useState("Any");
  const [ideaCount, setIdeaCount] = useState("10");
  const [competitors, setCompetitors] = useState("");
  const [strategistStatus, setStrategistStatus] = useState("");
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [strategistLoading, setStrategistLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);

  useEffect(() => {
    if (!channelData || nicheEdited) return;

    const title = channelData.snippet?.title || "";
    if (title) setNiche(title);
  }, [channelData, nicheEdited]);

  async function sendMessage(promptText, isRetry = false) {
    const text = (
      typeof promptText === "string" ? promptText : message
    ).trim();

    if (!text || loading) return;

    if (!isRetry) {
      setMessages((prev) => [...prev, { role: "user", text }]);
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: { channel: channelData },
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
          text: "Gagal mendapatkan jawaban: " + error.message,
          retryPrompt: text,
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
    setNicheEdited(false);

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

  function resetResearch() {
    setMessages([]);
    setMessage("");
    setChannelData(null);
    setChannelError("");
    setChannelInput("");
    setNiche("");
    setNicheEdited(false);
    setFormat("Shorts");
    setTheme("");
    setAudience("");
    setComplexity("Any");
    setIdeaCount("10");
    setCompetitors("");
    setStrategistStatus("");
    setGeneratedIdeas([]);
    setStrategistLoading(false);
    setSelectedIdea(null);
    setPage("analyst");
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

  function openStrategist() {
    setPage("strategist");
    setStrategistStatus("");
  }

  async function prepareIdeas() {
    if (!niche.trim()) {
      setStrategistStatus("Isi niche terlebih dahulu.");
      return;
    }

    if (strategistLoading) return;

    setStrategistLoading(true);
    setStrategistStatus("");
    setGeneratedIdeas([]);
    setSelectedIdea(null);

    try {
      const response = await fetch(`${API_BASE}/strategist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche: niche.trim(),
          format,
          theme,
          audience,
          complexity,
          count: Number(ideaCount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generator request failed");
      }

      let parsed;

      try {
        parsed =
          typeof data.result === "string"
            ? JSON.parse(
                data.result.replace(/```json|```/g, "").trim()
              )
            : data.result;
      } catch {
        throw new Error(
          "AI returned invalid JSON. Please try again."
        );
      }

      if (!Array.isArray(parsed?.ideas)) {
        throw new Error("AI response does not contain an ideas list.");
      }

      setGeneratedIdeas(parsed.ideas);
      setStrategistStatus(
        `Berhasil menghasilkan ${parsed.ideas.length} ide.`
      );
    } catch (error) {
      setStrategistStatus("Gagal membuat ide: " + error.message);
    } finally {
      setStrategistLoading(false);
    }
  }

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

        <button className="new-chat" onClick={resetResearch}>
          <span>＋</span> New Research
        </button>

        <div className="nav-group">
          <p className="nav-title">WORKSPACE</p>

          <button
            className={`nav-item ${page === "analyst" ? "active" : ""}`}
            onClick={() => setPage("analyst")}
          >
            <span>✳</span> AI Analyst
          </button>

          <button
            className={`nav-item ${page === "video" ? "active" : ""}`}
            onClick={() => setPage("video")}
          >
            <span>⌕</span> Video Research
          </button>

          <button
            className={`nav-item ${page === "analytics" ? "active" : ""}`}
            onClick={() => setPage("analytics")}
          >
            <span>▥</span> Analytics
          </button>

          <button
            className={`nav-item ${page === "strategist" ? "active" : ""}`}
            onClick={openStrategist}
          >
            <span>✧</span> Content Strategist
          </button>
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
            YT Intelligence <span>v1.1</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>
              {page === "strategist"
                ? "Content Strategist"
                : page === "analyst"
                ? "AI Analyst"
                : page === "video"
                ? "Video Research"
                : "Analytics"}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="workspace-pill">
              <i /> Workspace
            </span>
            <div className="user-avatar">C</div>
          </div>
        </header>

        {page === "strategist" ? (
          <div className="strategist-page">
            <div className="page-heading">
              <div>
                <div className="eyebrow">CONTENT DEVELOPMENT</div>
                <h1>AI Content Strategist</h1>
                <p>
                  Discover content opportunities and turn ideas into
                  production-ready plans.
                </p>
              </div>

              <div className="date-label">✦ STRATEGY STUDIO</div>
            </div>

            <div className="strategist-layout">
              <section className="strategist-main">
                <div className="research-card strategist-card">
                  <div className="section-heading">
                    <div className="section-icon">◎</div>
                    <div>
                      <h2>1. Niche & Content Filters</h2>
                      <p>
                        Set your target niche and define the kind of content
                        you want to create.
                      </p>
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="target-niche">Target niche</label>
                    <input
                      id="target-niche"
                      className="strategist-input"
                      value={niche}
                      onChange={(e) => {
                        setNiche(e.target.value);
                        setNicheEdited(true);
                      }}
                      placeholder="Enter a niche, e.g. Roblox mystery stories"
                    />

                    <div className="field-hint">
                      {channelData
                        ? `Suggested from analyzed channel: ${
                            snippet?.title || "Selected channel"
                          }. You can edit it.`
                        : "Analyze a channel first to use its name as a starting point, or enter a niche manually."}
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Content format</label>
                    <div className="choice-row">
                      {["Shorts", "Long-form"].map((item) => (
                        <button
                          key={item}
                          className={`choice-button ${
                            format === item ? "selected" : ""
                          }`}
                          onClick={() => setFormat(item)}
                        >
                          {item === "Shorts" ? "▣" : "▤"} {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field-grid">
                    <div className="field-group">
                      <label htmlFor="theme">Theme / topic</label>
                      <input
                        id="theme"
                        className="strategist-input"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="e.g. Mystery, comedy, tutorial"
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="audience">Target audience</label>
                      <input
                        id="audience"
                        className="strategist-input"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="e.g. Beginner players"
                      />
                    </div>
                  </div>

                  <div className="field-grid">
                    <div className="field-group">
                      <label htmlFor="complexity">
                        Production complexity
                      </label>
                      <select
                        id="complexity"
                        className="strategist-input"
                        value={complexity}
                        onChange={(e) => setComplexity(e.target.value)}
                      >
                        <option>Any</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor="idea-count">Number of ideas</label>
                      <select
                        id="idea-count"
                        className="strategist-input"
                        value={ideaCount}
                        onChange={(e) => setIdeaCount(e.target.value)}
                      >
                        <option value="10">10 ideas</option>
                        <option value="15">15 ideas</option>
                        <option value="20">20 ideas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="research-card strategist-card">
                  <div className="section-heading">
                    <div className="section-icon">⌕</div>
                    <div>
                      <h2>2. Competitor Inspiration</h2>
                      <p>
                        Add competitor channels or video URLs to define the
                        sample for pattern analysis.
                      </p>
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="competitors">
                      Competitor channel or video URLs
                    </label>

                    <textarea
                      id="competitors"
                      className="strategist-input strategist-textarea"
                      value={competitors}
                      onChange={(e) => setCompetitors(e.target.value)}
                      placeholder={
                        "Paste URLs, one per line...\nhttps://www.youtube.com/@example"
                      }
                      rows={4}
                    />

                    <div className="field-hint">
                      Competitor analysis is not connected yet. This field
                      will be used in the next backend step.
                    </div>
                  </div>
                </div>

                <div className="strategist-actions">
                  <button
                    className="generate-button"
                    onClick={prepareIdeas}
                    disabled={strategistLoading}
                  >
                    {strategistLoading
                      ? "Generating..."
                      : `✧ Generate ${ideaCount} Ideas`}
                  </button>

                  <span>
                    Generates ideas from your niche, filters, and selected
                    research sample.
                  </span>
                </div>

                {strategistStatus && (
                  <div className="strategist-status">
                    {strategistStatus}
                  </div>
                )}

                <div className="research-card strategist-card">
                  <div className="section-heading">
                    <div className="section-icon">◈</div>
                    <div>
                      <h2>3. Content Opportunities</h2>
                      <p>
                        Identify themes and approaches that appear less often
                        in the analyzed sample.
                      </p>
                    </div>
                  </div>

                  <div className="strategist-empty">
                    <div className="empty-icon">⌁</div>
                    <strong>Content gap analysis will appear here</strong>
                    <p>
                      Add competitor samples and run the analysis to discover
                      underrepresented topics and storytelling approaches.
                    </p>
                  </div>
                </div>

                <div className="research-card strategist-card">
                  <div className="section-heading">
                    <div className="section-icon">✧</div>
                    <div>
                      <h2>4. Generated Ideas & Scorecard</h2>
                      <p>
                        Review each idea by niche fit, novelty, production
                        complexity, and supporting reasons.
                      </p>
                    </div>
                  </div>

                  {generatedIdeas.length === 0 ? (
                    <div className="strategist-empty">
                      <div className="empty-icon">▤</div>
                      <strong>No ideas generated yet</strong>
                      <p>
                        Your ideas will appear here with an explanation of
                        their scorecard—not a prediction of virality.
                      </p>
                    </div>
                  ) : (
                    <div className="generated-ideas">
                      {generatedIdeas.map((idea, index) => (
                        <article className="idea-card" key={index}>
                          <div className="idea-card-top">
                            <span className="idea-number">
                              IDEA {String(index + 1).padStart(2, "0")}
                            </span>

                            <span className="complexity-badge">
                              {idea.productionComplexity || "Unspecified"}
                            </span>
                          </div>

                          <h3>{idea.title || `Idea ${index + 1}`}</h3>
                          <p>{idea.concept || "No concept provided."}</p>

                          <div className="idea-scores">
                            <div className="idea-score">
                              <span>Niche fit</span>
                              <strong>
                                {idea.nicheFit ?? "N/A"}
                                <small>/10</small>
                              </strong>
                            </div>

                            <div className="idea-score">
                              <span>Novelty</span>
                              <strong>
                                {idea.novelty ?? "N/A"}
                                <small>/10</small>
                              </strong>
                            </div>
                          </div>

                          <div className="idea-reason">
                            <strong>Why this idea</strong>
                            <p>{idea.reason || "No reason provided."}</p>
                          </div>

                          <button
                            className="secondary-button"
                            onClick={() => setSelectedIdea(idea)}
                          >
                            Build This Idea →
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <aside className="strategist-side">
                <section className="side-card">
                  <div className="side-card-heading">
                    <h3>Research Context</h3>
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
                          <div className="channel-placeholder small">
                            YT
                          </div>
                        )}

                        <div>
                          <strong>
                            {snippet?.title || "Selected channel"}
                          </strong>
                          <small>
                            {snippet?.customUrl || "Analyzed channel"}
                          </small>
                        </div>
                      </div>

                      <div className="overview-line">
                        <span>Channel</span>
                        <strong>Connected</strong>
                      </div>
                    </>
                  ) : (
                    <div className="empty-side">
                      <div className="empty-icon">◉</div>
                      <strong>No channel selected</strong>
                      <p>
                        Channel research can provide a starting point for
                        your niche.
                      </p>
                    </div>
                  )}

                  <button
                    className="secondary-button"
                    onClick={() => setPage("analyst")}
                  >
                    Go to Channel Research
                  </button>
                </section>

                <section className="side-card">
                  <div className="side-card-heading">
                    <h3>Idea Scorecard</h3>
                    <span>◈</span>
                  </div>

                  <div className="score-guide">
                    <strong>Niche fit</strong>
                    <p>
                      How closely the idea matches your chosen niche.
                    </p>
                  </div>

                  <div className="score-guide">
                    <strong>Novelty</strong>
                    <p>
                      How distinct the angle is from the sample reviewed.
                    </p>
                  </div>

                  <div className="score-guide">
                    <strong>Production complexity</strong>
                    <p>
                      Estimated effort, assets, scenes, and editing needs.
                    </p>
                  </div>

                  <div className="score-note">
                    Scores explain trade-offs. They do not forecast views or
                    virality.
                  </div>
                </section>

                <section className="side-card">
                  <div className="side-card-heading">
                    <h3>Build This Idea</h3>
                    <span>↗</span>
                  </div>

                  {selectedIdea ? (
                    <div className="build-idea">
                      <strong>{selectedIdea.title}</strong>

                      <div className="build-section">
                        <span>HOOK</span>
                        <p>
                          {selectedIdea.hook || "No hook provided."}
                        </p>
                      </div>

                      <div className="build-section">
                        <span>CONCEPT</span>
                        <p>
                          {selectedIdea.concept || "No concept provided."}
                        </p>
                      </div>

                      <div className="build-section">
                        <span>FORMAT</span>
                        <p>{format}</p>
                      </div>

                      <div className="build-section">
                        <span>PRODUCTION NOTE</span>
                        <p>
                          Develop this concept into a scene-by-scene plan,
                          dialogue, and production prompts. This is an initial
                          idea brief, not a finished script.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-side compact">
                      <div className="empty-icon">✎</div>
                      <strong>Idea development</strong>
                      <p>
                        Select an idea to view its hook and concept here.
                      </p>
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </div>
        ) : page === "analyst" ? (
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
                    {channelLoading
                      ? "Searching..."
                      : "Analyze Channel  →"}
                  </button>
                </div>

                <div className="search-hint">
                  <span>⌁</span> Try: @YouTube, channel URL, or channel ID
                </div>

                {channelError && (
                  <div className="channel-error">
                    <p>{channelError}</p>
                    <button
                      onClick={analyzeChannel}
                      disabled={channelLoading}
                    >
                      {channelLoading ? "Retrying..." : "Try again"}
                    </button>
                  </div>
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
                    <p>
                      Ask questions and explore YouTube strategy.
                    </p>
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
                          item.retryPrompt ? (
                            <div className="assistant-error-content">
                              <p>{item.text}</p>
                              <button
                                className="retry-button"
                                onClick={() =>
                                  sendMessage(item.retryPrompt, true)
                                }
                                disabled={loading}
                              >
                                {loading ? "Retrying..." : "Try again"}
                              </button>
                            </div>
                          ) : (
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
                          )
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
                        <div className="channel-placeholder small">
                          YT
                        </div>
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
        ) : null}
      </main>
    </div>
  );
}