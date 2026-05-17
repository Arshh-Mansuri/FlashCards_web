import { useEffect, useState } from "react";
import { getAdminHistory, getAllUsers } from "../api/history";

// Admin-only view: list every user and inspect their full learning history.
export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null); // null = all users
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getAdminHistory(selected)
      .then(setHistory)
      .catch((e) => setError(e.message));
  }, [selected]);

  return (
    <div className="admin-panel">
      <div className="admin-users">
        <h2>Users</h2>
        {loading && <p className="muted">Loading…</p>}
        <button
          className={`user-row${selected === null ? " active" : ""}`}
          onClick={() => setSelected(null)}
        >
          <span>All users</span>
        </button>
        {users.map((u) => (
          <button
            key={u.id}
            className={`user-row${selected === u.id ? " active" : ""}`}
            onClick={() => setSelected(u.id)}
          >
            <span>
              {u.username}
              {u.role === "admin" && <em className="role-tag">admin</em>}
            </span>
            <span className="muted">
              {u.card_count} cards · {u.history_count} studied
            </span>
          </button>
        ))}
      </div>

      <div className="admin-history">
        <h2>
          Learning history
          {selected && (
            <span className="muted">
              {" "}
              — {users.find((u) => u.id === selected)?.username}
            </span>
          )}
        </h2>
        {error && <p className="modal-error">{error}</p>}
        {history.length === 0 ? (
          <p className="muted">No study activity yet.</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Question</th>
                <th>Deck</th>
                <th>Result</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.username}</td>
                  <td>{h.question}</td>
                  <td>{h.deck}</td>
                  <td>
                    <span className={`result-badge ${h.result}`}>
                      {h.result === "known" ? "Knew it" : "Forgot"}
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(h.studied_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
