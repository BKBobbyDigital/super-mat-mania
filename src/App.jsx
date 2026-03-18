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
      background: isLow ? "#ef4444" : "#00d26a",
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
    { key: "payout", label: "Payout" },
    // { key: "addPick", label: "Add Entry" },
    ...(adminMode ? [{ key: "admin", label: "⚡ Admin" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
          <div className="header-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={handleIconClick} style={{
                width: 48, height: 48, borderRadius: 12, background: "#00d26a",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", userSelect: "none",
              }}>
                <WrestlingIcon color="#fff" size={30} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5, lineHeight: 1.1, color: "#1a1a1a" }}>Super Mat Mania</div>
                <div style={{ fontWeight: 600, fontSize: 11, color: "#00d26a", letterSpacing: 0.5, lineHeight: 1.3 }}>The Poppy Challenge 2026</div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, lineHeight: 1.3 }}>Mar 19–21 · Rocket Arena, Cleveland OH</div>
              </div>
            </div>
            <nav className="header-nav" style={{ display: "flex", gap: 2 }}>
              {navItems.map(({ key, label }) => (
                <button key={key} onClick={() => setView(key)} style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: view === key ? "#f0fdf4" : "transparent",
                  color: view === key ? "#00b85e" : "#6b7280",
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
        {view === "payout" && <PayoutPage entries={entries} leaderboard={leaderboard} />}
        {view === "addPick" && <AddEntry entries={entries} setEntries={setEntries} onDone={() => setView("leaderboard")} />}
        {view === "admin" && adminMode && <AdminPanel entries={entries} results={results} setResults={setResultsAndSync} />}
      </main>

      <footer style={{
        borderTop: "1px solid #e5e7eb", padding: "24px",
        textAlign: "center", fontSize: 13, color: "#9ca3af", fontWeight: 400,
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
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>No entries yet</div>
        <div style={{ color: "#9ca3af", marginBottom: 28 }}>Be the first to submit your picks for the 2026 NCAA Wrestling Championships</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
        <h2 className="leaderboard-title" style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, color: "#1a1a1a" }}>Leaderboard</h2>
        <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>{leaderboard.length} entries</span>
      </div>

      {/* Column header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "0 18px 10px",
        fontSize: 12, fontWeight: 500, color: "#9ca3af", borderBottom: "1px solid #f3f4f6",
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
              borderBottom: "1px solid #f3f4f6",
              background: isExp ? "#fafafa" : isLeader ? "#f0fdf4" : "#fff",
              transition: "background .15s",
              borderLeft: isLeader ? "3px solid #00d26a" : "3px solid transparent",
            }}>
              {/* Row */}
              <div className="entry-row" style={{
                display: "flex", alignItems: "center", padding: "14px 18px", gap: 14,
                cursor: "pointer",
              }}
                onClick={() => setExpanded(isExp ? null : entry.id)}
                onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = isLeader ? "#e6f9ef" : "#fafafa"; }}
                onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = isLeader ? "#f0fdf4" : "transparent"; }}
              >
                {/* Rank */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: isLeader ? "#00d26a" : !entry.complete ? "#f9fafb" : "#f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14,
                  color: isLeader ? "#fff" : !entry.complete ? "#d1d5db" : "#6b7280",
                  flexShrink: 0,
                }}>
                  {rank}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="entry-name" style={{ fontWeight: 600, fontSize: 16, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name}</div>
                  {!allPicked(entry.picks) && (
                    <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 500, marginTop: 1 }}>
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
                        background: pick ? (isElim ? "#e5e7eb" : getSchoolColor(pick.school)) : "#f3f4f6",
                        color: pick ? "#fff" : "#d1d5db",
                        opacity: isElim ? 0.5 : 1,
                        textDecoration: isElim ? "line-through" : "none",
                        transition: "all .15s",
                      }}>{w}</div>
                    );
                  })}
                </div>

                {/* Score */}
                <div style={{ width: 60, textAlign: "right", flexShrink: 0 }}>
                  <div className="entry-score" style={{ fontWeight: 800, fontSize: 22, color: !entry.complete ? "#d1d5db" : "#1a1a1a", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {entry.score.toFixed(1)}
                  </div>
                </div>

                <div className={isFirst && expanded === null ? "chevron-hint" : ""} style={{ color: "#d1d5db", fontSize: 12, flexShrink: 0, width: 16, textAlign: "center", transition: "transform .2s", transform: isExp ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              {/* Expanded picks */}
              {isExp && (
                <div style={{ borderTop: "1px solid #f3f4f6", padding: "20px 18px", background: "#fafafa" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 16 }}>
                    {WEIGHT_CLASSES.map(w => {
                      const pick = entry.picks[w];
                      const key = pick ? `${w}-${pick.seed}-${pick.name}` : null;
                      const r = key ? results[key] : null;
                      const pts = r ? ((r.advPoints || 0) + (r.placementPoints || 0)) : 0;
                      const isElim = r?.eliminated;
                      return (
                        <div key={w} style={{
                          background: isElim ? "#fafafa" : "#fff", border: "1px solid #e5e7eb",
                          borderRadius: 10, padding: "12px 14px",
                          borderLeft: pick ? `3px solid ${isElim ? "#d1d5db" : getSchoolColor(pick.school)}` : "3px solid #e5e7eb",
                          opacity: isElim ? 0.6 : 1,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: 1 }}>{w} LBS</span>
                            {isElim && <span style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", background: "#fef2f2", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>ELIM</span>}
                          </div>
                          {pick ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                <SeedBadge seed={pick.seed} />
                                <span style={{ fontWeight: 600, fontSize: 14, color: isElim ? "#9ca3af" : "#1a1a1a", textDecoration: isElim ? "line-through" : "none" }}>{pick.name}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "#9ca3af" }}>{pick.school}</div>
                              {r && pts > 0 && <div style={{ fontSize: 12, color: isElim ? "#9ca3af" : "#00d26a", fontWeight: 600, marginTop: 4 }}>+{pts.toFixed(1)} pts</div>}
                            </>
                          ) : (
                            <div style={{ fontSize: 13, color: "#d1d5db" }}>No pick</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {deleteConfirm === entry.id ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#ef4444" }}>Delete this entry?</span>
                        <button onClick={() => { setEntries(entries.filter(e => e.id !== entry.id)); setDeleteConfirm(null); setExpanded(null); }} style={{
                          padding: "6px 14px", borderRadius: 8, background: "#ef4444", border: "none",
                          color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
                        }}>Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{
                          padding: "6px 14px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb",
                          color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                        }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(entry.id); }} style={{
                        padding: "6px 14px", borderRadius: 8, background: "transparent", border: "1px solid #e5e7eb",
                        color: "#9ca3af", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
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
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 4, color: "#1a1a1a" }}>Scoring</h2>
      <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        Each participant picks one wrestler per weight class (10 picks total). Points accumulate as your wrestlers win matches and place at the tournament.
      </p>

      {/* Advancement Points */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 28, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 4 }}>Advancement Points</h3>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Earned each round a picked wrestler wins</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Win Type</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "#9ca3af", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Championship</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "#9ca3af", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Consolation</th>
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
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px", color: "#374151", fontWeight: 500 }}>{type}</td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#00d26a" }}>{champ}</td>
                <td style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#6b7280" }}>{consi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Placement Points */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 28, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 4 }}>Final Placement Points</h3>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>One-time bonus awarded at the end of the tournament (All-American = top 8)</p>
        <div className="scoring-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {Object.entries(PLACEMENT_POINTS).map(([place, pts]) => (
            <div key={place} style={{
              background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "16px 12px", textAlign: "center",
            }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
                {place === "1" ? "1st" : place === "2" ? "2nd" : place === "3" ? "3rd" : `${place}th`}
              </div>
              <div style={{ fontWeight: 800, fontSize: 28, color: "#1a1a1a", lineHeight: 1 }}>
                {pts}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pick Rules */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 16 }}>Pick Rules</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14, color: "#374151" }}>
          {[
            ["1", "Pick one wrestler per weight class (10 picks total)", "#00d26a"],
            ["2", "Must include at least one wrestler seeded #1\u20139 (chalk pick)", "#00d26a"],
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
        marginTop: 16, background: "#fafafa", borderRadius: 10, padding: "14px 20px",
        fontSize: 14, color: "#6b7280", textAlign: "center", border: "1px solid #e5e7eb",
      }}>
        <span style={{ fontWeight: 700 }}>Total Score</span> = sum of all 10 picks' (advancement + placement points)
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
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
        borderRadius: 16, padding: "36px 28px", marginBottom: 20, textAlign: "center",
        border: "1px solid #333",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#00d26a", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
          Total Prize Pool
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif" }}>
          ${totalPot.toLocaleString()}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          {totalEntries} entries × ${entryFee} per entry
        </div>
      </div>

      {/* Podium Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {podium.map(({ place, pct, amount, color, icon, leader }) => (
          <div key={place} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
            padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
            borderLeft: `5px solid ${color}`,
          }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a" }}>{place} Place</span>
                <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{pct} of pool</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: 32, color: "#00d26a", lineHeight: 1.1, fontFamily: "'Barlow Condensed', sans-serif" }}>
                ${amount.toLocaleString()}
              </div>
              {leader && (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontWeight: 500 }}>
                  Current leader: <span style={{ color: "#1a1a1a", fontWeight: 700 }}>{leader.name}</span>
                  <span style={{ color: "#9ca3af" }}> ({leader.points} pts)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div style={{
        background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", marginBottom: 16 }}>Payout Breakdown</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Place</th>
              <th style={{ textAlign: "center", padding: "10px 12px", color: "#9ca3af", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Share</th>
              <th style={{ textAlign: "right", padding: "10px 12px", color: "#9ca3af", fontWeight: 500, fontSize: 12, letterSpacing: 0.5 }}>Payout</th>
            </tr>
          </thead>
          <tbody>
            {podium.map(({ place, pct, amount }, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px", fontWeight: 600, color: "#374151" }}>{place}</td>
                <td style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>{pct}</td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "#00d26a", fontSize: 16 }}>${amount.toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #e5e7eb" }}>
              <td style={{ padding: "12px", fontWeight: 700, color: "#1a1a1a" }}>Total</td>
              <td style={{ padding: "12px", textAlign: "center", color: "#6b7280" }}>100%</td>
              <td style={{ padding: "12px", textAlign: "right", fontWeight: 800, color: "#1a1a1a", fontSize: 16 }}>${totalPot.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fun note */}
      <div style={{
        marginTop: 16, background: "#f0fdf4", borderRadius: 10, padding: "14px 20px",
        fontSize: 13, color: "#15803d", textAlign: "center", border: "1px solid #bbf7d0",
        fontWeight: 600,
      }}>
        Winner takes the lion's share. Good luck, gentlemen.
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
        <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, color: "#1a1a1a" }}>⚡ Admin Scoring</h2>
        <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>SECRET</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>
        Log wins and set placements for all seeded wrestlers. Picked wrestlers are highlighted.
      </p>

      {/* Weight class selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {WEIGHT_CLASSES.map(w => {
          const hasResults = Object.keys(results).some(k => k.startsWith(`${w}-`));
          return (
            <button key={w} onClick={() => setSelectedWeight(w)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: selectedWeight === w ? "#00d26a" : hasResults ? "#f0fdf4" : "#f3f4f6",
              color: selectedWeight === w ? "#fff" : hasResults ? "#00b85e" : "#6b7280",
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
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No one picked a wrestler at {selectedWeight} lbs</div>
        )}
        {wrestlers.map(w => {
          const r = results[w.key] || { advPoints: 0, placementPoints: 0, wins: [], placement: null };
          const totalPts = (r.advPoints || 0) + (r.placementPoints || 0);
          return (
            <div key={w.key} style={{
              background: "#fff",
              border: `1px solid #e5e7eb`,
              borderRadius: 12, padding: 20,
              borderLeft: `4px solid ${getSchoolColor(w.school)}`,
            }}>
              {/* Wrestler header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SeedBadge seed={w.seed} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {w.school}
                      {w.pickedBy.length > 0
                        ? <> · <span style={{ color: "#00b85e", fontWeight: 500 }}>{w.pickedBy.length} pick{w.pickedBy.length > 1 ? "s" : ""}</span></>
                        : ""
                      }
                      {r.eliminated && <> · <span style={{ color: "#ef4444", fontWeight: 600 }}>ELIMINATED</span></>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: totalPts > 0 ? "#00d26a" : "#d1d5db" }}>{totalPts.toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>adv: {(r.advPoints || 0).toFixed(1)} + place: {(r.placementPoints || 0).toFixed(1)}</div>
                </div>
              </div>

              {/* Win log */}
              {r.wins && r.wins.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {r.wins.map((win, i) => (
                    <span key={i} style={{
                      background: win.bracket === "champ" ? "#dbeafe" : "#fef3c7",
                      color: win.bracket === "champ" ? "#1d4ed8" : "#92400e",
                      fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    }}>
                      R{win.round}: {win.type} ({win.bracket === "champ" ? "C" : "Con"})
                    </span>
                  ))}
                  <button onClick={() => removeLastWin(w.key)} style={{
                    background: "#fef2f2", border: "none", color: "#ef4444", fontSize: 11,
                    fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer",
                  }}>✕ Undo</button>
                </div>
              )}

              {/* Add win buttons */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: 0.5 }}>ADD WIN</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {["champ", "consi"].map(bracket => (
                    winTypes.map(wt => (
                      <button key={`${bracket}-${wt.value}`} onClick={() => addWin(w.key, wt.value, bracket)} style={{
                        padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        border: "1px solid #e5e7eb", cursor: "pointer", fontFamily: "inherit",
                        background: bracket === "champ" ? "#eff6ff" : "#fffbeb",
                        color: bracket === "champ" ? "#2563eb" : "#b45309",
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
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, letterSpacing: 0.5 }}>PLACEMENT</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(place => (
                    <button key={place} onClick={() => setPlacement(w.key, r.placement === place ? null : place)} style={{
                      width: 40, height: 32, borderRadius: 6, fontSize: 13, fontWeight: 700,
                      border: r.placement === place ? "2px solid #00d26a" : "1px solid #e5e7eb",
                      background: r.placement === place ? "#f0fdf4" : "#fff",
                      color: r.placement === place ? "#00d26a" : "#6b7280",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : place}
                    </button>
                  ))}
                  {r.placement && (
                    <button onClick={() => setPlacement(w.key, null)} style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, border: "none",
                      background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontWeight: 600,
                    }}>Clear</button>
                  )}
                </div>
              </div>

              {/* Eliminated toggle */}
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => toggleEliminated(w.key)} style={{
                  padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  border: r.eliminated ? "2px solid #ef4444" : "1px solid #e5e7eb",
                  background: r.eliminated ? "#fef2f2" : "#fff",
                  color: r.eliminated ? "#ef4444" : "#9ca3af",
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
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleExport} style={{
            padding: "10px 20px", borderRadius: 10, background: "#f3f4f6", border: "none",
            color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>📋 Export Results JSON</button>
          <button onClick={handleClearWeight} style={{
            padding: "10px 20px", borderRadius: 10, background: "#fef2f2", border: "none",
            color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>🗑 Clear {selectedWeight} lbs</button>
          <button onClick={() => { if (confirm("Clear ALL results?")) setResults({}); }} style={{
            padding: "10px 20px", borderRadius: 10, background: "#fef2f2", border: "none",
            color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>💣 Reset All</button>
        </div>

        {exportText && (
          <div>
            <textarea
              value={exportText}
              onChange={e => setExportText(e.target.value)}
              style={{
                width: "100%", height: 200, borderRadius: 10, border: "1px solid #e5e7eb",
                padding: 14, fontSize: 12, fontFamily: "monospace", resize: "vertical",
                outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#00d26a"}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
            <button onClick={handleImport} style={{
              marginTop: 8, padding: "10px 20px", borderRadius: 10, background: "#00d26a",
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
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#00d26a", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>Entry submitted</div>
      <div style={{ color: "#9ca3af", marginBottom: 32, fontSize: 15 }}>Good luck, {name}! May your picks go far.</div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={onDone} style={{
          padding: "10px 24px", borderRadius: 10, background: "#00d26a", border: "none",
          color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>View Leaderboard</button>
        <button onClick={() => { setName(""); setPicks({}); setSubmitted(false); setError(""); }} style={{
          padding: "10px 24px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb",
          color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Add Another</button>
      </div>
    </div>
  );

  const seedCounts = Object.values(picks).reduce((acc, p) => { if (p) acc[p.seed >= 10 ? "low" : "high"]++; return acc; }, { high: 0, low: 0 });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 4, color: "#1a1a1a" }}>Add your picks</h2>
      <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>
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
            background: ok ? "#f0fdf4" : "#fafafa",
            border: `1px solid ${ok ? "#bbf7d0" : "#e5e7eb"}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 13,
          }}>
            <span style={{ color: ok ? "#00d26a" : "#d1d5db", fontSize: 14 }}>{ok ? "\u2713" : "\u25CB"}</span>
            <span style={{ color: ok ? "#00b85e" : "#9ca3af", fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Username */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Username</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name..."
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 10, background: "#fff",
            border: "1px solid #e5e7eb", color: "#1a1a1a", fontSize: 15,
            fontFamily: "inherit", outline: "none", transition: "border-color .15s",
          }}
          onFocus={e => { e.target.style.borderColor = "#00d26a"; e.target.style.boxShadow = "0 0 0 3px rgba(0,210,106,0.1)"; }}
          onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Weight class pickers */}
      <div className="picker-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10, marginBottom: 28 }}>
        {WEIGHT_CLASSES.map(w => {
          const pick = picks[w];
          const wrestlers = WRESTLERS_BY_WEIGHT[w];
          return (
            <div key={w} style={{
              background: "#fff", border: `1px solid ${pick ? getSchoolColor(pick.school) + "44" : "#e5e7eb"}`,
              borderRadius: 12, padding: "16px 18px", transition: "border-color .15s",
              borderLeft: pick ? `3px solid ${getSchoolColor(pick.school)}` : "3px solid #e5e7eb",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{w} <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>lbs</span></div>
                {pick && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <SeedBadge seed={pick.seed} />
                  <span style={{ fontSize: 12, color: getSchoolColor(pick.school), fontWeight: 600 }}>{pick.school}</span>
                </div>}
              </div>
              <select
                value={pick ? `${pick.seed}|${pick.name}~${pick.school}` : ""}
                onChange={e => handlePick(w, e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, background: "#fafafa",
                  border: "1px solid #e5e7eb", color: "#1a1a1a", fontSize: 14,
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

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 14, marginBottom: 16, fontWeight: 500 }}>{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={!valid}
        style={{
          width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: valid ? "#00d26a" : "#f3f4f6",
          color: valid ? "#fff" : "#d1d5db", fontSize: 15,
          fontWeight: 700, cursor: valid ? "pointer" : "not-allowed",
          transition: "all .15s", fontFamily: "inherit",
        }}
      >
        {valid ? "Submit Picks" : "Complete your lineup to submit"}
      </button>
    </div>
  );
}
