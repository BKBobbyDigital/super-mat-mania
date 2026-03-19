import { useState, useEffect, useRef } from "react";
import { WEIGHT_CLASSES, WRESTLERS_BY_WEIGHT, PLACEMENT_POINTS, SEED_ENTRIES, getSchoolColor, LAST_UPDATED } from "./data";
import { saveResults, subscribeResults } from "./firebase";

// ─── Scoring helper ──────────────────────────────────────────────────────────
function calcTeamPoints(picks, results) {
  let total = 0;
  for (const weight of WEIGHT_CLASSES) {
    const pick = picks[weight];
    if (!pick) continue;
    const key = `${weight}-${pick.seed}-${pick.name}`;
    const r = results[key];
    if (!r) continue;
    total += (r.advPoints || 0) + (r.placementPoints || 0);
  }
  return Math.round(total * 10) / 10;
}

// ─── Wrestling icon SVG ──────────────────────────────────────────────────────
function WrestlingIcon({ color = "#fff", size = 28 }) {
  return (
    <svg viewBox="0 0 300 300" fill={color} style={{ width: size, height: size }}>
      <path d="M186.656,113.442c-2.599-4.81-9.816-6.478-14.129-3.049c-2.26,2.441-3.353,5.699-4.346,8.81c-2.253,8.23-3.348,15.964-6.681,24.297l-1.811-0.216c-5.52-0.72-11.082-0.967-16.641-1.054c-9.888-1.082-20.063-3.998-27.792-10.507c-8.384-8.569-8.574-21.427-8.922-32.663c-0.351-5.878,0.133-12.279-3.005-17.528c-4.125-4.503-12.228-3.91-16.292,0.438c-4.967,4.945-5.627,12.43-5.906,19.062c0.135,13.432,5.563,27.056,15.513,36.219c8.136,7.588,19.432,10.801,30.365,10.936c7.316,0.019,14.712,1.2,21.962-0.246c2.915-0.832,5.838-1.627,8.801-2.285c1.394-0.323,3.435-0.823,3.435-0.823c-2.676,3.159-6.595,8.807-10.327,10.836c-6.896,3.92-15.117,4.634-22.9,4.603c-5.797-0.774-11.612-2.256-17.503-1.437c2.204,2.621,5.468,3.728,8.442,5.211c5.541,2.853,11.914,2.961,17.914,4.142c10.938,1.588,22.991,0.852,32.124-6.04c5.762-3.953,9.832-9.764,13.451-15.626c3.736-6.185,5.836-13.274,6.453-20.452C189.094,121.784,189.166,117.146,186.656,113.442z"/>
      <path d="M50.566,134.139c-5.344,0.898-9.063,5.546-11.064,10.278c-3.844,9.398-3.99,19.708-5.601,29.608c-0.969,9.362-5.507,17.759-8.561,26.528c-4.544,12.722-15.863,20.892-25.341,29.78v8.656c6.276-4.06,13.086-7.303,18.922-12.029c19.831-14.612,35.745-35.407,41.687-59.568c1.949-8.439,3.472-17.512,0.741-25.958C59.972,136.925,55.319,133.549,50.566,134.139z"/>
      <path d="M82.814,138.983c-5.108-3.734-13.542-2.87-17.171,2.518c-2.68,5.527,0.001,11.79,3.176,16.492c8.028,11.097,19.44,19.168,31.04,26.141c3.277,2.169,5.753,5.822,4.982,9.918c-1.156,11.56-5.383,22.548-9.767,33.224c-2.967,7.276-7.299,13.922-10.292,21.173c1.392-0.792,2.79-1.601,3.852-2.825c7.623-8.072,15.126-16.332,21.288-25.6c5.773-8.496,11.313-17.746,12.601-28.122c1.026-6.527-2.296-12.604-5.345-18.11C108.388,159.912,96.491,148.051,82.814,138.983z"/>
      <path d="M204.966,204.271c-1.489-3.534-3.796-7.661-1.94-11.479c1.734-4.514,5.942-7.285,8.73-11.072c5.702-7.417,11.614-14.937,14.848-23.825c2.274-5.454,3.97-11.946,0.965-17.477c-3.624-6.501-13.837-5.174-17.972,0.107c-10.767,12.684-18.934,27.648-23.593,43.629c-2.094,7.287-2.689,15.523,1.256,22.318c7.706,13.001,20.199,22.068,32.109,30.93c5.639,3.323,10.846,7.772,17.184,9.655c-2.019-3.06-4.86-5.437-7.19-8.241C219.73,228.483,211.3,216.917,204.966,204.271z"/>
      <path d="M278.108,208.916c-3.856-4.522-5.993-10.137-8.723-15.339c-2.236-4.702-5.045-9.189-6.436-14.245c-3.021-11.303-4.16-23.328-9.716-33.796c-2.432-4.754-7.104-7.731-12.174-9.006c-2.607,1.387-5.723,2.496-7.258,5.204c-2.65,4.438-2.361,9.866-1.723,14.803c2.66,18.67,12.115,35.854,24.764,49.636c11.997,12.952,27.139,22.575,43.158,29.78v-8.178C292.638,221.576,284.104,216.596,278.108,208.916z"/>
      <circle cx="134.381" cy="72.342" r="21.6"/>
      <circle cx="141.388" cy="117.344" r="21.599"/>
    </svg>
  );
}

// ─── Seed badge ──────────────────────────────────────────────────────────────
function SeedBadge({ seed }) {
  const isLow = seed >= 10;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 22, borderRadius: "50%",
      background: isLow ? "#ef4444" : "var(--accent)",
      color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
    }}>#{seed}</span>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("leaderboard");

  const [entries, setEntries] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ncaa_wres_entries") || "[]");
      const seedIds = new Set(SEED_ENTRIES.map(e => e.id));
      const userAdded = stored.filter(e => !seedIds.has(e.id));
      return [...SEED_ENTRIES, ...userAdded];
    } catch { return SEED_ENTRIES; }
  });
  const [results, setResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ncaa_wres_results") || "{}"); } catch { return {}; }
  });
  const firebaseReady = useRef(false);

  // Subscribe to Firebase results — all users get real-time updates
  useEffect(() => {
    const unsubscribe = subscribeResults((data) => {
      firebaseReady.current = true;
      setResults(data);
      localStorage.setItem("ncaa_wres_results", JSON.stringify(data));
    });
    return unsubscribe;
  }, []);

  // Wrap setResults so admin changes push to Firebase
  const setResultsAndSync = (updater) => {
    setResults(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("ncaa_wres_results", JSON.stringify(next));
      saveResults(next);
      return next;
    });
  };

  useEffect(() => { localStorage.setItem("ncaa_wres_entries", JSON.stringify(entries)); }, [entries]);

  const allPickedFn = (picks) => WEIGHT_CLASSES.every(w => !!picks[w]);
  const leaderboard = [...entries]
    .map(e => ({ ...e, score: calcTeamPoints(e.picks, results), complete: allPickedFn(e.picks) }))
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? -1 : 1;
      return b.score - a.score;
    });

  // Admin mode: tap the wrestling icon 5 times within 3 seconds to toggle
  const [adminMode, setAdminMode] = useState(false);
  const clickRef = useRef({ count: 0, timer: null });
  const handleIconClick = () => {
    clickRef.current.count++;
    clearTimeout(clickRef.current.timer);
    if (clickRef.current.count >= 5) {
      setAdminMode(m => !m);
      clickRef.current.count = 0;
    } else {
      clickRef.current.timer = setTimeout(() => { clickRef.current.count = 0; }, 3000);
    }
  };

  const navItems = [
    { key: "leaderboard", label: "Leaderboard" },
    { key: "scoring", label: "Scoring" },
    { key: "stats", label: "Stats" },
    { key: "payout", label: "Payout" },
    // { key: "addPick", label: "Add Entry" },
    ...(adminMode ? [{ key: "admin", label: "⚡ Admin" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
          <div className="header-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 82 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div onClick={handleIconClick} style={{
                width: 54, height: 54, borderRadius: 14, background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", userSelect: "none",
              }}>
                <WrestlingIcon color="#fff" size={34} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, lineHeight: 1.1, color: "var(--text)" }}>Super Mat Mania</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--accent)", letterSpacing: 0.5, lineHeight: 1.4 }}>The Poppy Challenge 2026</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, lineHeight: 1.4 }}>Mar 19–21 · Rocket Arena, Cleveland OH</div>
              </div>
            </div>
            <nav className="header-nav" style={{ display: "flex", gap: 2 }}>
              {navItems.map(({ key, label }) => (
                <button key={key} onClick={() => setView(key)} style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: view === key ? "var(--accent-bg)" : "transparent",
                  color: view === key ? "var(--accent-text)" : "var(--text-secondary)",
                  fontWeight: view === key ? 600 : 500, fontSize: 14,
                  cursor: "pointer", transition: "all .15s",
                  fontFamily: "inherit",
                }}>
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px", flex: 1, width: "100%" }}>
        {view === "leaderboard" && <Leaderboard leaderboard={leaderboard} entries={entries} setEntries={setEntries} results={results} />}
        {view === "scoring" && <ScoringPage />}
        {view === "stats" && <StatsPage entries={entries} />}
        {view === "payout" && <PayoutPage entries={entries} leaderboard={leaderboard} />}
        {view === "addPick" && <AddEntry entries={entries} setEntries={setEntries} onDone={() => setView("leaderboard")} />}
        {view === "admin" && adminMode && <AdminPanel entries={entries} results={results} setResults={setResultsAndSync} />}
      </main>

      <footer style={{
        borderTop: "1px solid var(--border)", padding: "24px",
        textAlign: "center", fontSize: 13, color: "var(--text-muted)", fontWeight: 400,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}>
        <div>Last updated: {new Date(LAST_UPDATED).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
        <div>&copy; 2026 WE DEM BOYZ</div>
      </footer>
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ leaderboard, entries, setEntries, results }) {
  const [expanded, setExpanded] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const allPicked = (picks) => WEIGHT_CLASSES.every(w => !!picks[w]);
  const hasLowSeed = (picks) => WEIGHT_CLASSES.some(w => picks[w]?.seed >= 10);
  const hasHighSeed = (picks) => WEIGHT_CLASSES.some(w => picks[w] && picks[w].seed <= 9);

  const completeEntries = leaderboard.filter(e => e.complete);
  const allTied = completeEntries.length > 1 && completeEntries.every(e => e.score === completeEntries[0].score);

  const getRank = (index) => {
    if (!leaderboard[index].complete) return "\u2014";
    if (allTied) return "T1";
    let rank = 1;
    for (let i = 0; i < index; i++) {
      if (leaderboard[i].complete) {
        if (leaderboard[i].score !== leaderboard[index].score) {
          rank = i + 1;
        }
      }
    }
    if (index > 0 && leaderboard[index].score === leaderboard[index - 1].score && leaderboard[index - 1].complete) {
      let firstWithScore = index;
      while (firstWithScore > 0 && leaderboard[firstWithScore - 1].score === leaderboard[index].score && leaderboard[firstWithScore - 1].complete) {
        firstWithScore--;
      }
      return `T${firstWithScore + 1}`;
    }
    return `${index + 1}`;
  };

  if (leaderboard.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>No entries yet</div>
        <div style={{ color: "var(--text-muted)", marginBottom: 28 }}>Be the first to submit your picks for the 2026 NCAA Wrestling Championships</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
        <h2 className="leaderboard-title" style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, color: "var(--text)" }}>Leaderboard</h2>
        <span style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>{leaderboard.length} entries</span>
      </div>

      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 18px 10px",
        fontSize: 12, fontWeight: 500, color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)",
      }}>
        <div style={{ width: 36, marginRight: 14, textAlign: "center" }}>#</div>
        <div style={{ flex: 1 }}>Name</div>
        <div className="weight-pills" style={{ display: "flex", gap: 3, marginRight: 14 }}>
          {WEIGHT_CLASSES.map(w => <div key={w} style={{ width: 38, textAlign: "center" }}>{w}</div>)}
        </div>
        <div style={{ width: 60, textAlign: "right" }}>Score</div>
        <div style={{ width: 28 }}></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {leaderboard.map((entry, i) => {
          const isExp = expanded === entry.id;
          const rank = getRank(i);
          const isLeader = i === 0 && entry.complete && !allTied && entry.score > 0;
          const isFirst = i === 0;
          return (
            <div key={entry.id} style={{
              borderBottom: "1px solid var(--border-light)",
              background: isExp ? "var(--bg-secondary)" : isLeader ? "var(--accent-bg)" : "var(--bg)",
              transition: "background .15s",
              borderLeft: isLeader ? "3px solid var(--accent)" : "3px solid transparent",
            }}>
              {/* Row */}
              <div className="entry-row" style={{
                display: "flex", alignItems: "center", padding: "14px 18px", gap: 14,
                cursor: "pointer",
              }}
                onClick={() => setExpanded(isExp ? null : entry.id)}
                onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = isLeader ? "var(--accent-bg)" : "var(--bg-secondary)"; }}
                onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = isLeader ? "var(--accent-bg)" : "transparent"; }}
              >
                {/* Rank */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: isLeader ? "var(--accent)" : !entry.complete ? "var(--bg-verylight)" : "var(--bg-tertiary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14,
                  color: isLeader ? "#fff" : !entry.complete ? "var(--text-faint)" : "var(--text-secondary)",
                  flexShrink: 0,
                }}>
                  {rank}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="entry-name" style={{ fontWeight: 600, fontSize: 16, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</div>
                  {!allPicked(entry.picks) && (
                    <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 500, marginTop: 1 }}>
                      Incomplete lineup
                    </div>
                  )}
                </div>

                {/* Weight coverage pills */}
                <div className="weight-pills" style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
                  {WEIGHT_CLASSES.map(w => {
                    const pick = entry.picks[w];
                    const pickKey = pick ? `${w}-${pick.seed}-${pick.name}` : null;
                    const isElim = pickKey && results[pickKey]?.eliminated;
                    return (
                      <div key={w} style={{
                        width: 38, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 600,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: pick ? (isElim ? "var(--border)" : getSchoolColor(pick.school)) : "var(--bg-tertiary)",
                        color: pick ? "#fff" : "var(--text-faint)",
                        opacity: isElim ? 0.5 : 1,
                        textDecoration: isElim ? "line-through" : "none",
                        transition: "all .15s",
                      }}>{w}</div>
                    );
                  })}
                </div>

                {/* Score */}
                <div style={{ width: 60, textAlign: "right", flexShrink: 0 }}>
                  <div className="entry-score" style={{ fontWeight: 800, fontSize: 22, color: !entry.complete ? "var(--text-faint)" : "var(--text)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {entry.score.toFixed(1)}
                  </div>
                </div>

                <div className={isFirst && expanded === null ? "chevron-hint" : ""} style={{ color: "var(--text-faint)", fontSize: 12, flexShrink: 0, width: 16, textAlign: "center", transition: "transform .2s", transform: isExp ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              {/* Expanded picks */}
              {isExp && (
                <div style={{ borderTop: "1px solid var(--border-light)", padding: "20px 18px", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 16 }}>
                    {WEIGHT_CLASSES.map(w => {
                      const pick = entry.picks[w];
                      const key = pick ? `${w}-${pick.seed}-${pick.name}` : null;
                      const r = key ? results[key] : null;
                      const pts = r ? ((r.advPoints || 0) + (r.placementPoints || 0)) : 0;
                      const isElim = r?.eliminated;
                      return (
                        <div key={w} style={{
                          background: isElim ? "var(--bg-secondary)" : "var(--card-bg)", border: "1px solid var(--border)",
                          borderRadius: 10, padding: "12px 14px",
                          borderLeft: pick ? `3px solid ${isElim ? "var(--text-faint)" : getSchoolColor(pick.school)}` : "3px solid var(--border)",
                          opacity: isElim ? 0.6 : 1,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: 1 }}>{w} LBS</span>
                            {isElim && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--danger)", background: "var(--danger-bg)", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>ELIM</span>}
                          </div>
                          {pick ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                <SeedBadge seed={pick.seed} />
                                <span style={{ fontWeight: 600, fontSize: 14, color: isElim ? "var(--text-muted)" : "var(--text)", textDecoration: isElim ? "line-through" : "none" }}>{pick.name}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{pick.school}</div>
                              {r && pts > 0 && <div style={{ fontSize: 12, color: isElim ? "var(--text-muted)" : "var(--accent)", fontWeight: 600, marginTop: 4 }}>+{pts.toFixed(1)} pts</div>}
                            </>
                          ) : (
                            <div style={{ fontSize: 13, color: "var(--text-faint)" }}>No pick</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {deleteConfirm === entry.id ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--danger)" }}>Delete this entry?</span>
                        <button onClick={() => { setEntries(entries.filter(e => e.id !== entry.id)); setDeleteConfirm(null); setExpanded(null); }} style={{
                          padding: "6px 14px", borderRadius: 8, background: "var(--danger)", border: "none",
                          color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
                        }}>Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{
                          padding: "6px 14px", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border)",
                          color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                        }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(entry.id); }} style={{
                        padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)",
                        color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                        transition: "all .15s",
                      }}>Remove</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scoring Page ────────────────────────────────────────────────────────────
function ScoringPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 4, color: "var(--text)" }}>Scoring</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        Each participant picks one wrestler per weight class (10 picks total). Points accumulate as your wrestlers win matches and place at the tournament.
      </p>

      {/* Advancement Points */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>Advancement Points</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Earned each round a picked wrestler wins</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Win Type</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Championship</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Consolation</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Regular Decision", "1.0", "0.5"],
              ["Fall / Forfeit / Default / DQ", "2.0", "2.0"],
              ["Tech Fall (with nearfall)", "1.5", "1.5"],
              ["Tech Fall (no nearfall)", "1.0", "1.0"],
              ["Major Decision", "1.0", "1.0"],
              ["Bye", "1.0", "0.5"],
            ].map(([type, champ, consi], i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                <td style={{ padding: "12px", color: "var(--text-body)", fontWeight: 500 }}>{type}</td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "var(--accent)" }}>{champ}</td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "var(--text-secondary)" }}>{consi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Placement Points */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>Final Placement Points</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>One-time bonus awarded at the end of the tournament (All-American = top 8)</p>
        <div className="scoring-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {Object.entries(PLACEMENT_POINTS).map(([place, pts]) => (
            <div key={place} style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10,
              padding: "16px 12px", textAlign: "center",
            }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                {place === "1" ? "1st" : place === "2" ? "2nd" : place === "3" ? "3rd" : `${place}th`}
              </div>
              <div style={{ fontWeight: 800, fontSize: 28, color: "var(--text)", lineHeight: 1 }}>
                {pts}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pick Rules */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 16 }}>Pick Rules</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "var(--text-body)" }}>
          {[
            ["1", "Pick one wrestler per weight class (10 picks total)", "#00c48c"],
            ["2", "Must include at least one wrestler seeded #1\u20139 (chalk pick)", "#00c48c"],
            ["3", "Must include at least one wrestler seeded #10 or higher (upset pick)", "#ef4444"],
          ].map(([num, text, bg]) => (
            <div key={num} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{
                background: bg, color: "#fff", borderRadius: "50%",
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>{num}</span>
              <span style={{ fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formula */}
      <div style={{
        marginTop: 16, background: "var(--bg-secondary)", borderRadius: 10, padding: "14px 20px",
        fontSize: 14, color: "var(--text-secondary)", textAlign: "center", border: "1px solid var(--border)",
      }}>
        <span style={{ fontWeight: 700 }}>Total Score</span> = sum of all 10 picks' (advancement + placement points)
      </div>
    </div>
  );
}

// ─── Stats Page (Infographic) ───────────────────────────────────────────────
function StatsPage({ entries }) {
  // ── Compute all stats from picks data ──
  const N = entries.length;
  const wrestlerPicks = {};
  const schoolPicks = {};
  const weightFavorites = {};

  entries.forEach(entry => {
    Object.entries(entry.picks).forEach(([wt, p]) => {
      const key = `${p.name}|${p.school}|${p.seed}`;
      wrestlerPicks[key] = (wrestlerPicks[key] || 0) + 1;
      schoolPicks[p.school] = (schoolPicks[p.school] || 0) + 1;
      if (!weightFavorites[wt]) weightFavorites[wt] = {};
      const wKey = `${p.name}|${p.school}`;
      weightFavorites[wt][wKey] = (weightFavorites[wt][wKey] || 0) + 1;
    });
  });

  // Top picked wrestlers
  const topWrestlers = Object.entries(wrestlerPicks)
    .map(([k, v]) => { const [name, school, seed] = k.split("|"); return { name, school, seed: +seed, count: v, pct: Math.round(v / N * 100) }; })
    .sort((a, b) => b.count - a.count);

  // Top schools
  const topSchools = Object.entries(schoolPicks)
    .map(([school, count]) => ({ school, count }))
    .sort((a, b) => b.count - a.count);

  // Lone wolves (picked by exactly 1 person)
  const loneWolves = topWrestlers.filter(w => w.count === 1);

  // Unpicked count
  const pickedNames = new Set(topWrestlers.map(w => w.name));
  let totalWrestlers = 0;
  Object.values(WRESTLERS_BY_WEIGHT).forEach(wc => { totalWrestlers += wc.length; });
  const unpickedCount = totalWrestlers - pickedNames.size;

  // Weight class consensus + chaos
  const weightStats = WEIGHT_CLASSES.map(wt => {
    const picks = weightFavorites[wt] || {};
    const sorted = Object.entries(picks).sort((a, b) => b[1] - a[1]);
    const [topKey, topCount] = sorted[0] || ["Unknown|Unknown", 0];
    const [topName, topSchool] = topKey.split("|");
    return { weight: wt, topName, topSchool, topCount, pct: Math.round(topCount / N * 100), uniquePicks: sorted.length };
  });
  const mostAgreed = [...weightStats].sort((a, b) => b.pct - a.pct)[0];
  const mostChaotic = [...weightStats].sort((a, b) => a.pct - b.pct)[0];

  // Entry superlatives
  let chalkiest = null, chalkSum = 999, wildest = null, wildSum = 0;
  let mostContrarian = null, maxUniq = 0;
  let biggestHomer = null, homerSchool = "", homerCount = 0;
  let mostDiverse = null, maxSchools = 0;

  entries.forEach(entry => {
    const picks = Object.values(entry.picks);
    const seedSum = picks.reduce((s, p) => s + p.seed, 0);
    if (seedSum < chalkSum) { chalkSum = seedSum; chalkiest = entry.name; }
    if (seedSum > wildSum) { wildSum = seedSum; wildest = entry.name; }

    const uniq = picks.reduce((s, p) => {
      const key = `${p.name}|${p.school}|${p.seed}`;
      return s + (1 / (wrestlerPicks[key] || 1));
    }, 0);
    if (uniq > maxUniq) { maxUniq = uniq; mostContrarian = entry.name; }

    const sc = {};
    picks.forEach(p => sc[p.school] = (sc[p.school] || 0) + 1);
    const schools = Object.keys(sc).length;
    if (schools > maxSchools) { maxSchools = schools; mostDiverse = entry.name; }
    const topSc = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
    if (topSc && topSc[1] > homerCount) { homerCount = topSc[1]; homerSchool = topSc[0]; biggestHomer = entry.name; }
  });

  // Seed distribution for chart
  const seedDist = {};
  entries.forEach(e => Object.values(e.picks).forEach(p => { seedDist[p.seed] = (seedDist[p.seed] || 0) + 1; }));
  const maxSeedCount = Math.max(...Object.values(seedDist));

  // ── Reusable sub-components ──
  const StatCard = ({ value, label, sub, accent }) => (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14,
      padding: "20px 16px", textAlign: "center", flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: accent ? "var(--accent)" : "var(--text)", lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-body)", marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );

  const SectionTitle = ({ icon, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, marginTop: 36 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3, color: "var(--text)" }}>{title}</h3>
    </div>
  );

  const BarRow = ({ label, sub, value, maxValue, color, suffix = "" }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{label}</span>
          {sub && <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>{sub}</span>}
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: color || "var(--accent)" }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--bg-tertiary)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: color || "var(--accent)",
          width: `${Math.max((value / maxValue) * 100, 2)}%`,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Hero header */}
      <div style={{
        background: `linear-gradient(135deg, var(--payout-grad-start) 0%, var(--payout-grad-end) 100%)`,
        borderRadius: 16, padding: "32px 28px", marginBottom: 8, textAlign: "center",
        border: "1px solid var(--payout-border)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
          The Numbers
        </div>
        <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 6 }}>
          By The Data
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {N} entries · {N * 10} total picks · {totalWrestlers} wrestlers in the field
        </div>
      </div>

      {/* Big number cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <StatCard value={N} label="Entries" sub="$20 each" />
        <StatCard value={N * 10} label="Picks Made" sub="10 per entry" accent />
        <StatCard value={unpickedCount} label="Unpicked" sub={`of ${totalWrestlers} wrestlers`} />
      </div>
      <div style={{
        background: "var(--accent-bg)", borderRadius: 10, padding: "10px 16px",
        fontSize: 13, color: "var(--accent-dark)", textAlign: "center", border: "1px solid var(--accent-border)",
        fontWeight: 600, marginBottom: 0,
      }}>
        {Math.round(unpickedCount / totalWrestlers * 100)}% of the bracket is getting no love — {unpickedCount} wrestlers with zero picks
      </div>

      {/* ── Most Popular Picks ── */}
      <SectionTitle icon="🔥" title="Most Popular Picks" />
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px 12px",
      }}>
        {topWrestlers.slice(0, 10).map((w, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: i < 9 ? "1px solid var(--border-light)" : "none",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: i < 3 ? "var(--accent)" : "var(--bg-tertiary)",
              color: i < 3 ? "#fff" : "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {w.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{w.school} · Seed #{w.seed}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)" }}>{w.pct}%</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{w.count}/{N}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Weight Class Breakdown ── */}
      <SectionTitle icon="⚖️" title="Weight Class Breakdown" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="scoring-grid">
        {weightStats.map(ws => (
          <div key={ws.weight} style={{
            background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)" }}>{ws.weight}lb</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{ws.uniquePicks} different picks</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{ws.topName}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{ws.topSchool}</div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--bg-tertiary)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, background: "var(--accent)",
                width: `${ws.pct}%`, transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>{ws.pct}% of entries</div>
          </div>
        ))}
      </div>

      {/* Consensus vs chaos callout */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 200, background: "var(--accent-bg)", borderRadius: 12, padding: "16px 18px",
          border: "1px solid var(--accent-border)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Most Agreed</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>{mostAgreed.weight}lb</div>
          <div style={{ fontSize: 13, color: "var(--text-body)" }}>{mostAgreed.topName} — <strong>{mostAgreed.pct}%</strong> consensus</div>
        </div>
        <div style={{
          flex: 1, minWidth: 200, background: "var(--danger-bg)", borderRadius: 12, padding: "16px 18px",
          border: "1px solid var(--danger-border)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Most Chaotic</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text)" }}>{mostChaotic.weight}lb</div>
          <div style={{ fontSize: 13, color: "var(--text-body)" }}>Only <strong>{mostChaotic.pct}%</strong> on the fav · {mostChaotic.uniquePicks} different picks</div>
        </div>
      </div>

      {/* ── School Loyalty ── */}
      <SectionTitle icon="🏫" title="School Loyalty" />
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px 12px",
      }}>
        {topSchools.slice(0, 10).map((s, i) => (
          <BarRow key={i} label={s.school} value={s.count} maxValue={topSchools[0].count} suffix=" picks" />
        ))}
      </div>

      {/* ── Seed Distribution ── */}
      <SectionTitle icon="🎲" title="Seed Distribution" />
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120, marginBottom: 8 }}>
          {Array.from({ length: 33 }, (_, i) => i + 1).map(seed => {
            const count = seedDist[seed] || 0;
            const height = count > 0 ? Math.max((count / maxSeedCount) * 100, 3) : 0;
            return (
              <div key={seed} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: "100%", maxWidth: 16, borderRadius: "3px 3px 0 0",
                  height: `${height}%`, minHeight: count > 0 ? 3 : 0,
                  background: seed <= 4 ? "var(--accent)" : seed >= 15 ? "var(--danger)" : "var(--text-faint)",
                  transition: "height 0.6s ease",
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
          <span>Seed 1</span>
          <span>Seed 10</span>
          <span>Seed 20</span>
          <span>Seed 33</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center", fontSize: 12, color: "var(--text-muted)" }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--accent)", marginRight: 4, verticalAlign: -1 }} />Chalk (1-4)</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--text-faint)", marginRight: 4, verticalAlign: -1 }} />Mid (5-14)</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--danger)", marginRight: 4, verticalAlign: -1 }} />Upset (15+)</span>
        </div>
      </div>

      {/* ── Superlatives ── */}
      <SectionTitle icon="🏅" title="Entry Superlatives" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="scoring-grid">
        {[
          { title: "Chalkiest", name: chalkiest, detail: `Avg seed ${(chalkSum / 10).toFixed(1)}`, icon: "📋", color: "var(--accent)" },
          { title: "Upset Hunter", name: wildest, detail: `Avg seed ${(wildSum / 10).toFixed(1)}`, icon: "🎰", color: "var(--danger)" },
          { title: "Most Contrarian", name: mostContrarian, detail: "Most unique combo", icon: "🦄", color: "#a855f7" },
          { title: "Biggest Homer", name: biggestHomer, detail: `${homerCount} picks from ${homerSchool}`, icon: "🏠", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12,
            padding: "18px 16px", display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", lineHeight: 1.2 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Lone Wolves ── */}
      <SectionTitle icon="🐺" title="Lone Wolf Picks" />
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px",
      }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          <strong style={{ color: "var(--text)" }}>{loneWolves.length} wrestlers</strong> picked by exactly one person. High risk, high reward.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {loneWolves.map((w, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "var(--bg-tertiary)", border: "1px solid var(--border)",
              borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-body)",
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: "50%", background: "var(--danger)",
                color: "#fff", fontSize: 9, fontWeight: 800,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>#{w.seed}</span>
              {w.name}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{w.school}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Most Diverse ── */}
      <div style={{
        marginTop: 16, marginBottom: 32, background: "var(--accent-bg)", borderRadius: 10, padding: "14px 20px",
        fontSize: 13, color: "var(--accent-dark)", textAlign: "center", border: "1px solid var(--accent-border)",
        fontWeight: 600,
      }}>
        🌍 Most School Diversity: <strong>{mostDiverse}</strong> — all {maxSchools} picks from different schools
      </div>
    </div>
  );
}

// ─── Payout Page ────────────────────────────────────────────────────────────
function PayoutPage({ entries, leaderboard }) {
  const entryFee = 20;
  const totalEntries = entries.length;
  const totalPot = totalEntries * entryFee;
  const first = Math.round(totalPot * 0.75);
  const second = Math.round(totalPot * 0.15);
  const third = Math.round(totalPot * 0.10);

  const podium = [
    { place: "1st", pct: "75%", amount: first, color: "#FFD700", icon: "🥇", leader: leaderboard[0] },
    { place: "2nd", pct: "15%", amount: second, color: "#C0C0C0", icon: "🥈", leader: leaderboard[1] },
    { place: "3rd", pct: "10%", amount: third, color: "#CD7F32", icon: "🥉", leader: leaderboard[2] },
  ];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Prize Pool Header */}
      <div style={{
        background: `linear-gradient(135deg, var(--payout-grad-start) 0%, var(--payout-grad-end) 100%)`,
        borderRadius: 16, padding: "36px 28px", marginBottom: 20, textAlign: "center",
        border: "1px solid var(--payout-border)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
          Total Prize Pool
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>
          ${totalPot.toLocaleString()}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {totalEntries} entries × ${entryFee} per entry
        </div>
      </div>

      {/* Podium Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {podium.map(({ place, pct, amount, color, icon, leader }) => (
          <div key={place} style={{
            background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14,
            padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
            borderLeft: `5px solid ${color}`,
          }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>{place} Place</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{pct} of pool</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: 32, color: "var(--accent)", lineHeight: 1.1, fontFamily: "'Barlow Condensed', sans-serif" }}>
                ${amount.toLocaleString()}
              </div>
              {leader && (
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>
                  Current leader: <span style={{ color: "var(--text)", fontWeight: 700 }}>{leader.name}</span>
                  <span style={{ color: "var(--text-muted)" }}> ({leader.points} pts)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 16 }}>Payout Breakdown</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Place</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Share</th>
              <th style={{ textAlign: "right", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Payout</th>
            </tr>
          </thead>
          <tbody>
            {podium.map(({ place, pct, amount }, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                <td style={{ padding: "12px", fontWeight: 600, color: "var(--text-body)" }}>{place}</td>
                <td style={{ padding: "12px", textAlign: "center", color: "var(--text-secondary)" }}>{pct}</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "var(--accent)", fontSize: 16 }}>${amount.toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid var(--border)" }}>
              <td style={{ padding: "12px", fontWeight: 700, color: "var(--text)" }}>Total</td>
              <td style={{ padding: "12px", textAlign: "center", color: "var(--text-secondary)" }}>100%</td>
              <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "var(--text)", fontSize: 16 }}>${totalPot.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fun note */}
      <div style={{
        marginTop: 16, background: "var(--accent-bg)", borderRadius: 10, padding: "14px 20px",
        fontSize: 13, color: "var(--accent-dark)", textAlign: "center", border: "1px solid var(--accent-border)",
        fontWeight: 600,
      }}>
        Winner takes the lion's share. Good luck!
      </div>
    </div>
  );
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────
function AdminPanel({ entries, results, setResults }) {
  const [selectedWeight, setSelectedWeight] = useState(WEIGHT_CLASSES[0]);
  const [exportText, setExportText] = useState("");

  // Build lookup of who picked each wrestler
  const pickedByMap = {};
  entries.forEach(entry => {
    const pick = entry.picks[selectedWeight];
    if (pick) {
      const key = `${selectedWeight}-${pick.seed}-${pick.name}`;
      if (!pickedByMap[key]) pickedByMap[key] = [];
      pickedByMap[key].push(entry.name);
    }
  });

  // Show ALL wrestlers for the weight class, with pick info
  const wrestlers = (WRESTLERS_BY_WEIGHT[selectedWeight] || []).map(w => {
    const key = `${selectedWeight}-${w.seed}-${w.name}`;
    return { ...w, key, pickedBy: pickedByMap[key] || [] };
  });

  const updateResult = (key, field, value) => {
    setResults(prev => {
      const curr = prev[key] || { advPoints: 0, placementPoints: 0, wins: [], placement: null };
      return { ...prev, [key]: { ...curr, [field]: value } };
    });
  };

  const addWin = (key, winType, bracket) => {
    setResults(prev => {
      const curr = prev[key] || { advPoints: 0, placementPoints: 0, wins: [], placement: null };
      const wins = [...(curr.wins || []), { type: winType, bracket, round: (curr.wins || []).length + 1 }];
      const advPoints = calcAdvPoints(wins);
      return { ...prev, [key]: { ...curr, wins, advPoints } };
    });
  };

  const removeLastWin = (key) => {
    setResults(prev => {
      const curr = prev[key];
      if (!curr || !curr.wins || curr.wins.length === 0) return prev;
      const wins = curr.wins.slice(0, -1);
      const advPoints = calcAdvPoints(wins);
      return { ...prev, [key]: { ...curr, wins, advPoints } };
    });
  };

  const toggleEliminated = (key) => {
    setResults(prev => {
      const curr = prev[key] || { advPoints: 0, placementPoints: 0, wins: [], placement: null, eliminated: false };
      return { ...prev, [key]: { ...curr, eliminated: !curr.eliminated } };
    });
  };

  const setPlacement = (key, place) => {
    setResults(prev => {
      const curr = prev[key] || { advPoints: 0, placementPoints: 0, wins: [], placement: null };
      const placementPoints = place ? (PLACEMENT_POINTS[place] || 0) : 0;
      return { ...prev, [key]: { ...curr, placement: place, placementPoints } };
    });
  };

  const handleExport = () => {
    setExportText(JSON.stringify(results, null, 2));
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(exportText);
      setResults(parsed);
      setExportText("");
      alert("Results imported successfully!");
    } catch {
      alert("Invalid JSON. Please check and try again.");
    }
  };

  const handleClearWeight = () => {
    if (!confirm(`Clear all results for ${selectedWeight} lbs?`)) return;
    setResults(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${selectedWeight}-`)) delete next[k];
      });
      return next;
    });
  };

  const winTypes = [
    { label: "Decision", value: "decision" },
    { label: "Major Dec", value: "major" },
    { label: "Tech Fall", value: "tech" },
    { label: "Tech (NF)", value: "tech_nf" },
    { label: "Fall/FF/DQ", value: "fall" },
    { label: "Bye", value: "bye" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, color: "var(--text)" }}>⚡ Admin Scoring</h2>
        <span style={{ background: "var(--warning-bg)", color: "var(--warning-text)", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>SECRET</span>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Log wins and set placements for all seeded wrestlers. Picked wrestlers are highlighted.
      </p>

      {/* Weight class selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {WEIGHT_CLASSES.map(w => {
          const hasResults = Object.keys(results).some(k => k.startsWith(`${w}-`));
          return (
            <button key={w} onClick={() => setSelectedWeight(w)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: selectedWeight === w ? "var(--accent)" : hasResults ? "var(--accent-bg)" : "var(--bg-tertiary)",
              color: selectedWeight === w ? "#fff" : hasResults ? "var(--accent-text)" : "var(--text-secondary)",
              fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              transition: "all .15s",
            }}>
              {w}
            </button>
          );
        })}
      </div>

      {/* Wrestlers for this weight */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {wrestlers.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No one picked a wrestler at {selectedWeight} lbs</div>
        )}
        {wrestlers.map(w => {
          const r = results[w.key] || { advPoints: 0, placementPoints: 0, wins: [], placement: null };
          const totalPts = (r.advPoints || 0) + (r.placementPoints || 0);
          return (
            <div key={w.key} style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 12, padding: 20,
              borderLeft: `4px solid ${getSchoolColor(w.school)}`,
            }}>
              {/* Wrestler header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SeedBadge seed={w.seed} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {w.school}
                      {w.pickedBy.length > 0
                        ? <> · <span style={{ color: "var(--accent-text)", fontWeight: 500 }}>{w.pickedBy.length} pick{w.pickedBy.length > 1 ? "s" : ""}</span></>
                        : ""
                      }
                      {r.eliminated && <> · <span style={{ color: "var(--danger)", fontWeight: 600 }}>ELIMINATED</span></>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: totalPts > 0 ? "var(--accent)" : "var(--text-faint)" }}>{totalPts.toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>adv: {(r.advPoints || 0).toFixed(1)} + place: {(r.placementPoints || 0).toFixed(1)}</div>
                </div>
              </div>

              {/* Win log */}
              {r.wins && r.wins.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {r.wins.map((win, i) => (
                    <span key={i} style={{
                      background: win.bracket === "champ" ? "var(--champ-bg)" : "var(--consi-bg)",
                      color: win.bracket === "champ" ? "var(--champ-text)" : "var(--consi-text)",
                      fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    }}>
                      R{win.round}: {win.type} ({win.bracket === "champ" ? "C" : "Con"})
                    </span>
                  ))}
                  <button onClick={() => removeLastWin(w.key)} style={{
                    background: "var(--danger-bg)", border: "none", color: "var(--danger)", fontSize: 11,
                    fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                  }}>✕ Undo</button>
                </div>
              )}

              {/* Add win buttons */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: 0.5 }}>ADD WIN</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {["champ", "consi"].map(bracket => (
                    winTypes.map(wt => (
                      <button key={`${bracket}-${wt.value}`} onClick={() => addWin(w.key, wt.value, bracket)} style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit",
                        background: bracket === "champ" ? "var(--champ-btn-bg)" : "var(--consi-btn-bg)",
                        color: bracket === "champ" ? "var(--champ-btn-text)" : "var(--consi-btn-text)",
                        transition: "all .1s",
                      }}
                        onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"}
                      >
                        {bracket === "champ" ? "C" : "Co"}: {wt.label}
                      </button>
                    ))
                  ))}
                </div>
              </div>

              {/* Placement */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, letterSpacing: 0.5 }}>PLACEMENT</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(place => (
                    <button key={place} onClick={() => setPlacement(w.key, r.placement === place ? null : place)} style={{
                      width: 40, height: 32, borderRadius: 6, fontSize: 13, fontWeight: 700,
                      border: r.placement === place ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: r.placement === place ? "var(--accent-bg)" : "var(--card-bg)",
                      color: r.placement === place ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : place}
                    </button>
                  ))}
                  {r.placement && (
                    <button onClick={() => setPlacement(w.key, null)} style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "none",
                      background: "var(--danger-bg)", color: "var(--danger)", cursor: "pointer", fontWeight: 600,
                    }}>Clear</button>
                  )}
                </div>
              </div>

              {/* Eliminated toggle */}
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => toggleEliminated(w.key)} style={{
                  padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: r.eliminated ? "2px solid var(--danger)" : "1px solid var(--border)",
                  background: r.eliminated ? "var(--danger-bg)" : "var(--card-bg)",
                  color: r.eliminated ? "var(--danger)" : "var(--text-muted)",
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
                }}>
                  {r.eliminated ? "✕ ELIMINATED" : "Mark Eliminated"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Utility buttons */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleExport} style={{
            padding: "10px 20px", borderRadius: 10, background: "var(--bg-tertiary)", border: "none",
            color: "var(--text-body)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>📋 Export Results JSON</button>
          <button onClick={handleClearWeight} style={{
            padding: "10px 20px", borderRadius: 10, background: "var(--danger-bg)", border: "none",
            color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>🗑 Clear {selectedWeight} lbs</button>
          <button onClick={() => { if (confirm("Clear ALL results?")) setResults({}); }} style={{
            padding: "10px 20px", borderRadius: 10, background: "var(--danger-bg)", border: "none",
            color: "var(--danger)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>💣 Reset All</button>
        </div>

        {exportText && (
          <div>
            <textarea
              value={exportText}
              onChange={e => setExportText(e.target.value)}
              style={{
                width: "100%", height: 200, borderRadius: 10, border: "1px solid var(--border)",
                padding: 14, fontSize: 12, fontFamily: "monospace", resize: "vertical",
                outline: "none", background: "var(--input-bg)", color: "var(--text)",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <button onClick={handleImport} style={{
              marginTop: 8, padding: "10px 20px", borderRadius: 10, background: "var(--accent)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>📥 Import Results JSON</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Advancement point calculation from win log
function calcAdvPoints(wins) {
  if (!wins) return 0;
  let total = 0;
  for (const win of wins) {
    const isChamp = win.bracket === "champ";
    switch (win.type) {
      case "decision": total += isChamp ? 1.0 : 0.5; break;
      case "major": total += 1.0; break;
      case "tech": total += 1.5; break;
      case "tech_nf": total += 1.0; break;
      case "fall": total += 2.0; break;
      case "bye": total += isChamp ? 1.0 : 0.5; break;
      default: break;
    }
  }
  return total;
}

// ─── Add Entry ───────────────────────────────────────────────────────────────
function AddEntry({ entries, setEntries, onDone }) {
  const [name, setName] = useState("");
  const [picks, setPicks] = useState({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allPicked = WEIGHT_CLASSES.every(w => picks[w]);
  const hasLow = WEIGHT_CLASSES.some(w => picks[w]?.seed >= 10);
  const hasHigh = WEIGHT_CLASSES.some(w => picks[w] && picks[w].seed <= 9);
  const valid = name.trim() && allPicked && hasLow && hasHigh;

  const handlePick = (weight, wrestlerStr) => {
    if (!wrestlerStr) { setPicks(p => { const n = { ...p }; delete n[weight]; return n; }); return; }
    const [seed, ...rest] = wrestlerStr.split("|");
    const [wName, school] = rest[0].split("~");
    setPicks(p => ({ ...p, [weight]: { seed: Number(seed), name: wName, school } }));
  };

  const handleSubmit = () => {
    if (!name.trim()) { setError("Please enter a username."); return; }
    if (!allPicked) { setError("You must pick a wrestler for every weight class."); return; }
    if (!hasLow) { setError("You must include at least one wrestler seeded #10 or higher (the upset pick!)."); return; }
    if (!hasHigh) { setError("You must include at least one wrestler seeded #1-9."); return; }
    const isDup = entries.some(e => e.name.toLowerCase() === name.trim().toLowerCase());
    if (isDup) { setError("That username already exists. Choose a different name."); return; }
    const newEntry = { id: Date.now(), name: name.trim(), picks, createdAt: new Date().toISOString() };
    setEntries([...entries, newEntry]);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Entry submitted</div>
      <div style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 15 }}>Good luck, {name}! May your picks go far.</div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={onDone} style={{
          padding: "10px 24px", borderRadius: 10, background: "var(--accent)", border: "none",
          color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>View Leaderboard</button>
        <button onClick={() => { setName(""); setPicks({}); setSubmitted(false); setError(""); }} style={{
          padding: "10px 24px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Add Another</button>
      </div>
    </div>
  );

  const seedCounts = Object.values(picks).reduce((acc, p) => { if (p) acc[p.seed >= 10 ? "low" : "high"]++; return acc; }, { high: 0, low: 0 });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 4, color: "var(--text)" }}>Add your picks</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Pick one wrestler per weight class. You must have at least one seed #1-9 AND one seed #10+.
      </p>

      {/* Rules checklist */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          [allPicked, `${Object.keys(picks).length}/10 weights filled`],
          [hasHigh, `Seeds #1-9: ${seedCounts.high} picked`],
          [hasLow, `Seeds #10+: ${seedCounts.low} picked (need \u22651)`],
        ].map(([ok, label], i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: ok ? "var(--accent-bg)" : "var(--bg-secondary)",
            border: `1px solid ${ok ? "var(--accent-border)" : "var(--border)"}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 13,
          }}>
            <span style={{ color: ok ? "var(--accent)" : "var(--text-faint)", fontSize: 14 }}>{ok ? "\u2713" : "\u25CB"}</span>
            <span style={{ color: ok ? "var(--accent-text)" : "var(--text-muted)", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Username */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-body)", marginBottom: 8 }}>Username</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name..."
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10, background: "var(--input-bg)",
            border: "1px solid var(--border)", color: "var(--text)", fontSize: 15,
            fontFamily: "inherit", outline: "none", transition: "border-color .15s",
          }}
          onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,210,106,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Weight class pickers */}
      <div className="picker-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10, marginBottom: 28 }}>
        {WEIGHT_CLASSES.map(w => {
          const pick = picks[w];
          const wrestlers = WRESTLERS_BY_WEIGHT[w];
          return (
            <div key={w} style={{
              background: "var(--card-bg)", border: `1px solid ${pick ? getSchoolColor(pick.school) + "44" : "var(--border)"}`,
              borderRadius: 12, padding: "16px 18px", transition: "border-color .15s",
              borderLeft: pick ? `3px solid ${getSchoolColor(pick.school)}` : "3px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{w} <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>lbs</span></div>
                {pick && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <SeedBadge seed={pick.seed} />
                  <span style={{ fontSize: 12, color: getSchoolColor(pick.school), fontWeight: 600 }}>{pick.school}</span>
                </div>}
              </div>
              <select
                value={pick ? `${pick.seed}|${pick.name}~${pick.school}` : ""}
                onChange={e => handlePick(w, e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, background: "var(--bg-secondary)",
                  border: "1px solid var(--border)", color: "var(--text)", fontSize: 14,
                  fontFamily: "inherit", cursor: "pointer", outline: "none",
                }}
              >
                <option value="">Select a wrestler</option>
                <optgroup label="Seeds #1-9 (chalk)">
                  {wrestlers.filter(r => r.seed <= 9).map(r => (
                    <option key={r.seed} value={`${r.seed}|${r.name}~${r.school}`}>
                      #{r.seed} {r.name} ({r.school})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Seeds #10+ (upset picks)">
                  {wrestlers.filter(r => r.seed >= 10).map(r => (
                    <option key={r.seed} value={`${r.seed}|${r.name}~${r.school}`}>
                      #{r.seed} {r.name} ({r.school})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          );
        })}
      </div>

      {error && <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 10, padding: "12px 16px", color: "var(--danger)", fontSize: 14, marginBottom: 16, fontWeight: 500 }}>{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={!valid}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: valid ? "var(--accent)" : "var(--bg-tertiary)",
          color: valid ? "#fff" : "var(--text-faint)", fontSize: 15,
          fontWeight: 700, cursor: valid ? "pointer" : "not-allowed",
          transition: "all .15s", fontFamily: "inherit",
        }}
      >
        {valid ? "Submit Picks" : "Complete your lineup to submit"}
      </button>
    </div>
  );
}
