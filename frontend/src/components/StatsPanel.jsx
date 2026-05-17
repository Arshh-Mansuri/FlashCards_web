import { useEffect, useState } from "react";
import { getMyStats } from "../api/history";

// Personal progress dashboard: how many cards the user knew vs forgot,
// overall and broken down by deck.
export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStats()
      .then(setStats)
      .catch((e) => setError(e.message || "Could not load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading your stats…</p>;
  if (error) return <p className="modal-error">{error}</p>;
  if (!stats || stats.total === 0)
    return (
      <div className="empty-state">
        <p className="empty-title">No study activity yet</p>
        <p className="empty-sub">
          Flip and grade a few cards, then come back to see your progress.
        </p>
      </div>
    );

  return (
    <div className="stats-panel">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Total reviews</span>
        </div>
        <div className="stat-card good">
          <span className="stat-num">{stats.known}</span>
          <span className="stat-label">Knew it</span>
        </div>
        <div className="stat-card bad">
          <span className="stat-num">{stats.unknown}</span>
          <span className="stat-label">Forgot</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
      </div>

      <h2 className="stats-subhead">By deck</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Deck</th>
            <th>Knew it</th>
            <th>Forgot</th>
            <th>Total</th>
            <th>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {stats.by_deck.map((d) => (
            <tr key={d.deck}>
              <td>{d.deck}</td>
              <td>
                <span className="result-badge known">{d.known}</span>
              </td>
              <td>
                <span className="result-badge unknown">{d.unknown}</span>
              </td>
              <td>{d.total}</td>
              <td>
                <div className="acc-bar">
                  <div
                    className="acc-fill"
                    style={{ width: `${d.accuracy}%` }}
                  />
                  <span>{d.accuracy}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
