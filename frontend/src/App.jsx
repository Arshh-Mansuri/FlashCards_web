import { useEffect, useMemo, useState } from "react";
import Flashcard from "./components/Flashcard";
import CardModal from "./components/CardModal";
import SearchBar from "./components/SearchBar";
import AuthPage from "./components/AuthPage";
import AdminPanel from "./components/AdminPanel";
import StatsPanel from "./components/StatsPanel";
import { useAuth } from "./context/auth-context";
import {
  createFlashcard,
  deleteFlashcard,
  getFlashcards,
  updateFlashcard,
} from "./api/flashcards";
import { recordHistory } from "./api/history";
import "./App.css";

export default function App() {
  const { user, signOut } = useAuth();

  const [cards, setCards] = useState([]);
  const [studiedIds, setStudiedIds] = useState(new Set());
  const [modal, setModal] = useState(null); // null | "create" | { card }
  const [deckFilter, setDeckFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("study"); // "study" | "admin"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    getFlashcards()
      .then((data) => active && setCards(data))
      .catch(
        () =>
          active &&
          setError("Could not load your cards. Is the backend running?")
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const decks = ["All", ...new Set(cards.map((c) => c.deck))];

  // Live search + deck filter, recomputed on every keystroke.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      const inDeck = deckFilter === "All" || c.deck === deckFilter;
      if (!inDeck) return false;
      if (!q) return true;
      return (
        c.question.toLowerCase().includes(q) ||
        c.answer.toLowerCase().includes(q) ||
        c.deck.toLowerCase().includes(q)
      );
    });
  }, [cards, deckFilter, search]);

  // Not signed in → auth gate (still one HTML file, just a different view).
  if (!user) return <AuthPage />;

  async function handleSave(data) {
    try {
      if (modal?.card) {
        const updated = await updateFlashcard(modal.card.id, data);
        setCards((p) => p.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createFlashcard(data);
        setCards((p) => [...p, created]);
      }
      setModal(null);
    } catch (e) {
      setError(e.message || "Failed to save flashcard.");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteFlashcard(id);
      setCards((p) => p.filter((c) => c.id !== id));
    } catch (e) {
      setError(e.message || "Failed to delete flashcard.");
    }
  }

  async function handleGrade(id, result) {
    setStudiedIds((p) => new Set(p).add(id));
    try {
      await recordHistory(id, result);
    } catch {
      setError("Couldn't save your progress for that card.");
    }
  }

  function switchDeck(deck) {
    setDeckFilter(deck);
    setStudiedIds(new Set());
  }

  const visible = filtered.filter((c) => !studiedIds.has(c.id));
  const total = filtered.length;
  const done = total - visible.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">Flashcards</h1>
          <div className="header-actions">
            <button
              className="btn secondary"
              onClick={() => setView(view === "stats" ? "study" : "stats")}
            >
              {view === "stats" ? "← Back to study" : "My Stats"}
            </button>
            {user.role === "admin" && (
              <button
                className="btn secondary"
                onClick={() => setView(view === "admin" ? "study" : "admin")}
              >
                {view === "admin" ? "← Back to study" : "Admin"}
              </button>
            )}
            {view === "study" && (
              <button className="btn primary" onClick={() => setModal("create")}>
                + New Card
              </button>
            )}
            <span className="user-chip">
              {user.username}
              <em className="role-tag">{user.role}</em>
            </span>
            <button className="btn ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {view === "admin" ? (
          <AdminPanel />
        ) : view === "stats" ? (
          <StatsPanel />
        ) : (
          <>
            <SearchBar value={search} onChange={setSearch} />

            <div className="toolbar">
              <div className="deck-tabs">
                {decks.map((d) => {
                  const count =
                    d === "All"
                      ? cards.length
                      : cards.filter((c) => c.deck === d).length;
                  return (
                    <button
                      key={d}
                      className={`deck-tab${deckFilter === d ? " active" : ""}`}
                      onClick={() => switchDeck(d)}
                    >
                      {d}
                      <span className="deck-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {total > 0 && (
                <div className="progress-info">
                  <span className="progress-text">
                    {done}/{total} studied
                  </span>
                  {done > 0 && (
                    <button
                      className="btn secondary small"
                      onClick={() => setStudiedIds(new Set())}
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            {total > 0 && (
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {loading ? (
              <div className="empty-state">
                <div className="spinner" />
                <p>Loading cards…</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty-state">
                {cards.length === 0 ? (
                  <>
                    <p className="empty-title">No flashcards yet</p>
                    <p className="empty-sub">
                      Create your first card to get started.
                    </p>
                    <button
                      className="btn primary"
                      onClick={() => setModal("create")}
                    >
                      + New Card
                    </button>
                  </>
                ) : search && filtered.length === 0 ? (
                  <>
                    <p className="empty-title">No matches</p>
                    <p className="empty-sub">
                      Nothing matches “{search}”. Try a different term.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="empty-title">All done!</p>
                    <p className="empty-sub">
                      You've reviewed every card here.
                    </p>
                    <button
                      className="btn primary"
                      onClick={() => setStudiedIds(new Set())}
                    >
                      Start Over
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="cards-grid">
                {visible.map((card) => (
                  <Flashcard
                    key={card.id}
                    card={card}
                    onDelete={handleDelete}
                    onEdit={(c) => setModal({ card: c })}
                    onGrade={handleGrade}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {modal && (
        <CardModal
          initial={modal?.card || null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
