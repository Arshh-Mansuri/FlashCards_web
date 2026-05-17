import { useState } from "react";

export default function CardModal({ initial, onSave, onClose }) {
  // The modal is mounted fresh each time it opens, so props seed state once.
  const [question, setQuestion] = useState(initial?.question || "");
  const [answer, setAnswer] = useState(initial?.answer || "");
  const [deck, setDeck] = useState(initial?.deck || "General");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    onSave({ question: question.trim(), answer: answer.trim(), deck: deck.trim() || "General" });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? "Edit Flashcard" : "New Flashcard"}</h2>
        {error && <p className="modal-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Deck
            <input value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="General" />
          </label>
          <label>
            Question
            <textarea
              value={question}
              onChange={(e) => { setQuestion(e.target.value); setError(""); }}
              placeholder="Enter question..."
              rows={3}
              autoFocus
            />
          </label>
          <label>
            Answer
            <textarea
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); setError(""); }}
              placeholder="Enter answer..."
              rows={3}
            />
          </label>
          <div className="modal-buttons">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {initial ? "Save Changes" : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
